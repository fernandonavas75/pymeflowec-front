import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { startWith, finalize, from, concatMap, toArray, switchMap, of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { CompanyModulesService } from '../../../core/services/company-modules.service';
import { InvoicesService } from '../../../core/services/invoices.service';
import { InvoicePaymentsService } from '../../../core/services/invoice-payments.service';
import { InvoicePdfService } from '../../../core/services/invoice-pdf.service';
import { ProductsService } from '../../../core/services/products.service';
import { Invoice, InvoiceDetail } from '../../../core/models/invoice.model';
import { InvoicePayment, PaymentMethod, CreateInvoicePaymentDto, PAYMENT_METHOD_LABELS } from '../../../core/models/invoice-payment.model';
import { Product } from '../../../core/models/product.model';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-invoices-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, AppIconComponent],
  templateUrl: './invoices-list.component.html',
})
export class InvoicesListComponent implements OnInit {
  private modulesSvc             = inject(CompanyModulesService);
  private invoicesService        = inject(InvoicesService);
  private invoicePaymentsService = inject(InvoicePaymentsService);
  private productsService        = inject(ProductsService);
  private pdfService             = inject(InvoicePdfService);
  private snackBar               = inject(MatSnackBar);
  private dialog                 = inject(MatDialog);
  authService                    = inject(AuthService);

  readonly PAYMENT_METHOD_LABELS = PAYMENT_METHOD_LABELS;

  hasPaymentsModule = computed(() => this.modulesSvc.approvedCodes().has('MOD_PAYMENTS'));

  private allInvoices = signal<Invoice[]>([]);
  loading         = signal(true);
  tabFilter       = signal<'all' | 'issued' | 'cancelled'>('all');
  payFilter       = signal<'all' | 'PENDIENTE' | 'PARCIAL' | 'COBRADO'>('all');
  searchCtrl      = new FormControl('');
  selectedInvoice = signal<Invoice | null>(null);
  drawerLoading   = signal(false);
  actionLoading   = signal(false);
  pdfLoading      = signal(false);

  // Payments in drawer
  payments        = signal<InvoicePayment[]>([]);
  paymentsLoading = signal(false);
  showPayForm     = signal(false);
  payFormLoading  = signal(false);
  pendingAmount   = signal(0);
  alreadyPaid     = signal(0);
  payForm = new FormGroup({
    amount:             new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    payment_method:     new FormControl('EFECTIVO', Validators.required),
    payment_date:       new FormControl(''),
    notes:              new FormControl(''),
    transfer_reference: new FormControl(''),
    card_contrapartida: new FormControl(''),
  });
  payMethodSig = signal('EFECTIVO');

  // Installment payment modal
  selectedInstallment      = signal<InvoicePayment | null>(null);
  showInstallmentPayModal  = signal(false);
  installPayLoading        = signal(false);
  installPayType           = signal<'full' | 'partial'>('full');
  installPayForm = new FormGroup({
    amount:             new FormControl<number | null>(null),
    payment_method:     new FormControl<PaymentMethod>('EFECTIVO', Validators.required),
    payment_date:       new FormControl(''),
    notes:              new FormControl(''),
    transfer_reference: new FormControl(''),
    card_contrapartida: new FormControl(''),
  });
  installPayMethodSig = signal<PaymentMethod>('EFECTIVO');

  // Installment plan
  showInstallmentModal = signal(false);
  installmentLoading   = signal(false);
  installmentForm = new FormGroup({
    num_installments: new FormControl<number>(3,    [Validators.required, Validators.min(2), Validators.max(24)]),
    amount_per:       new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    start_date:       new FormControl('',           Validators.required),
    frequency:        new FormControl('MONTHLY',    Validators.required),
    payment_method:   new FormControl('EFECTIVO',   Validators.required),
    notes:            new FormControl(''),
  });

  private readonly _instVal = toSignal(
    this.installmentForm.valueChanges.pipe(startWith(null)),
    { initialValue: null }
  );

