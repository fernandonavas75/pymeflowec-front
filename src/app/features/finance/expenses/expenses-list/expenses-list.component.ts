import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { startWith, finalize } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExpensesService } from '../../../../core/services/expenses.service';
import { ExpenseCategoriesService } from '../../../../core/services/expense-categories.service';
import { SuppliersService } from '../../../../core/services/suppliers.service';
import { ExpensePaymentsService } from '../../../../core/services/expense-payments.service';
import {
  Expense,
  ExpensePaymentStatus,
  VoucherType,
  CreateExpenseDto,
  EXPENSE_PAYMENT_STATUS_LABELS,
  VOUCHER_TYPE_LABELS,
  VOUCHER_TYPES,
} from '../../../../core/models/expense.model';
import { ExpenseCategory, CATEGORY_TYPE_LABELS } from '../../../../core/models/expense-category.model';
import { Supplier } from '../../../../core/models/supplier.model';
import {
  ExpensePayment,
  PaymentMethod,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
} from '../../../../core/models/expense-payment.model';
import { AppIconComponent } from '../../../../shared/components/app-icon/app-icon.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-expenses-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppIconComponent],
  templateUrl: './expenses-list.component.html',
})
export class ExpensesListComponent implements OnInit {
  private svc           = inject(ExpensesService);
  private categoriesSvc = inject(ExpenseCategoriesService);
  private suppliersSvc  = inject(SuppliersService);
  private paymentsSvc   = inject(ExpensePaymentsService);
  private dialog        = inject(MatDialog);
  private snackBar      = inject(MatSnackBar);
  private fb            = inject(FormBuilder);
  authService           = inject(AuthService);

  readonly EXPENSE_PAYMENT_STATUS_LABELS = EXPENSE_PAYMENT_STATUS_LABELS;
  readonly VOUCHER_TYPE_LABELS           = VOUCHER_TYPE_LABELS;
  readonly VOUCHER_TYPES                 = VOUCHER_TYPES;
  readonly CATEGORY_TYPE_LABELS          = CATEGORY_TYPE_LABELS;
  readonly PAYMENT_METHOD_LABELS         = PAYMENT_METHOD_LABELS;
  readonly PAYMENT_METHODS               = PAYMENT_METHODS;

  private allExpenses = signal<Expense[]>([]);
  categories = signal<ExpenseCategory[]>([]);
  suppliers  = signal<Supplier[]>([]);

  loading   = signal(true);
  saving    = signal(false);
  annulling = signal(false);

  tab       = signal<'all' | ExpensePaymentStatus>('all');
  selected  = signal<Expense | null>(null);
  modalOpen = signal(false);
  editing   = signal<Expense | null>(null);

  // ── Payments ───────────────────────────────────────────────────
  payments        = signal<ExpensePayment[]>([]);
  paymentsLoading = signal(false);
  showPayForm     = signal(false);
  payFormLoading  = signal(false);
  payMethodSig    = signal<PaymentMethod>('EFECTIVO');

  payForm = new FormGroup({
    amount:             new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    payment_method:     new FormControl<PaymentMethod>('EFECTIVO', { nonNullable: true, validators: Validators.required }),
    payment_date:       new FormControl(''),
    notes:              new FormControl(''),
    transfer_reference: new FormControl(''),
    card_contrapartida: new FormControl(''),
    cheque_number:      new FormControl(''),
  });

  searchCtrl   = new FormControl('');
  dateFromCtrl = new FormControl('');
  dateToCtrl   = new FormControl('');
  categoryCtrl = new FormControl<number | ''>('');

