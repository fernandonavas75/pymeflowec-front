import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { startWith, finalize } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { InvoicesService } from '../../../core/services/invoices.service';
import { InvoicePdfService } from '../../../core/services/invoice-pdf.service';
import { ProductsService } from '../../../core/services/products.service';
import { Invoice, InvoiceDetail } from '../../../core/models/invoice.model';
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
  private invoicesService  = inject(InvoicesService);
  private productsService  = inject(ProductsService);
  private pdfService       = inject(InvoicePdfService);
  private snackBar         = inject(MatSnackBar);
  private dialog           = inject(MatDialog);
  authService              = inject(AuthService);

  private allInvoices = signal<Invoice[]>([]);
  loading         = signal(true);
  tabFilter       = signal<'all' | 'issued' | 'cancelled'>('all');
  searchCtrl      = new FormControl('');
  selectedInvoice = signal<Invoice | null>(null);
  drawerLoading   = signal(false);
  actionLoading   = signal(false);
  pdfLoading      = signal(false);

  productPopup        = signal<Product | null>(null);
  productPopupLoading = signal(false);

  private searchQuery = toSignal(
    this.searchCtrl.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

  issuedCount    = computed(() => this.allInvoices().filter(i => i.status === 'ISSUED').length);
  cancelledCount = computed(() => this.allInvoices().filter(i => i.status === 'CANCELLED').length);
  totalCount     = computed(() => this.allInvoices().length);

  totalIssued = computed(() =>
    this.allInvoices().filter(i => i.status === 'ISSUED').reduce((s, i) => s + i.total, 0)
  );
  taxIssued = computed(() => this.totalIssued() * 0.15);

  filteredInvoices = computed(() => {
    let list = this.allInvoices();
    const tab = this.tabFilter();
    if (tab === 'issued')    list = list.filter(i => i.status === 'ISSUED');
    if (tab === 'cancelled') list = list.filter(i => i.status === 'CANCELLED');
    const q = (this.searchQuery() ?? '').toLowerCase();
    if (q) list = list.filter(i =>
      i.invoice_number.toLowerCase().includes(q) ||
      (i.customer?.full_name ?? '').toLowerCase().includes(q)
    );
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
    if (!inv.details) {
      this.drawerLoading.set(true);
      this.invoicesService.getById(inv.id).subscribe({
        next: full => {
          this.selectedInvoice.set(full);
          this.allInvoices.update(list => list.map(i => i.id === full.id ? full : i));
          this.drawerLoading.set(false);
        },
        error: ()   => this.drawerLoading.set(false),
      });
    }
  }

  closeDrawer(): void { this.selectedInvoice.set(null); }

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
}