  installmentPreview = computed(() => {
    this._instVal();
    const val = this.installmentForm.value;
    const n   = val.num_installments ?? 0;
    const amt = val.amount_per ?? 0;
    const sd  = val.start_date ?? '';
    const fr  = val.frequency ?? 'MONTHLY';
    if (n < 2 || amt <= 0 || !sd) return [] as { num: number; date: string; amount: number }[];
    const rows: { num: number; date: string; amount: number }[] = [];
    let d = new Date(sd + 'T12:00:00');
    for (let i = 0; i < n; i++) {
      rows.push({ num: i + 1, date: d.toISOString().slice(0, 10), amount: amt });
      if (fr === 'MONTHLY')       d = new Date(d.getFullYear(), d.getMonth() + 1, d.getDate(), 12);
      else if (fr === 'BIWEEKLY') d = new Date(d.getTime() + 14 * 86400000);
      else                        d = new Date(d.getTime() +  7 * 86400000);
    }
    return rows;
  });

  productPopup        = signal<Product | null>(null);
  productPopupLoading = signal(false);

  // Filter state
  dateFrom       = signal('');
  dateTo         = signal('');
  vendorFilter   = signal('');
  clientFilter   = signal('');
  showDatePanel   = signal(false);
  showVendorPanel = signal(false);
  showClientPanel = signal(false);