  private searchQuery    = toSignal(this.searchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });
  private dateFrom       = toSignal(this.dateFromCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });
  private dateTo         = toSignal(this.dateToCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });
  private categoryFilter = toSignal(this.categoryCtrl.valueChanges.pipe(startWith('' as number | '')), { initialValue: '' as number | '' });

  form = this.fb.group({
    category_id:        [null as number | null, Validators.required],
    description:        ['', [Validators.required, Validators.minLength(3)]],
    amount:             [null as number | null, [Validators.required, Validators.min(0.01)]],
    supplier_id:        [null as number | null],
    supplier_name_free: [''],
    expense_date:       [''],
    voucher_type:       ['' as VoucherType | ''],
    voucher_number:     [''],
    notes:              [''],
  });

  get isNew(): boolean { return !this.editing(); }

  pendienteCount = computed(() => this.allExpenses().filter(e => e.payment_status === 'PENDIENTE').length);
  parcialCount   = computed(() => this.allExpenses().filter(e => e.payment_status === 'PARCIAL').length);
  pagadoCount    = computed(() => this.allExpenses().filter(e => e.payment_status === 'PAGADO').length);
  anulCount      = computed(() => this.allExpenses().filter(e => e.payment_status === 'ANULADO').length);
  totalCount     = computed(() => this.allExpenses().length);

  hasFilters = computed(() =>
    !!(this.searchQuery() || this.dateFrom() || this.dateTo() || this.categoryFilter()),
  );

  filtered = computed(() => {
    let list = this.allExpenses();

    const t = this.tab();
    if (t !== 'all') list = list.filter(e => e.payment_status === t);

    const catId = this.categoryFilter();
    if (catId) list = list.filter(e => e.category_id === Number(catId));

    const from = this.dateFrom();
    const to   = this.dateTo();
    if (from) list = list.filter(e => (e.expense_date ?? e.created_at.slice(0, 10)) >= from);
    if (to)   list = list.filter(e => (e.expense_date ?? e.created_at.slice(0, 10)) <= to);

    const q = (this.searchQuery() ?? '').toLowerCase();
    if (q) list = list.filter(e =>
      e.description.toLowerCase().includes(q) ||
      (e.supplier?.name ?? '').toLowerCase().includes(q) ||
      (e.supplier_name_free ?? '').toLowerCase().includes(q) ||
      (e.voucher_number ?? '').toLowerCase().includes(q) ||
      (e.category?.name ?? '').toLowerCase().includes(q),
    );

    return list;
  });

  totalFiltered = computed(() =>
    this.filtered()
      .filter(e => e.payment_status !== 'ANULADO')
      .reduce((sum, e) => sum + e.amount, 0),
  );

  ngOnInit(): void {
    this.load();
    this.loadCategories();
    this.loadSuppliers();
  }

  load(): void {
    this.loading.set(true);
    this.svc.list({ limit: 500 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: res => this.allExpenses.set(res.data),
        error: ()  => this.allExpenses.set([]),
      });
  }

  loadCategories(): void {
    this.categoriesSvc.list({ limit: 500 }).subscribe({
      next: data => this.categories.set(data),
      error: ()   => this.categories.set([]),
    });
  }

  loadSuppliers(): void {
    this.suppliersSvc.list({ limit: 500 }).subscribe({
      next: res => this.suppliers.set(res.data ?? []),
      error: ()  => this.suppliers.set([]),
    });
  }

  openDrawer(e: Expense): void {
    this.selected.set(e);
    this.showPayForm.set(false);
    this.payments.set([]);
    if (e.payment_status !== 'ANULADO') {
      this.loadPayments(e.id);
    }
  }

  closeDrawer(): void {
    this.selected.set(null);
    this.payments.set([]);
    this.showPayForm.set(false);
  }

  // ── Payments ──────────────────────────────────────────────────

  loadPayments(expenseId: number): void {
    this.paymentsLoading.set(true);
    this.paymentsSvc.listByExpense(expenseId, { limit: 50 })
      .pipe(finalize(() => this.paymentsLoading.set(false)))
      .subscribe({
        next: res => this.payments.set(res.data),
        error: ()  => this.payments.set([]),
      });
  }

  onPayMethodChange(method: string): void {
    this.payMethodSig.set(method as PaymentMethod);
    const tRef   = this.payForm.get('transfer_reference')!;
    const cCard  = this.payForm.get('card_contrapartida')!;
    const cheque = this.payForm.get('cheque_number')!;
    tRef.clearValidators();
    cCard.clearValidators();
    cheque.clearValidators();
    if (method === 'TRANSFERENCIA') tRef.setValidators(Validators.required);
    else if (method === 'TARJETA_DEBITO' || method === 'TARJETA_CREDITO') cCard.setValidators(Validators.required);
    else if (method === 'CHEQUE') cheque.setValidators(Validators.required);
    tRef.updateValueAndValidity();
    cCard.updateValueAndValidity();
    cheque.updateValueAndValidity();
  }

  openPayForm(): void {
    const exp = this.selected();
    if (!exp) return;
    const pending = parseFloat((+(exp.amount_pending ?? exp.amount)).toFixed(2));
    this.payForm.reset({ payment_method: 'EFECTIVO', payment_date: '', notes: '', transfer_reference: '', card_contrapartida: '', cheque_number: '' });
    this.payForm.get('amount')!.setValidators([Validators.required, Validators.min(0.01), Validators.max(pending)]);
    this.payForm.get('amount')!.setValue(pending > 0 ? pending : null);
    this.payForm.get('amount')!.updateValueAndValidity();
    this.onPayMethodChange('EFECTIVO');
    this.showPayForm.set(true);
  }

  submitPayment(): void {
    if (this.payForm.invalid) { this.payForm.markAllAsTouched(); return; }
    const exp = this.selected();
    if (!exp) return;
    const val = this.payForm.value;
    this.payFormLoading.set(true);
    this.paymentsSvc.create({
      expense_id:         exp.id,
      amount:             val.amount!,
      payment_method:     val.payment_method as PaymentMethod,
      payment_date:       val.payment_date || undefined,
      notes:              val.notes || undefined,
      transfer_reference: val.transfer_reference || undefined,
      card_contrapartida: val.card_contrapartida || undefined,
      cheque_number:      val.cheque_number || undefined,
    }).pipe(finalize(() => this.payFormLoading.set(false)))
      .subscribe({
        next: payment => {
          this.payments.update(list => [payment, ...list]);
          this.showPayForm.set(false);
          this.snackBar.open('Pago registrado', 'OK', { duration: 3000 });
          this.refreshExpense(exp.id);
        },
        error: err => this.snackBar.open(err?.error?.message || 'Error al registrar el pago', 'Cerrar', { duration: 4000 }),
      });
  }

  annulPayment(payment: ExpensePayment): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title:       'Anular pago',
        message:     `¿Anular el pago de $${(+payment.amount).toFixed(2)}? Esta acción no se puede deshacer.`,
        confirmText: 'Anular',
        danger:      true,
      },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.paymentsSvc.annul(payment.id).subscribe({
        next: updated => {
          this.payments.update(list => list.map(p => p.id === updated.id ? updated : p));
          this.snackBar.open('Pago anulado', 'OK', { duration: 3000 });
          const exp = this.selected();
          if (exp) this.refreshExpense(exp.id);
        },
        error: () => this.snackBar.open('Error al anular el pago', 'Cerrar', { duration: 4000 }),
      });
    });
  }

  private refreshExpense(id: number): void {
    this.svc.get(id).subscribe({
      next: updated => {
        this.selected.set(updated);
        this.allExpenses.update(list => list.map(e => e.id === updated.id ? updated : e));
      },
    });
  }

  // ── Expense CRUD ──────────────────────────────────────────────

  openNew(): void {
    this.editing.set(null);
    this.form.reset({ category_id: null, description: '', amount: null, supplier_id: null, supplier_name_free: '', expense_date: '', voucher_type: '', voucher_number: '', notes: '' });
    this.modalOpen.set(true);
  }

  openEdit(e: Expense): void {
    this.editing.set(e);
    this.form.patchValue({
      category_id:        e.category_id,
      description:        e.description,
      amount:             e.amount,
      supplier_id:        e.supplier_id ?? null,
      supplier_name_free: e.supplier_name_free ?? '',
      expense_date:       e.expense_date ? e.expense_date.slice(0, 10) : '',
      voucher_type:       e.voucher_type ?? '',
      voucher_number:     e.voucher_number ?? '',
      notes:              e.notes ?? '',
    });
    this.modalOpen.set(true);
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.value;
    const data: CreateExpenseDto = {
      category_id:        v.category_id!,
      description:        v.description!,
      amount:             v.amount!,
      supplier_id:        v.supplier_id || undefined,
      supplier_name_free: v.supplier_name_free || undefined,
      expense_date:       v.expense_date || undefined,
      voucher_type:       (v.voucher_type as VoucherType) || undefined,
      voucher_number:     v.voucher_number || undefined,
      notes:              v.notes || undefined,
    };
    const obs = this.isNew
      ? this.svc.create(data)
      : this.svc.update(this.editing()!.id, data);
    obs.subscribe({
      next: () => {
        this.snackBar.open(this.isNew ? 'Egreso registrado' : 'Egreso actualizado', 'OK', { duration: 3000 });
        this.modalOpen.set(false);
        this.saving.set(false);
        this.load();
      },
      error: err => {
        this.snackBar.open(err?.error?.message || 'Error al guardar', 'OK', { duration: 4000 });
        this.saving.set(false);
      },
    });
  }

  annulExpense(e: Expense): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title:       'Anular egreso',
        message:     `¿Anular "${e.description}"? Esta acción no se puede revertir.`,
        confirmText: 'Anular',
        danger:      true,
      },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.annulling.set(true);
      this.svc.annul(e.id).subscribe({
        next: updated => {
          this.snackBar.open('Egreso anulado', 'OK', { duration: 3000 });
          this.annulling.set(false);
          if (this.selected()?.id === e.id) this.selected.set(updated);
          this.load();
        },
        error: () => { this.annulling.set(false); },
      });
    });
  }

  clearFilters(): void {
    this.searchCtrl.setValue('');
    this.dateFromCtrl.setValue('');
    this.dateToCtrl.setValue('');
    this.categoryCtrl.setValue('');
  }

  supplierName(e: Expense): string {
    return e.supplier?.name ?? e.supplier_name_free ?? '—';
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(+amount);
  }

  statusClass(s: ExpensePaymentStatus): string {
    const map: Record<ExpensePaymentStatus, string> = {
      PENDIENTE: 'warn',
      PARCIAL:   'accent',
      PAGADO:    'success',
      ANULADO:   'danger',
    };
    return map[s] ?? '';
  }

  payStatusClass(s: string): string {
    const map: Record<string, string> = {
      PAGADO:    'success',
      PENDIENTE: 'warn',
      VENCIDO:   'danger',
      ANULADO:   '',
    };
    return map[s] ?? '';
  }
}