  private searchQuery = toSignal(
    this.searchCtrl.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

  issuedCount    = computed(() => this.allInvoices().filter(i => i.status === 'ISSUED').length);
  cancelledCount = computed(() => this.allInvoices().filter(i => i.status === 'CANCELLED').length);
  totalCount     = computed(() => this.allInvoices().length);

  pendingPayCount  = computed(() => this.allInvoices().filter(i => i.payment_status === 'PENDIENTE').length);
  parcialPayCount  = computed(() => this.allInvoices().filter(i => i.payment_status === 'PARCIAL').length);
  cobradoPayCount  = computed(() => this.allInvoices().filter(i => i.payment_status === 'COBRADO').length);

  totalIssued = computed(() =>
    this.allInvoices().filter(i => i.status === 'ISSUED').reduce((s, i) => s + +i.total, 0)
  );
  taxIssued = computed(() => this.totalIssued() * 0.15);

  uniqueVendors = computed(() => {
    const set = new Set<string>();
    for (const inv of this.allInvoices()) {
      const name = (inv as any).createdBy?.full_name as string | undefined;
      if (name) set.add(name);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  });

  uniqueClients = computed(() => {
    const set = new Set<string>();
    for (const inv of this.allInvoices()) {
      if (inv.customer?.full_name) set.add(inv.customer.full_name);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  });

  filteredInvoices = computed(() => {
    let list = this.allInvoices();

    const tab = this.tabFilter();
    if (tab === 'issued')    list = list.filter(i => i.status === 'ISSUED');
    if (tab === 'cancelled') list = list.filter(i => i.status === 'CANCELLED');

    const pay = this.payFilter();
    if (pay !== 'all') list = list.filter(i => i.payment_status === pay);

    const q = (this.searchQuery() ?? '').toLowerCase().trim();
    if (q) list = list.filter(i =>
      i.invoice_number.toLowerCase().includes(q) ||
      (i.customer?.full_name ?? '').toLowerCase().includes(q) ||
      (i.customer?.document_number ?? '').toLowerCase().includes(q)
    );

    const from = this.dateFrom();
    const to   = this.dateTo();
    if (from) list = list.filter(i => i.issue_date.slice(0, 10) >= from);
    if (to)   list = list.filter(i => i.issue_date.slice(0, 10) <= to);

    const vendor = this.vendorFilter();
    if (vendor) list = list.filter(i => (i as any).createdBy?.full_name === vendor);

    const client = this.clientFilter();
    if (client) list = list.filter(i => i.customer?.full_name === client);

    return list;
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.invoicesService.list({ page: 1, limit: 500 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: res => this.allInvoices.set(res.data ?? []),
        error: ()  => this.allInvoices.set([]),
      });
  }

  selectInvoice(inv: Invoice): void {
    this.selectedInvoice.set(inv);
    this.showPayForm.set(false);
    this.showInstallmentModal.set(false);
    this.payments.set([]);
    if (!inv.details) {
      this.drawerLoading.set(true);
      this.invoicesService.getById(inv.id).subscribe({
        next: full => {
          this.selectedInvoice.set(full);
          this.allInvoices.update(list => list.map(i => i.id === full.id ? full : i));
          this.drawerLoading.set(false);
          this.loadPayments(full.id);
        },
        error: () => this.drawerLoading.set(false),
      });
    } else {
      this.loadPayments(inv.id);
    }
  }

  loadPayments(invoiceId: number): void {
    this.paymentsLoading.set(true);
    this.invoicePaymentsService.listByInvoice(invoiceId, { limit: 50 })
      .pipe(finalize(() => this.paymentsLoading.set(false)))
      .subscribe({
        next: res => this.payments.set(res.data),
        error: ()  => this.payments.set([]),
      });
  }

  onPayMethodChange(method: string): void {
    this.payMethodSig.set(method);
    const tRef  = this.payForm.get('transfer_reference')!;
    const cCard = this.payForm.get('card_contrapartida')!;
    tRef.clearValidators();
    cCard.clearValidators();
    if (method === 'TRANSFERENCIA') tRef.setValidators(Validators.required);
    else if (method === 'TARJETA_DEBITO' || method === 'TARJETA_CREDITO') cCard.setValidators(Validators.required);
    tRef.updateValueAndValidity();
    cCard.updateValueAndValidity();
  }

  onInstallPayMethodChange(method: string): void {
    this.installPayMethodSig.set(method as PaymentMethod);
    const tRef  = this.installPayForm.get('transfer_reference')!;
    const cCard = this.installPayForm.get('card_contrapartida')!;
    tRef.clearValidators();
    cCard.clearValidators();
    if (method === 'TRANSFERENCIA') tRef.setValidators(Validators.required);
    else if (method === 'TARJETA_DEBITO' || method === 'TARJETA_CREDITO') cCard.setValidators(Validators.required);
    tRef.updateValueAndValidity();
    cCard.updateValueAndValidity();
  }

  openPayForm(): void {
    this.showInstallmentModal.set(false);
    this.payForm.reset({ payment_method: 'EFECTIVO', payment_date: '', notes: '', transfer_reference: '', card_contrapartida: '' });
    this.onPayMethodChange('EFECTIVO');
    const inv = this.selectedInvoice();
    if (inv) {
      // Calculate from loaded payments — use +p.amount to coerce Sequelize DECIMAL strings
      const cobrado   = this.payments()
        .filter(p => p.status === 'COBRADO')
        .reduce((sum, p) => sum + +p.amount, 0);
      const scheduled = this.payments()
        .filter(p => p.status === 'PENDIENTE' || p.status === 'VENCIDO')
        .reduce((sum, p) => sum + +p.amount, 0);
      const paid    = parseFloat(cobrado.toFixed(2));
      const pending = parseFloat(Math.max(0, +inv.total - cobrado - scheduled).toFixed(2));
      this.alreadyPaid.set(paid);
      this.pendingAmount.set(pending);
      this.payForm.patchValue({ amount: pending > 0 ? pending : null });
      this.payForm.get('amount')!.setValidators([
        Validators.required, Validators.min(0.01), Validators.max(pending),
      ]);
      this.payForm.get('amount')!.updateValueAndValidity();
    }
    this.showPayForm.set(true);
  }

  submitPayment(): void {
    if (this.payForm.invalid) return;
    const inv = this.selectedInvoice();
    if (!inv) return;
    const val = this.payForm.value;
    this.payFormLoading.set(true);
    this.invoicePaymentsService.create({
      invoice_id:         inv.id,
      amount:             val.amount!,
      payment_method:     val.payment_method as any,
      payment_date:       val.payment_date || undefined,
      notes:              val.notes || undefined,
      transfer_reference: val.transfer_reference || undefined,
      card_contrapartida: val.card_contrapartida || undefined,
    }).pipe(finalize(() => this.payFormLoading.set(false)))
      .subscribe({
        next: payment => {
          this.payments.update(list => [payment, ...list]);
          this.showPayForm.set(false);
          this.snackBar.open('Cobro registrado', 'OK', { duration: 3000 });
          // refresh invoice to get updated payment_status
          this.invoicesService.getById(inv.id).subscribe({
            next: updated => {
              this.selectedInvoice.set(updated);
              this.allInvoices.update(list => list.map(i => i.id === updated.id ? updated : i));
            },
          });
        },
        error: () => this.snackBar.open('Error al registrar el cobro', 'Cerrar', { duration: 4000 }),
      });
  }

  openInstallmentModal(): void {
    this.showPayForm.set(false);
    const inv = this.selectedInvoice();
    if (!inv) return;
    const cobrado   = this.payments().filter(p => p.status === 'COBRADO').reduce((s, p) => s + +p.amount, 0);
    const scheduled = this.payments().filter(p => p.status === 'PENDIENTE' || p.status === 'VENCIDO').reduce((s, p) => s + +p.amount, 0);
    const pending   = parseFloat(Math.max(0, +inv.total - cobrado - scheduled).toFixed(2));
    this.pendingAmount.set(pending);
    const n = 3;
    this.installmentForm.reset({
      num_installments: n,
      amount_per:       +( pending / n).toFixed(2),
      start_date:       '',
      frequency:        'MONTHLY',
      payment_method:   'EFECTIVO',
      notes:            '',
    });
    this.showInstallmentModal.set(true);
  }

  recalcAmountPer(): void {
    const n = this.installmentForm.value.num_installments ?? 0;
    if (n >= 2) {
      this.installmentForm.patchValue({ amount_per: +(this.pendingAmount() / n).toFixed(2) });
    }
  }

  submitInstallments(): void {
    if (this.installmentForm.invalid) return;
    const inv     = this.selectedInvoice();
    const preview = this.installmentPreview();
    if (!inv || preview.length === 0) return;
    const val = this.installmentForm.value;
    const n   = preview.length;
    this.installmentLoading.set(true);
    const dtos: CreateInvoicePaymentDto[] = preview.map(row => ({
      invoice_id:         inv.id,
      amount:             row.amount,
      payment_method:     val.payment_method as PaymentMethod,
      due_date:           row.date,
      installment_number: row.num,
      installment_total:  n,
      status:             'PENDIENTE' as const,
      notes:              val.notes || undefined,
    }));
    from(dtos).pipe(
      concatMap(dto => this.invoicePaymentsService.create(dto)),
      toArray(),
      finalize(() => this.installmentLoading.set(false))
    ).subscribe({
      next: created => {
        this.payments.update(list => [...[...created].reverse(), ...list]);
        this.showInstallmentModal.set(false);
        this.snackBar.open(`${created.length} cuotas programadas`, 'OK', { duration: 3000 });
        this.invoicesService.getById(inv.id).subscribe({
          next: updated => {
            this.selectedInvoice.set(updated);
            this.allInvoices.update(list => list.map(i => i.id === updated.id ? updated : i));
          },
        });
      },
      error: () => {
        this.snackBar.open('Error al programar las cuotas', 'Cerrar', { duration: 4000 });
        this.loadPayments(inv.id);
      },
    });
  }

  openInstallmentPayModal(pay: InvoicePayment): void {
    if (pay.status !== 'PENDIENTE' && pay.status !== 'VENCIDO') return;
    this.selectedInstallment.set(pay);
    this.installPayType.set('full');
    const initMethod = pay.payment_method ?? 'EFECTIVO';
    this.installPayForm.reset({
      amount:             null,
      payment_method:     initMethod,
      payment_date:       '',
      notes:              '',
      transfer_reference: '',
      card_contrapartida: '',
    });
    this.installPayForm.get('amount')!.clearValidators();
    this.installPayForm.get('amount')!.updateValueAndValidity();
    this.onInstallPayMethodChange(initMethod);
    this.showInstallmentPayModal.set(true);
  }

  setInstallPayType(type: 'full' | 'partial'): void {
    this.installPayType.set(type);
    const ctrl = this.installPayForm.get('amount')!;
    if (type === 'partial') {
      const max = +(this.selectedInstallment()?.amount ?? 0);
      ctrl.setValidators([Validators.required, Validators.min(0.01), Validators.max(+(max - 0.01).toFixed(2))]);
    } else {
      ctrl.clearValidators();
    }
    ctrl.updateValueAndValidity();
  }

  closeInstallmentPayModal(): void {
    this.showInstallmentPayModal.set(false);
    this.selectedInstallment.set(null);
  }

  submitInstallmentPay(): void {
    if (this.installPayForm.invalid) return;
    const pay = this.selectedInstallment();
    const inv = this.selectedInvoice();
    if (!pay || !inv) return;
    const val       = this.installPayForm.value;
    const isFull    = this.installPayType() === 'full';
    const paidAmt   = isFull ? +pay.amount : +(val.amount ?? 0);
    const remainder = +(+pay.amount - paidAmt).toFixed(2);

    this.installPayLoading.set(true);
    this.invoicePaymentsService.annul(pay.id).pipe(
      concatMap(() => this.invoicePaymentsService.create({
        invoice_id:         inv.id,
        amount:             paidAmt,
        payment_method:     val.payment_method as PaymentMethod,
        payment_date:       val.payment_date || undefined,
        installment_number: pay.installment_number ?? undefined,
        installment_total:  pay.installment_total ?? undefined,
        notes:              val.notes || undefined,
        transfer_reference: val.transfer_reference || undefined,
        card_contrapartida: val.card_contrapartida || undefined,
      })),
      concatMap(() => {
        if (remainder > 0.009) {
          return this.invoicePaymentsService.create({
            invoice_id:         inv.id,
            amount:             remainder,
            payment_method:     val.payment_method as PaymentMethod,
            due_date:           pay.due_date ?? undefined,
            installment_number: pay.installment_number ?? undefined,
            installment_total:  pay.installment_total ?? undefined,
            status:             'PENDIENTE',
            notes:              `Saldo cuota ${pay.installment_number ?? ''}`.trim(),
          });
        }
        return of(null);
      }),
      finalize(() => this.installPayLoading.set(false))
    ).subscribe({
      next: () => {
        this.closeInstallmentPayModal();
        this.snackBar.open(remainder > 0.009 ? 'Abono registrado' : 'Cuota pagada', 'OK', { duration: 3000 });
        this.loadPayments(inv.id);
        this.invoicesService.getById(inv.id).subscribe({
          next: updated => {
            this.selectedInvoice.set(updated);
            this.allInvoices.update(list => list.map(i => i.id === updated.id ? updated : i));
          },
        });
      },
      error: () => {
        this.snackBar.open('Error al registrar el pago', 'Cerrar', { duration: 4000 });
        this.loadPayments(inv.id);
      },
    });
  }

  annulPayment(payment: InvoicePayment): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Anular cobro',
        message: `¿Anular el cobro de $${payment.amount.toFixed(2)}? Esta acción no se puede deshacer.`,
        confirmText: 'Anular',
        danger: true,
      },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.invoicePaymentsService.annul(payment.id).subscribe({
        next: updated => {
          this.payments.update(list => list.map(p => p.id === updated.id ? updated : p));
          const inv = this.selectedInvoice();
          if (inv) {
            this.invoicesService.getById(inv.id).subscribe({
              next: full => {
                this.selectedInvoice.set(full);
                this.allInvoices.update(list => list.map(i => i.id === full.id ? full : i));
              },
            });
          }
          this.snackBar.open('Cobro anulado', 'OK', { duration: 3000 });
        },
        error: () => this.snackBar.open('Error al anular el cobro', 'Cerrar', { duration: 4000 }),
      });
    });
  }

  closeDrawer(): void {
    this.selectedInvoice.set(null);
    this.payments.set([]);
    this.showPayForm.set(false);
    this.showInstallmentModal.set(false);
  }

  async downloadPdf(): Promise<void> {
    const inv = this.selectedInvoice();
    if (!inv) return;
    this.pdfLoading.set(true);
    try {
      await this.pdfService.download(inv);
      this.snackBar.open('PDF descargado', 'OK', { duration: 3000 });
    } catch {
      this.snackBar.open('Error al generar el PDF', 'Cerrar', { duration: 4000 });
    } finally {
      this.pdfLoading.set(false);
    }
  }

  cancelInvoice(): void {
    const inv = this.selectedInvoice();
    if (!inv) return;
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancelar factura',
        message: '¿Cancelar esta factura? Esta acción no se puede deshacer.',
        confirmText: 'Cancelar factura',
        danger: true,
      },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.actionLoading.set(true);
      this.invoicesService.cancel(inv.id).subscribe({
        next: updated => {
          this.selectedInvoice.set(updated);
          this.allInvoices.update(list => list.map(i => i.id === updated.id ? updated : i));
          this.actionLoading.set(false);
          this.snackBar.open('Factura cancelada', 'OK', { duration: 3000 });
        },
        error: () => this.actionLoading.set(false),
      });
    });
  }

  openProductPopup(detail: InvoiceDetail, event: MouseEvent): void {
    event.stopPropagation();
    if (!detail.product_id) return;
    this.productPopupLoading.set(true);
    this.productPopup.set(detail.product ?? null);
    this.productsService.getById(detail.product_id).subscribe({
      next: p  => { this.productPopup.set(p); this.productPopupLoading.set(false); },
      error: () => this.productPopupLoading.set(false),
    });
  }

  closeProductPopup(): void {
    this.productPopup.set(null);
    this.productPopupLoading.set(false);
  }

  @HostListener('document:click')
  closeAllPanels(): void {
    this.showDatePanel.set(false);
    this.showVendorPanel.set(false);
    this.showClientPanel.set(false);
  }

  toggleDatePanel(e: MouseEvent): void {
    e.stopPropagation();
    const next = !this.showDatePanel();
    this.closeAllPanels();
    this.showDatePanel.set(next);
  }

  toggleVendorPanel(e: MouseEvent): void {
    e.stopPropagation();
    const next = !this.showVendorPanel();
    this.closeAllPanels();
    this.showVendorPanel.set(next);
  }

  toggleClientPanel(e: MouseEvent): void {
    e.stopPropagation();
    const next = !this.showClientPanel();
    this.closeAllPanels();
    this.showClientPanel.set(next);
  }

  clearDateFilter(): void {
    this.dateFrom.set('');
    this.dateTo.set('');
    this.showDatePanel.set(false);
  }

  stockPct(p: Product): number {
    return Math.min(100, Math.round((p.stock / Math.max(p.min_stock * 2, 1)) * 100));
  }

  stockState(p: Product): 'low' | 'out' | '' {
    return p.stock === 0 ? 'out' : p.stock <= p.min_stock ? 'low' : '';
  }

  formatDateTime(date: string): string {
    const d = new Date(date);
    const datePart = d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit' });
    const timePart = d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
    return `${datePart} · ${timePart}`;
  }

  formatDateLong(date: string): string {
    const d = new Date(date);
    const datePart = d.toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' });
    const timePart = d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
    return `${datePart} · ${timePart}`;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }
}
