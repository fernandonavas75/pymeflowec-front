import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { startWith, finalize, from, concatMap, toArray, forkJoin } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { InvoicesService } from '../../../core/services/invoices.service';
import { InvoicePaymentsService } from '../../../core/services/invoice-payments.service';
import { ExpensesService } from '../../../core/services/expenses.service';
import { ExpensePaymentsService } from '../../../core/services/expense-payments.service';
import { AuthService } from '../../../core/services/auth.service';
import { Invoice } from '../../../core/models/invoice.model';
import { InvoicePayment, PAYMENT_METHOD_LABELS } from '../../../core/models/invoice-payment.model';
import { Expense, ExpensePaymentStatus, EXPENSE_PAYMENT_STATUS_LABELS, VOUCHER_TYPE_LABELS } from '../../../core/models/expense.model';
import { ExpensePayment } from '../../../core/models/expense-payment.model';
import { ExpenseCategoriesService } from '../../../core/services/expense-categories.service';
import { ExpenseCategory } from '../../../core/models/expense-category.model';
import { ProductsService } from '../../../core/services/products.service';
import { PettyCashService } from '../../../core/services/petty-cash.service';
import { Product } from '../../../core/models/product.model';
import { PettyCash, PettyCashMovement, MOVEMENT_TYPE_LABELS } from '../../../core/models/petty-cash.model';

type FinanceTab = 'ingresos' | 'egresos' | 'compras' | 'ventas' | 'cxc' | 'cxp' | 'reportes';

interface TabDef {
  id: FinanceTab;
  label: string;
  icon: string;
  description: string;
}

const TABS: TabDef[] = [
  { id: 'ingresos',  label: 'Ingresos',           icon: 'trending_up',    description: 'Facturas emitidas, cobros y cuentas por cobrar' },
  { id: 'egresos',   label: 'Egresos y Gastos',   icon: 'trending_down',  description: 'Gastos operacionales clasificados por categoría' },
  { id: 'compras',   label: 'Compras',             icon: 'local_shipping', description: 'Registro de compras y facturas a proveedores' },
  { id: 'ventas',    label: 'Ventas',              icon: 'receipt_long',   description: 'Detalle de ventas por cliente, producto y forma de pago' },
  { id: 'cxc',       label: 'Cuentas por Cobrar', icon: 'arrow_up_circle',description: 'Clientes que deben dinero a la empresa' },
  { id: 'cxp',       label: 'Cuentas por Pagar',  icon: 'arrow_dn_circle',description: 'Deudas de la empresa con proveedores' },
  { id: 'reportes',  label: 'Reportes',            icon: 'bar_chart',      description: 'Resúmenes, métricas y exportación de datos' },
];

/** 2π × r=38, viewBox 100×100 */
const DONUT_CIRC = 238.76;

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppIconComponent],
  templateUrl: './finance-dashboard.component.html',
  styles: [`
    /* ── Coming soon ──────────────────────────────────────────────── */
    .fin-coming-soon {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 12px; min-height: 52vh;
      padding: 48px 24px; text-align: center;
    }
    .fin-cs-icon {
      display: flex; align-items: center; justify-content: center;
      width: 72px; height: 72px; border-radius: var(--radius-lg);
      background: var(--accent-soft); color: var(--accent); margin-bottom: 4px;
    }
    .fin-cs-title { margin: 0; font-size: 1.25rem; font-weight: 600; color: var(--text); }
    .fin-cs-desc  { margin: 0; font-size: 0.875rem; color: var(--text-muted); max-width: 340px; line-height: 1.5; }
    .fin-cs-badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 12px; border-radius: 999px; font-size: 0.75rem; font-weight: 500;
      background: var(--warn-soft); color: var(--warn); margin-top: 4px;
    }
    .fin-cs-badge::before {
      content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--warn);
    }

    /* ── CxC layout ──────────────────────────────────────────────── */
    .cxc-kpi-strip {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px;
    }
    .cxc-kpi {
      background: var(--surface); border: 1px solid var(--border-ds);
      border-radius: var(--radius-ds); padding: 16px 18px;
    }
    .cxc-kpi-label { font-size: 0.72rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.05em; color: var(--text-subtle); margin-bottom: 6px; }
    .cxc-kpi-value { font-size: 1.5rem; font-weight: 700; color: var(--text); line-height: 1.1; }
    .cxc-kpi-sub   { font-size: 0.75rem; color: var(--text-muted); margin-top: 3px; }

    .cxc-top-row {
      display: grid; grid-template-columns: 260px 1fr; gap: 16px; margin-bottom: 16px; align-items: start;
    }
    .pie-card {
      background: var(--surface); border: 1px solid var(--border-ds);
      border-radius: var(--radius-ds); padding: 20px;
    }
    .pie-card-title { font-size: 0.78rem; font-weight: 600; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 14px; }
    .pie-wrap { position: relative; width: 130px; height: 130px; margin: 0 auto 16px; }
    .pie-center {
      position: absolute; inset: 0; display: flex; flex-direction: column;
      align-items: center; justify-content: center; text-align: center;
    }
    .pie-center-val  { font-size: 1.1rem; font-weight: 700; color: var(--text); line-height: 1.1; }
    .pie-center-label{ font-size: 0.65rem; color: var(--text-muted); }
    .pie-legend { display: flex; flex-direction: column; gap: 10px; }
    .pie-legend-item { display: flex; align-items: center; gap: 10px; }
    .pie-legend-dot  { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .pie-legend-text { flex: 1; }
    .pie-legend-name { font-size: 0.78rem; color: var(--text-muted); }
    .pie-legend-val  { font-size: 0.85rem; font-weight: 600; color: var(--text); }
    .pie-empty { display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 24px 0; color: var(--text-subtle); font-size: 0.8rem; text-align: center; }

    .cxc-summary-card {
      background: var(--surface); border: 1px solid var(--border-ds);
      border-radius: var(--radius-ds); padding: 20px;
      display: flex; flex-direction: column; gap: 12px;
    }
    .cxc-summary-title { font-size: 0.78rem; font-weight: 600; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: 0.05em; }
    .cxc-summary-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 0; border-bottom: 1px solid var(--border-ds);
    }
    .cxc-summary-row:last-child { border-bottom: none; }
    .cxc-summary-key { font-size: 0.82rem; color: var(--text-muted); display: flex; align-items: center; gap: 8px; }
    .cxc-summary-val { font-size: 0.92rem; font-weight: 600; color: var(--text); }

    /* ── Table action button ─────────────────────────────────────── */
    .cxc-row-btn {
      padding: 4px 10px; font-size: 0.75rem; border-radius: var(--radius-sm-ds);
      border: 1px solid var(--accent); background: transparent; color: var(--accent);
      cursor: pointer; white-space: nowrap;
      transition: background 0.15s, color 0.15s;
    }
    .cxc-row-btn:hover { background: var(--accent-soft); }

    /* ── Drawer payment section ──────────────────────────────────── */
    .pay-list { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
    .pay-item {
      display: flex; align-items: flex-start; justify-content: space-between;
      padding: 10px 12px; background: var(--surface-2);
      border-radius: var(--radius-sm-ds); gap: 8px;
    }
    .pay-item-left  { display: flex; flex-direction: column; gap: 2px; }
    .pay-item-method{ font-size: 0.78rem; font-weight: 600; color: var(--text); }
    .pay-item-date  { font-size: 0.72rem; color: var(--text-muted); }
    .pay-item-right { text-align: right; flex-shrink: 0; }
    .pay-item-amt   { font-size: 0.88rem; font-weight: 700; }
    .pay-item-status{ font-size: 0.68rem; padding: 2px 7px; border-radius: 999px; font-weight: 600; }

    .pay-stat-cobrado { color: var(--success); }
    .pay-stat-anulado { color: var(--text-subtle); text-decoration: line-through; }
    .pay-stat-pendiente { color: var(--warn); }

    .pay-badge-cobrado  { background: var(--success-soft); color: var(--success); }
    .pay-badge-anulado  { background: var(--surface-3); color: var(--text-subtle); }
    .pay-badge-pendiente{ background: var(--warn-soft); color: var(--warn); }

    .pay-form-inline {
      margin-top: 8px; padding: 14px; background: var(--surface-2);
      border-radius: var(--radius-ds); display: flex; flex-direction: column; gap: 10px;
    }
    .pay-form-title { font-size: 0.75rem; font-weight: 600; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: 0.04em; }

    /* ── Drawer KPI strip ───────────────────────────────────────── */
    .drawer-kpi-strip { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 12px 0; }
    .drawer-kpi { background: var(--surface-2); border-radius: var(--radius-sm-ds); padding: 10px 12px; }
    .drawer-kpi-label { font-size: 0.68rem; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.04em; color: var(--text-subtle); margin-bottom: 3px; }
    .drawer-kpi-val   { font-size: 1rem; font-weight: 700; color: var(--text); }

    .due-est { font-size: 0.7rem; color: var(--text-muted); margin-top: 2px; }
  `],
})
export class FinanceDashboardComponent {
  private invoicesService        = inject(InvoicesService);
  private invoicePaymentsService = inject(InvoicePaymentsService);
  private expensesService        = inject(ExpensesService);
  private expensePaymentsService = inject(ExpensePaymentsService);
  private categoriesSvc          = inject(ExpenseCategoriesService);
  private productsService        = inject(ProductsService);
  private pettyCashService       = inject(PettyCashService);
  private snackBar               = inject(MatSnackBar);
  authService                    = inject(AuthService);

  readonly tabs                              = TABS;
  readonly PAYMENT_METHOD_LABELS             = PAYMENT_METHOD_LABELS;
  readonly DONUT_CIRC                        = DONUT_CIRC;
  readonly EXPENSE_PAYMENT_STATUS_LABELS     = EXPENSE_PAYMENT_STATUS_LABELS;
  readonly VOUCHER_TYPE_LABELS               = VOUCHER_TYPE_LABELS;
  activeTab = signal<FinanceTab>('ingresos');

  // ── Ingresos data ────────────────────────────────────────────────
  private allIngresosInvoices = signal<Invoice[]>([]);
  private allIngresosPayments = signal<InvoicePayment[]>([]);
  ingresosLoading             = signal(false);
  private ingresosLoaded      = false;

  ingresosPeriod    = signal<'semana' | '30dias' | 'mes' | 'anual'>('30dias');
  ingresosSearchCtrl   = new FormControl('');
  ingresosDateFromCtrl = new FormControl('');
  ingresosDateToCtrl   = new FormControl('');

  private ingresosSearch   = toSignal(this.ingresosSearchCtrl.valueChanges.pipe(startWith('')),   { initialValue: '' });
  private ingresosDateFrom = toSignal(this.ingresosDateFromCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });
  private ingresosDateTo   = toSignal(this.ingresosDateToCtrl.valueChanges.pipe(startWith('')),   { initialValue: '' });

  private ingresosCutoff = computed<string>(() => {
    const period = this.ingresosPeriod();
    const now    = new Date();
    if (period === 'semana') { const d = new Date(now); d.setDate(d.getDate() - 6);               return d.toISOString().slice(0, 10); }
    if (period === 'mes')    { return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10); }
    if (period === 'anual')  { const d = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1); return d.toISOString().slice(0, 10); }
    const d = new Date(now); d.setDate(d.getDate() - 29); return d.toISOString().slice(0, 10);
  });

  ingresosFiltered = computed(() => {
    const from = this.ingresosDateFrom() || this.ingresosCutoff();
    const to   = this.ingresosDateTo();
    const q    = (this.ingresosSearch() ?? '').toLowerCase().trim();
    let list   = this.allIngresosInvoices().filter(i => i.status === 'ISSUED');
    list = list.filter(i => (i.issue_date ?? '').slice(0, 10) >= from);
    if (to) list = list.filter(i => (i.issue_date ?? '').slice(0, 10) <= to);
    if (q)  list = list.filter(i =>
      i.invoice_number.toLowerCase().includes(q) ||
      (i.customer?.full_name ?? '').toLowerCase().includes(q)
    );
    return list;
  });

  ingresosTotalFacturado = computed(() => this.ingresosFiltered().reduce((s, i) => s + +i.total, 0));
  ingresosTotalCobrado   = computed(() => this.ingresosFiltered().reduce((s, i) => s + +(i.amount_paid ?? 0), 0));
  ingresosTotalPendiente = computed(() =>
    this.ingresosFiltered()
      .filter(i => i.payment_status === 'PENDIENTE' || i.payment_status === 'PARCIAL')
      .reduce((s, i) => s + +(i.amount_pending ?? 0), 0)
  );
  ingresosNumFacturas    = computed(() => this.ingresosFiltered().length);
  ingresosTicketPromedio = computed(() =>
    this.ingresosNumFacturas() > 0 ? this.ingresosTotalFacturado() / this.ingresosNumFacturas() : 0
  );

  private ingresosFilteredPayments = computed(() => {
    const from = this.ingresosDateFrom() || this.ingresosCutoff();
    const to   = this.ingresosDateTo();
    let list   = this.allIngresosPayments().filter(p => p.status === 'COBRADO');
    list = list.filter(p => (p.payment_date || p.created_at).slice(0, 10) >= from);
    if (to) list = list.filter(p => (p.payment_date || p.created_at).slice(0, 10) <= to);
    return list;
  });

  ingresosEfectivo      = computed(() => this.ingresosFilteredPayments().filter(p => p.payment_method === 'EFECTIVO').reduce((s, p) => s + +p.amount, 0));
  ingresosTransferencia = computed(() => this.ingresosFilteredPayments().filter(p => p.payment_method === 'TRANSFERENCIA').reduce((s, p) => s + +p.amount, 0));
  ingresosTarjeta       = computed(() => this.ingresosFilteredPayments().filter(p => p.payment_method === 'TARJETA_DEBITO' || p.payment_method === 'TARJETA_CREDITO').reduce((s, p) => s + +p.amount, 0));
  ingresosCheque        = computed(() => this.ingresosFilteredPayments().filter(p => p.payment_method === 'CHEQUE').reduce((s, p) => s + +p.amount, 0));
  ingresosOtro          = computed(() => this.ingresosFilteredPayments().filter(p => p.payment_method === 'OTRO').reduce((s, p) => s + +p.amount, 0));

  ingresosChartData = computed<{ label: string; value: number }[]>(() => {
    const period   = this.ingresosPeriod();
    const invoices = this.allIngresosInvoices().filter(i => i.status === 'ISSUED');
    const now      = new Date();

    if (period === 'semana') {
      return Array.from({ length: 7 }, (_, i) => {
        const d   = new Date(now); d.setDate(d.getDate() - (6 - i));
        const key = d.toISOString().slice(0, 10);
        return { label: d.toLocaleDateString('es-EC', { weekday: 'short' }),
                 value: invoices.filter(inv => inv.issue_date?.slice(0, 10) === key).reduce((s, inv) => s + +inv.total, 0) };
      });
    }

    if (period === 'mes') {
      const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      return Array.from({ length: days }, (_, i) => {
        const d   = new Date(now.getFullYear(), now.getMonth(), i + 1);
        const key = d.toISOString().slice(0, 10);
        return { label: (i % 5 === 0 || i === days - 1) ? String(i + 1) : '',
                 value: invoices.filter(inv => inv.issue_date?.slice(0, 10) === key).reduce((s, inv) => s + +inv.total, 0) };
      });
    }

    if (period === 'anual') {
      return Array.from({ length: 12 }, (_, i) => {
        const d     = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
        const year  = d.getFullYear();
        const month = d.getMonth();
        return { label: d.toLocaleDateString('es-EC', { month: 'short' }),
                 value: invoices.filter(inv => {
                   const dt = new Date(inv.issue_date);
                   return dt.getFullYear() === year && dt.getMonth() === month;
                 }).reduce((s, inv) => s + +inv.total, 0) };
      });
    }

    // 30dias default
    return Array.from({ length: 30 }, (_, i) => {
      const d   = new Date(now); d.setDate(d.getDate() - (29 - i));
      const key = d.toISOString().slice(0, 10);
      return { label: (i % 6 === 0 || i === 29) ? d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit' }) : '',
               value: invoices.filter(inv => inv.issue_date?.slice(0, 10) === key).reduce((s, inv) => s + +inv.total, 0) };
    });
  });

  ingresosChartEmpty = computed(() => this.ingresosChartData().every(d => d.value === 0));

  ingresosChartBars = computed<{ x: number; w: number; h: number; y: number; label: string; val: number }[]>(() => {
    const data = this.ingresosChartData();
    if (!data.length) return [];
    const maxVal = Math.max(...data.map(d => d.value), 0.01);
    const svgW   = 580;
    const startX = 10;
    const itemW  = svgW / data.length;
    const gap    = Math.max(itemW * 0.18, 2);
    return data.map((d, i) => {
      const w = Math.max(itemW - gap, 1);
      const h = (d.value / maxVal) * 100;
      const x = startX + i * itemW + gap / 2;
      return { x, w, h, y: 100 - h, label: d.label, val: d.value };
    });
  });

  // ── Ventas data ──────────────────────────────────────────────────
  private allVentasInvoices = signal<Invoice[]>([]);
  ventasLoading        = signal(false);
  ventasDetailsLoading = signal(false);
  private ventasDetailMap  = signal<Map<number, Invoice>>(new Map());
  private ventasLoaded     = false;

  ventasPeriod     = signal<'semana' | '30dias' | 'anual'>('30dias');
  ventasSearchCtrl = new FormControl('');
  private ventasSearch = toSignal(
    this.ventasSearchCtrl.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

  ventasFiltered = computed(() => {
    const period = this.ventasPeriod();
    const q      = (this.ventasSearch() ?? '').toLowerCase().trim();
    const now    = new Date();
    let cutoff: string;
    if (period === 'semana') {
      const d = new Date(now); d.setDate(d.getDate() - 6);
      cutoff = d.toISOString().slice(0, 10);
    } else if (period === '30dias') {
      const d = new Date(now); d.setDate(d.getDate() - 29);
      cutoff = d.toISOString().slice(0, 10);
    } else {
      const d = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);
      cutoff = d.toISOString().slice(0, 10);
    }
    let list = this.allVentasInvoices()
      .filter(i => i.status === 'ISSUED')
      .filter(i => (i.issue_date ?? '').slice(0, 10) >= cutoff);
    if (q) list = list.filter(i =>
      i.invoice_number.toLowerCase().includes(q) ||
      (i.customer?.full_name ?? '').toLowerCase().includes(q)
    );
    return list;
  });

  ventasTotalFacturado = computed(() => this.ventasFiltered().reduce((s, i) => s + +i.total, 0));
  ventasTotalSubtotal  = computed(() => this.ventasFiltered().reduce((s, i) => s + +i.subtotal, 0));
  ventasTotalIva       = computed(() => this.ventasFiltered().reduce((s, i) => s + +i.tax_amount, 0));
  ventasNumFacturas    = computed(() => this.ventasFiltered().length);
  ventasTicketPromedio = computed(() =>
    this.ventasNumFacturas() > 0 ? this.ventasTotalFacturado() / this.ventasNumFacturas() : 0
  );
  ventasClientesUnicos = computed(() =>
    new Set(this.ventasFiltered().map(i => i.customer_id).filter(Boolean)).size
  );

  ventasChartData = computed<{ label: string; value: number }[]>(() => {
    const period   = this.ventasPeriod();
    const invoices = this.allVentasInvoices().filter(i => i.status === 'ISSUED');
    const now      = new Date();

    if (period === 'semana') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now); d.setDate(d.getDate() - (6 - i));
        const key   = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString('es-EC', { weekday: 'short' });
        return { label, value: invoices.filter(inv => inv.issue_date?.slice(0, 10) === key)
                                       .reduce((s, inv) => s + +inv.total, 0) };
      });
    }

    if (period === '30dias') {
      return Array.from({ length: 30 }, (_, i) => {
        const d = new Date(now); d.setDate(d.getDate() - (29 - i));
        const key   = d.toISOString().slice(0, 10);
        const label = (i % 6 === 0 || i === 29)
          ? d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit' })
          : '';
        return { label, value: invoices.filter(inv => inv.issue_date?.slice(0, 10) === key)
                                       .reduce((s, inv) => s + +inv.total, 0) };
      });
    }

    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const [year, month] = [d.getFullYear(), d.getMonth()];
      const label = d.toLocaleDateString('es-EC', { month: 'short' });
      return {
        label,
        value: invoices.filter(inv => {
          const dt = new Date(inv.issue_date);
          return dt.getFullYear() === year && dt.getMonth() === month;
        }).reduce((s, inv) => s + +inv.total, 0),
      };
    });
  });

  ventasChartMaxVal = computed(() => Math.max(...this.ventasChartData().map(d => d.value), 0));

  ventasChartBars = computed<{ x: number; w: number; h: number; y: number; label: string; val: number }[]>(() => {
    const data = this.ventasChartData();
    if (!data.length) return [];
    const maxVal = Math.max(...data.map(d => d.value), 0.01);
    const maxH   = 100;
    const svgW   = 580;
    const startX = 10;
    const itemW  = svgW / data.length;
    const gap    = Math.max(itemW * 0.18, 2);
    return data.map((d, i) => {
      const w = Math.max(itemW - gap, 1);
      const h = (d.value / maxVal) * maxH;
      const x = startX + i * itemW + gap / 2;
      return { x, w, h, y: maxH - h, label: d.label, val: d.value };
    });
  });

  ventasTopProduct = computed<{ name: string; qty: number; total: number } | null>(() => {
    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const detailMap  = this.ventasDetailMap();
    const productMap = new Map<string, { qty: number; total: number }>();

    for (const inv of detailMap.values()) {
      if ((inv.issue_date ?? '').slice(0, 10) < monthStart) continue;
      for (const d of inv.details ?? []) {
        const cur = productMap.get(d.product_name) ?? { qty: 0, total: 0 };
        productMap.set(d.product_name, { qty: cur.qty + +d.quantity, total: cur.total + +d.line_total });
      }
    }

    let top = { name: '', qty: 0, total: 0 };
    for (const [name, v] of productMap.entries()) {
      if (v.qty > top.qty) top = { name, ...v };
    }
    return top.name ? top : null;
  });

  // ── CxC data ─────────────────────────────────────────────────────
  private allCxcInvoices = signal<Invoice[]>([]);
  cxcLoading   = signal(false);
  private cxcLoaded = false;

  cxcSearchCtrl = new FormControl('');
  private cxcSearch = toSignal(
    this.cxcSearchCtrl.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

  // KPIs
  cxcPendingCount  = computed(() => this.allCxcInvoices().filter(i => i.payment_status === 'PENDIENTE').length);
  cxcParcialCount  = computed(() => this.allCxcInvoices().filter(i => i.payment_status === 'PARCIAL').length);
  cxcTotalPending  = computed(() => this.allCxcInvoices().reduce((s, i) => s + +(i.amount_pending ?? 0), 0));
  cxcUniqueClients = computed(() => new Set(this.allCxcInvoices().map(i => i.customer_id).filter(Boolean)).size);
  cxcAvgPending    = computed(() => {
    const n = this.allCxcInvoices().length;
    return n > 0 ? this.cxcTotalPending() / n : 0;
  });

  // Donut chart arc lengths
  cxcPendingLen = computed(() => {
    const total = this.cxcPendingCount() + this.cxcParcialCount();
    return total > 0 ? (this.cxcPendingCount() / total) * DONUT_CIRC : 0;
  });
  cxcParcialLen     = computed(() => DONUT_CIRC - this.cxcPendingLen());
  cxcPendingPct     = computed(() => {
    const total = this.cxcPendingCount() + this.cxcParcialCount();
    return total > 0 ? Math.round((this.cxcPendingCount() / total) * 100) : 0;
  });
  cxcParcialPct     = computed(() => 100 - this.cxcPendingPct());
  cxcHasData        = computed(() => (this.cxcPendingCount() + this.cxcParcialCount()) > 0);

  // Filtered table list
  cxcFiltered = computed(() => {
    let list = this.allCxcInvoices();
    const q  = (this.cxcSearch() ?? '').toLowerCase().trim();
    if (q) list = list.filter(i =>
      i.invoice_number.toLowerCase().includes(q) ||
      (i.customer?.full_name ?? '').toLowerCase().includes(q)
    );
    return list;
  });

  // ── CxC drawer ───────────────────────────────────────────────────
  cxcSelected        = signal<Invoice | null>(null);
  cxcDrawerLoading   = signal(false);
  cxcPayments        = signal<InvoicePayment[]>([]);
  cxcPaymentsLoading = signal(false);
  cxcShowPayForm     = signal(false);
  cxcPayFormLoading  = signal(false);
  cxcPendingAmount   = signal(0);
  cxcAlreadyPaid     = signal(0);
  cxcPayMethodSig    = signal('EFECTIVO');

  cxcPayForm = new FormGroup({
    amount:             new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    payment_method:     new FormControl('EFECTIVO', Validators.required),
    payment_date:       new FormControl(''),
    notes:              new FormControl(''),
    transfer_reference: new FormControl(''),
    card_contrapartida: new FormControl(''),
  });

  // ── CxP data ─────────────────────────────────────────────────────
  private allCxpExpenses = signal<Expense[]>([]);
  cxpLoading   = signal(false);
  private cxpLoaded = false;

  cxpSearchCtrl = new FormControl('');
  private cxpSearch = toSignal(
    this.cxpSearchCtrl.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

  cxpPendingCount    = computed(() => this.allCxpExpenses().filter(e => e.payment_status === 'PENDIENTE').length);
  cxpParcialCount    = computed(() => this.allCxpExpenses().filter(e => e.payment_status === 'PARCIAL').length);
  cxpTotalPending    = computed(() => this.allCxpExpenses().reduce((s, e) => s + +(e.amount_pending ?? e.amount), 0));
  cxpUniqueSuppliers = computed(() =>
    new Set(
      this.allCxpExpenses()
        .map(e => e.supplier_id ?? e.supplier_name_free ?? null)
        .filter(Boolean)
    ).size
  );
  cxpAvgPending = computed(() => {
    const n = this.allCxpExpenses().length;
    return n > 0 ? this.cxpTotalPending() / n : 0;
  });

  cxpPendingLen = computed(() => {
    const total = this.cxpPendingCount() + this.cxpParcialCount();
    return total > 0 ? (this.cxpPendingCount() / total) * DONUT_CIRC : 0;
  });
  cxpParcialLen  = computed(() => DONUT_CIRC - this.cxpPendingLen());
  cxpPendingPct  = computed(() => {
    const total = this.cxpPendingCount() + this.cxpParcialCount();
    return total > 0 ? Math.round((this.cxpPendingCount() / total) * 100) : 0;
  });
  cxpParcialPct  = computed(() => 100 - this.cxpPendingPct());
  cxpHasData     = computed(() => (this.cxpPendingCount() + this.cxpParcialCount()) > 0);

  cxpFiltered = computed(() => {
    let list = this.allCxpExpenses();
    const q  = (this.cxpSearch() ?? '').toLowerCase().trim();
    if (q) list = list.filter(e =>
      e.description.toLowerCase().includes(q) ||
      (e.supplier?.name ?? '').toLowerCase().includes(q) ||
      (e.supplier_name_free ?? '').toLowerCase().includes(q) ||
      (e.category?.name ?? '').toLowerCase().includes(q)
    );
    return list;
  });

  // ── CxP drawer ───────────────────────────────────────────────────
  cxpSelected        = signal<Expense | null>(null);
  cxpDrawerLoading   = signal(false);
  cxpPayments        = signal<ExpensePayment[]>([]);
  cxpPaymentsLoading = signal(false);
  cxpShowPayForm     = signal(false);
  cxpPayFormLoading  = signal(false);
  cxpPendingAmount   = signal(0);
  cxpAlreadyPaid     = signal(0);
  cxpPayMethodSig    = signal('EFECTIVO');

  cxpPayForm = new FormGroup({
    amount:             new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    payment_method:     new FormControl('EFECTIVO', Validators.required),
    payment_date:       new FormControl(''),
    notes:              new FormControl(''),
    transfer_reference: new FormControl(''),
    card_contrapartida: new FormControl(''),
  });

  // ── Compras data (subconjunto de allEgresos) ─────────────────────
  comprasSearchCtrl   = new FormControl('');
  comprasDateFromCtrl = new FormControl('');
  comprasDateToCtrl   = new FormControl('');

  private comprasSearch   = toSignal(this.comprasSearchCtrl.valueChanges.pipe(startWith('')),   { initialValue: '' });
  private comprasDateFrom = toSignal(this.comprasDateFromCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });
  private comprasDateTo   = toSignal(this.comprasDateToCtrl.valueChanges.pipe(startWith('')),   { initialValue: '' });

  comprasFiltered = computed(() => {
    let list = this.allEgresos().filter(e =>
      e.voucher_type === 'FACTURA' &&
      (e.supplier_id != null || (e.supplier_name_free ?? '').trim() !== '')
    );
    const from = this.comprasDateFrom();
    const to   = this.comprasDateTo();
    if (from) list = list.filter(e => (e.expense_date ?? e.created_at.slice(0, 10)) >= from);
    if (to)   list = list.filter(e => (e.expense_date ?? e.created_at.slice(0, 10)) <= to);
    const q = (this.comprasSearch() ?? '').toLowerCase().trim();
    if (q) list = list.filter(e =>
      e.description.toLowerCase().includes(q) ||
      (e.supplier?.name ?? '').toLowerCase().includes(q) ||
      (e.supplier_name_free ?? '').toLowerCase().includes(q) ||
      (e.voucher_number ?? '').toLowerCase().includes(q)
    );
    return list;
  });

  private comprasActive   = computed(() => this.comprasFiltered().filter(e => e.payment_status !== 'ANULADO'));
  comprasTotal            = computed(() => this.comprasActive().reduce((s, e) => s + +e.amount, 0));
  comprasTotalSubtotal    = computed(() => this.comprasTotal() / 1.15);
  comprasTotalIva         = computed(() => this.comprasTotal() - this.comprasTotalSubtotal());
  comprasNumCompras       = computed(() => this.comprasActive().length);
  comprasUniqueProviders  = computed(() =>
    new Set(
      this.comprasActive()
        .map(e => e.supplier_id ?? e.supplier_name_free ?? null)
        .filter(Boolean)
    ).size
  );

  comprasSubtotal(amount: number): number { return +amount / 1.15; }
  comprasIva(amount: number): number { return +amount - +amount / 1.15; }

  clearComprasFilters(): void {
    this.comprasSearchCtrl.setValue('');
    this.comprasDateFromCtrl.setValue('');
    this.comprasDateToCtrl.setValue('');
  }

  // ── Egresos data ──────────────────────────────────────────────────
  private allEgresos    = signal<Expense[]>([]);
  egresosLoading        = signal(false);
  private egresosLoaded = false;
  egresosCategories     = signal<ExpenseCategory[]>([]);

  egresosTab = signal<'all' | ExpensePaymentStatus>('all');

  egresosSearchCtrl   = new FormControl('');
  egresosCategoryCtrl = new FormControl<number | ''>('');
  egresosDateFromCtrl = new FormControl('');
  egresosDateToCtrl   = new FormControl('');

  private egresosSearch    = toSignal(this.egresosSearchCtrl.valueChanges.pipe(startWith('')),                                             { initialValue: '' });
  private egresosCatFilter = toSignal(this.egresosCategoryCtrl.valueChanges.pipe(startWith('' as number | '')), { initialValue: '' as number | '' });
  private egresosDateFrom  = toSignal(this.egresosDateFromCtrl.valueChanges.pipe(startWith('')),                                           { initialValue: '' });
  private egresosDateTo    = toSignal(this.egresosDateToCtrl.valueChanges.pipe(startWith('')),                                             { initialValue: '' });

  egresosFiltered = computed(() => {
    let list = this.allEgresos();
    const t = this.egresosTab();
    if (t !== 'all') list = list.filter(e => e.payment_status === t);
    const catId = this.egresosCatFilter();
    if (catId) list = list.filter(e => e.category_id === Number(catId));
    const from = this.egresosDateFrom();
    const to   = this.egresosDateTo();
    if (from) list = list.filter(e => (e.expense_date ?? e.created_at.slice(0, 10)) >= from);
    if (to)   list = list.filter(e => (e.expense_date ?? e.created_at.slice(0, 10)) <= to);
    const q = (this.egresosSearch() ?? '').toLowerCase();
    if (q) list = list.filter(e =>
      e.description.toLowerCase().includes(q) ||
      (e.supplier?.name ?? '').toLowerCase().includes(q) ||
      (e.supplier_name_free ?? '').toLowerCase().includes(q) ||
      (e.category?.name ?? '').toLowerCase().includes(q),
    );
    return list;
  });

  egresosAllCount       = computed(() => this.allEgresos().length);
  egresosPendienteCount = computed(() => this.allEgresos().filter(e => e.payment_status === 'PENDIENTE').length);
  egresosParcialCount   = computed(() => this.allEgresos().filter(e => e.payment_status === 'PARCIAL').length);
  egresosPagadoCount    = computed(() => this.allEgresos().filter(e => e.payment_status === 'PAGADO').length);
  egresosAnuladoCount   = computed(() => this.allEgresos().filter(e => e.payment_status === 'ANULADO').length);

  egresosTotal     = computed(() => this.egresosFiltered().filter(e => e.payment_status !== 'ANULADO').reduce((s, e) => s + +e.amount, 0));
  egresosPagado    = computed(() => this.egresosFiltered().filter(e => e.payment_status !== 'ANULADO').reduce((s, e) => s + +(e.amount_paid ?? 0), 0));
  egresosPendiente = computed(() => this.egresosFiltered().filter(e => e.payment_status === 'PENDIENTE' || e.payment_status === 'PARCIAL').reduce((s, e) => s + +(e.amount_pending ?? e.amount), 0));

  egresosTopCats = computed(() => {
    const map = new Map<string, number>();
    for (const e of this.egresosFiltered().filter(x => x.payment_status !== 'ANULADO')) {
      const cat = e.category?.name ?? 'Sin categoría';
      map.set(cat, (map.get(cat) ?? 0) + +e.amount);
    }
    return Array.from(map.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  });
  egresosChartMax = computed(() => Math.max(...this.egresosTopCats().map(c => c.total), 0.01));

  // Egresos drawer
  egresosSelected        = signal<Expense | null>(null);
  egresosDrawerLoading   = signal(false);
  egresosPayments        = signal<ExpensePayment[]>([]);
  egresosPaymentsLoading = signal(false);
  egresosShowPayForm     = signal(false);
  egresosPayFormLoading  = signal(false);
  egresosPendingAmount   = signal(0);
  egresosPayMethodSig    = signal('EFECTIVO');

  egresosPayForm = new FormGroup({
    amount:             new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    payment_method:     new FormControl('EFECTIVO', Validators.required),
    payment_date:       new FormControl(''),
    notes:              new FormControl(''),
    transfer_reference: new FormControl(''),
    card_contrapartida: new FormControl(''),
    cheque_number:      new FormControl(''),
  });

  // ── Reportes data ─────────────────────────────────────────────────
  reportesProducts    = signal<Product[]>([]);
  reportesPettyCash   = signal<PettyCash | null>(null);
  reportesPcMovements = signal<PettyCashMovement[]>([]);
  reportesLoading     = signal(false);
  private reportesLoaded = false;

  readonly MONTH_NAMES          = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  readonly MOVEMENT_TYPE_LABELS = MOVEMENT_TYPE_LABELS;
  reportesYear  = signal(new Date().getFullYear());
  reportesMonth = signal(new Date().getMonth() + 1);

  private reportesFrom = computed(() => {
    const y = this.reportesYear(), m = this.reportesMonth();
    return `${y}-${String(m).padStart(2, '0')}-01`;
  });

  private reportesTo = computed(() => {
    const y = this.reportesYear(), m = this.reportesMonth();
    const lastDay = new Date(y, m, 0).getDate();
    return `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  });

  private reportesPeriodInvoices = computed(() => {
    const from = this.reportesFrom(), to = this.reportesTo();
    return this.allIngresosInvoices().filter(inv =>
      inv.status === 'ISSUED' &&
      (inv.issue_date ?? '').slice(0, 10) >= from &&
      (inv.issue_date ?? '').slice(0, 10) <= to
    );
  });

  private reportesPeriodExpenses = computed(() => {
    const from = this.reportesFrom(), to = this.reportesTo();
    return this.allEgresos().filter(e =>
      e.payment_status !== 'ANULADO' &&
      (e.expense_date ?? e.created_at.slice(0, 10)) >= from &&
      (e.expense_date ?? e.created_at.slice(0, 10)) <= to
    );
  });

  reportesTotalVentas    = computed(() => this.reportesPeriodInvoices().reduce((s, i) => s + +i.total, 0));
  reportesTotalGastos    = computed(() => this.reportesPeriodExpenses().reduce((s, e) => s + +e.amount, 0));
  reportesGanancia       = computed(() => this.reportesTotalVentas() - this.reportesTotalGastos());
  reportesNumFacturas    = computed(() => this.reportesPeriodInvoices().length);
  reportesNumGastos      = computed(() => this.reportesPeriodExpenses().length);
  reportesSubtotalVentas = computed(() => this.reportesPeriodInvoices().reduce((s, i) => s + +(i.subtotal ?? 0), 0));
  reportesIvaCobrado     = computed(() => this.reportesPeriodInvoices().reduce((s, i) => s + +(i.tax_amount ?? 0), 0));
  reportesIvaPagado      = computed(() =>
    this.reportesPeriodExpenses()
      .filter(e => e.voucher_type === 'FACTURA')
      .reduce((s, e) => s + (+e.amount - +e.amount / 1.15), 0)
  );
  reportesIvaBalance = computed(() => this.reportesIvaCobrado() - this.reportesIvaPagado());

  reportesTopClients = computed(() => {
    const map = new Map<number, { name: string; count: number; total: number }>();
    for (const inv of this.reportesPeriodInvoices()) {
      const id  = inv.customer_id ?? 0;
      const cur = map.get(id) ?? { name: inv.customer?.full_name ?? 'Consumidor Final', count: 0, total: 0 };
      map.set(id, { ...cur, count: cur.count + 1, total: cur.total + +inv.total });
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 10);
  });

  reportesTopProducts = computed(() => {
    const from = this.reportesFrom(), to = this.reportesTo();
    const productMap = new Map<string, { qty: number; total: number }>();
    for (const inv of this.ventasDetailMap().values()) {
      const d = (inv.issue_date ?? '').slice(0, 10);
      if (d < from || d > to) continue;
      for (const det of inv.details ?? []) {
        const cur = productMap.get(det.product_name) ?? { qty: 0, total: 0 };
        productMap.set(det.product_name, { qty: cur.qty + +det.quantity, total: cur.total + +det.line_total });
      }
    }
    return Array.from(productMap.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);
  });

  reportesCxcTotal = computed(() => this.allCxcInvoices().reduce((s, i) => s + +(i.amount_pending ?? 0), 0));
  reportesCxpTotal = computed(() => this.allCxpExpenses().reduce((s, e) => s + +(e.amount_pending ?? e.amount), 0));

  reportesLowStock = computed(() =>
    this.reportesProducts()
      .filter(p => p.status === 'ACTIVE' && p.stock <= (p.min_stock > 0 ? p.min_stock : 5))
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 10)
  );

  reportesPcBalance    = computed(() => this.reportesPettyCash()?.current_balance ?? 0);
  reportesPcOpening    = computed(() => this.reportesPettyCash()?.opening_amount ?? 0);
  reportesPcMovsRecent = computed(() => this.reportesPcMovements().slice(0, 5));

  reportesIsCurrentMonth = computed(() => {
    const now = new Date();
    return this.reportesYear() === now.getFullYear() && this.reportesMonth() === now.getMonth() + 1;
  });

  reportesMonthlyChart = computed<{ month: string; ventas: number; gastos: number }[]>(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d     = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const year  = d.getFullYear(), month = d.getMonth();
      const ventas = this.allIngresosInvoices()
        .filter(inv => inv.status === 'ISSUED')
        .filter(inv => { const dt = new Date(inv.issue_date); return dt.getFullYear() === year && dt.getMonth() === month; })
        .reduce((s, inv) => s + +inv.total, 0);
      const gastos = this.allEgresos()
        .filter(e => e.payment_status !== 'ANULADO')
        .filter(e => { const dt = new Date(e.expense_date ?? e.created_at); return dt.getFullYear() === year && dt.getMonth() === month; })
        .reduce((s, e) => s + +e.amount, 0);
      return { month: d.toLocaleDateString('es-EC', { month: 'short', year: '2-digit' }), ventas, gastos };
    });
  });

  reportesChartMax = computed(() =>
    Math.max(...this.reportesMonthlyChart().flatMap(d => [d.ventas, d.gastos]), 0.01)
  );

  reportesChartBars = computed<{ xV: number; xG: number; barW: number; hV: number; hG: number; yV: number; yG: number; xLabel: number; month: string; ventas: number; gastos: number }[]>(() => {
    const data   = this.reportesMonthlyChart();
    const max    = this.reportesChartMax();
    const maxH   = 100, usableW = 560, startX = 10;
    const groupW = usableW / data.length;
    const barW   = Math.max((groupW - 12) / 2 - 2, 4);
    return data.map((d, i) => {
      const gx  = startX + i * groupW;
      const xV  = gx + (groupW - barW * 2 - 4) / 2;
      const xG  = xV + barW + 4;
      const hV  = (d.ventas / max) * maxH;
      const hG  = (d.gastos / max) * maxH;
      return { xV, xG, barW, hV, hG, yV: maxH - hV, yG: maxH - hG, xLabel: gx + groupW / 2, month: d.month, ventas: d.ventas, gastos: d.gastos };
    });
  });

  reportesGananciaPct = computed(() => {
    const v = this.reportesTotalVentas(), g = this.reportesGanancia();
    if (v <= 0) return 0;
    return Math.round((g / v) * 100);
  });

  reportesGananciaArc = computed(() => {
    const pct = this.reportesGananciaPct();
    return pct > 0 ? Math.min((pct / 100) * DONUT_CIRC, DONUT_CIRC) : 0;
  });

  constructor() {
    effect(() => {
      if (this.activeTab() === 'ingresos' && !this.ingresosLoaded) {
        this.loadIngresos();
      }
    });
    effect(() => {
      if (this.activeTab() === 'ventas' && !this.ventasLoaded) {
        this.loadVentas();
      }
    });
    effect(() => {
      if (this.activeTab() === 'cxc' && !this.cxcLoaded) {
        this.loadCxc();
      }
    });
    effect(() => {
      if (this.activeTab() === 'cxp' && !this.cxpLoaded) {
        this.loadCxp();
      }
    });
    effect(() => {
      const tab = this.activeTab();
      if ((tab === 'egresos' || tab === 'compras') && !this.egresosLoaded) {
        this.loadEgresos();
      }
    });
    effect(() => {
      if (this.activeTab() === 'reportes' && !this.reportesLoaded) {
        this.loadReportes();
      }
    });
  }

  // ── Ingresos methods ─────────────────────────────────────────────

  loadIngresos(): void {
    this.ingresosLoading.set(true);
    forkJoin({
      invoices: this.invoicesService.list({ limit: 1000 }),
      payments: this.invoicePaymentsService.list({ limit: 1000 }),
    }).pipe(finalize(() => this.ingresosLoading.set(false)))
      .subscribe({
        next: ({ invoices, payments }) => {
          this.allIngresosInvoices.set(invoices.data ?? []);
          this.allIngresosPayments.set(payments.data ?? []);
          this.ingresosLoaded = true;
        },
        error: () => {
          this.allIngresosInvoices.set([]);
          this.allIngresosPayments.set([]);
        },
      });
  }

  reloadIngresos(): void {
    this.ingresosLoaded = false;
    this.loadIngresos();
  }

  clearIngresosFilters(): void {
    this.ingresosSearchCtrl.setValue('');
    this.ingresosDateFromCtrl.setValue('');
    this.ingresosDateToCtrl.setValue('');
  }

  // ── Ventas methods ───────────────────────────────────────────────

  loadVentas(): void {
    this.ventasLoading.set(true);
    this.invoicesService.list({ limit: 1000 }).pipe(
      finalize(() => this.ventasLoading.set(false))
    ).subscribe({
      next: res => {
        const all = res.data ?? [];
        this.allVentasInvoices.set(all);
        this.ventasLoaded = true;
        this.loadVentasMonthDetails(all.filter(i => i.status === 'ISSUED'));
      },
      error: () => this.allVentasInvoices.set([]),
    });
  }

  private loadVentasMonthDetails(issuedInvoices: Invoice[]): void {
    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const ids = issuedInvoices
      .filter(i => (i.issue_date ?? '').slice(0, 10) >= monthStart)
      .slice(0, 60)
      .map(i => i.id);
    if (!ids.length) return;

    this.ventasDetailsLoading.set(true);
    from(ids).pipe(
      concatMap(id => this.invoicesService.getById(id)),
      toArray(),
      finalize(() => this.ventasDetailsLoading.set(false))
    ).subscribe({
      next: invoices => {
        const map = new Map<number, Invoice>();
        invoices.forEach(inv => map.set(inv.id, inv));
        this.ventasDetailMap.set(map);
      },
      error: () => {},
    });
  }

  reloadVentas(): void {
    this.ventasLoaded = false;
    this.ventasDetailMap.set(new Map());
    this.loadVentas();
  }

  // ── CxC methods ──────────────────────────────────────────────────

  loadCxc(): void {
    this.cxcLoading.set(true);
    this.invoicesService.list({ limit: 500 }).pipe(
      finalize(() => this.cxcLoading.set(false))
    ).subscribe({
      next: res => {
        this.allCxcInvoices.set(
          (res.data ?? []).filter(i =>
            i.payment_status === 'PENDIENTE' || i.payment_status === 'PARCIAL'
          )
        );
        this.cxcLoaded = true;
      },
      error: () => this.allCxcInvoices.set([]),
    });
  }

  reloadCxc(): void {
    this.cxcLoaded = false;
    this.loadCxc();
  }

  selectCxcInvoice(inv: Invoice): void {
    this.cxcSelected.set(inv);
    this.cxcShowPayForm.set(false);
    this.cxcPayments.set([]);
    if (!inv.details) {
      this.cxcDrawerLoading.set(true);
      this.invoicesService.getById(inv.id).subscribe({
        next: full => {
          this.cxcSelected.set(full);
          this.allCxcInvoices.update(list => list.map(i => i.id === full.id ? full : i));
          this.cxcDrawerLoading.set(false);
          this.loadCxcPayments(full.id);
        },
        error: () => this.cxcDrawerLoading.set(false),
      });
    } else {
      this.loadCxcPayments(inv.id);
    }
  }

  loadCxcPayments(invoiceId: number): void {
    this.cxcPaymentsLoading.set(true);
    this.invoicePaymentsService.listByInvoice(invoiceId, { limit: 50 }).pipe(
      finalize(() => this.cxcPaymentsLoading.set(false))
    ).subscribe({
      next: res => this.cxcPayments.set(res.data),
      error: () => this.cxcPayments.set([]),
    });
  }

  openCxcPayForm(): void {
    const inv = this.cxcSelected();
    if (!inv) return;
    this.cxcPayForm.reset({ payment_method: 'EFECTIVO', payment_date: '', notes: '', transfer_reference: '', card_contrapartida: '' });
    this.cxcPayMethodSig.set('EFECTIVO');
    const cobrado   = this.cxcPayments().filter(p => p.status === 'COBRADO').reduce((s, p) => s + +p.amount, 0);
    const scheduled = this.cxcPayments().filter(p => p.status === 'PENDIENTE' || p.status === 'VENCIDO').reduce((s, p) => s + +p.amount, 0);
    const paid      = parseFloat(cobrado.toFixed(2));
    const pending   = parseFloat(Math.max(0, +inv.total - cobrado - scheduled).toFixed(2));
    this.cxcAlreadyPaid.set(paid);
    this.cxcPendingAmount.set(pending);
    this.cxcPayForm.patchValue({ amount: pending > 0 ? pending : null });
    this.cxcPayForm.get('amount')!.setValidators([Validators.required, Validators.min(0.01), Validators.max(pending)]);
    this.cxcPayForm.get('amount')!.updateValueAndValidity();
    this.cxcShowPayForm.set(true);
  }

  onCxcPayMethodChange(method: string): void {
    this.cxcPayMethodSig.set(method);
    const tRef  = this.cxcPayForm.get('transfer_reference')!;
    const cCard = this.cxcPayForm.get('card_contrapartida')!;
    tRef.clearValidators();
    cCard.clearValidators();
    if (method === 'TRANSFERENCIA')                                     tRef.setValidators(Validators.required);
    else if (method === 'TARJETA_DEBITO' || method === 'TARJETA_CREDITO') cCard.setValidators(Validators.required);
    tRef.updateValueAndValidity();
    cCard.updateValueAndValidity();
  }

  submitCxcPayment(): void {
    if (this.cxcPayForm.invalid) return;
    const inv = this.cxcSelected();
    if (!inv) return;
    const val = this.cxcPayForm.value;
    this.cxcPayFormLoading.set(true);
    this.invoicePaymentsService.create({
      invoice_id:         inv.id,
      amount:             val.amount!,
      payment_method:     val.payment_method as any,
      payment_date:       val.payment_date   || undefined,
      notes:              val.notes          || undefined,
      transfer_reference: val.transfer_reference || undefined,
      card_contrapartida: val.card_contrapartida || undefined,
    }).pipe(finalize(() => this.cxcPayFormLoading.set(false)))
      .subscribe({
        next: payment => {
          this.cxcPayments.update(list => [payment, ...list]);
          this.cxcShowPayForm.set(false);
          this.snackBar.open('Cobro registrado', 'OK', { duration: 3000 });
          this.invoicesService.getById(inv.id).subscribe({
            next: updated => {
              this.cxcSelected.set(updated);
              // Remove from CxC list if fully paid
              this.allCxcInvoices.update(list =>
                list.map(i => i.id === updated.id ? updated : i)
                    .filter(i => i.payment_status === 'PENDIENTE' || i.payment_status === 'PARCIAL')
              );
            },
          });
        },
        error: () => this.snackBar.open('Error al registrar el cobro', 'Cerrar', { duration: 4000 }),
      });
  }

  closeCxcDrawer(): void {
    this.cxcSelected.set(null);
    this.cxcPayments.set([]);
    this.cxcShowPayForm.set(false);
  }

  // ── CxP methods ──────────────────────────────────────────────────

  loadCxp(): void {
    this.cxpLoading.set(true);
    this.expensesService.list({ limit: 500 }).pipe(
      finalize(() => this.cxpLoading.set(false))
    ).subscribe({
      next: res => {
        this.allCxpExpenses.set(
          (res.data ?? []).filter(e =>
            e.payment_status === 'PENDIENTE' || e.payment_status === 'PARCIAL'
          )
        );
        this.cxpLoaded = true;
      },
      error: () => this.allCxpExpenses.set([]),
    });
  }

  reloadCxp(): void {
    this.cxpLoaded = false;
    this.loadCxp();
  }

  selectCxpExpense(exp: Expense): void {
    this.cxpSelected.set(exp);
    this.cxpShowPayForm.set(false);
    this.cxpPayments.set([]);
    this.cxpDrawerLoading.set(true);
    this.expensesService.get(exp.id).subscribe({
      next: full => {
        this.cxpSelected.set(full);
        this.allCxpExpenses.update(list => list.map(e => e.id === full.id ? full : e));
        this.cxpDrawerLoading.set(false);
        this.loadCxpPayments(full.id);
      },
      error: () => this.cxpDrawerLoading.set(false),
    });
  }

  loadCxpPayments(expenseId: number): void {
    this.cxpPaymentsLoading.set(true);
    this.expensePaymentsService.listByExpense(expenseId, { limit: 50 }).pipe(
      finalize(() => this.cxpPaymentsLoading.set(false))
    ).subscribe({
      next: res => this.cxpPayments.set(res.data),
      error: () => this.cxpPayments.set([]),
    });
  }

  openCxpPayForm(): void {
    const exp = this.cxpSelected();
    if (!exp) return;
    this.cxpPayForm.reset({ payment_method: 'EFECTIVO', payment_date: '', notes: '', transfer_reference: '', card_contrapartida: '' });
    this.cxpPayMethodSig.set('EFECTIVO');
    const pagado    = this.cxpPayments().filter(p => p.status === 'PAGADO').reduce((s, p) => s + +p.amount, 0);
    const scheduled = this.cxpPayments().filter(p => p.status === 'PENDIENTE' || p.status === 'VENCIDO').reduce((s, p) => s + +p.amount, 0);
    const paid      = parseFloat(pagado.toFixed(2));
    const pending   = parseFloat(Math.max(0, +exp.amount - pagado - scheduled).toFixed(2));
    this.cxpAlreadyPaid.set(paid);
    this.cxpPendingAmount.set(pending);
    this.cxpPayForm.patchValue({ amount: pending > 0 ? pending : null });
    this.cxpPayForm.get('amount')!.setValidators([Validators.required, Validators.min(0.01), Validators.max(pending)]);
    this.cxpPayForm.get('amount')!.updateValueAndValidity();
    this.cxpShowPayForm.set(true);
  }

  onCxpPayMethodChange(method: string): void {
    this.cxpPayMethodSig.set(method);
    const tRef  = this.cxpPayForm.get('transfer_reference')!;
    const cCard = this.cxpPayForm.get('card_contrapartida')!;
    tRef.clearValidators();
    cCard.clearValidators();
    if (method === 'TRANSFERENCIA')                                       tRef.setValidators(Validators.required);
    else if (method === 'TARJETA_DEBITO' || method === 'TARJETA_CREDITO') cCard.setValidators(Validators.required);
    tRef.updateValueAndValidity();
    cCard.updateValueAndValidity();
  }

  submitCxpPayment(): void {
    if (this.cxpPayForm.invalid) return;
    const exp = this.cxpSelected();
    if (!exp) return;
    const val = this.cxpPayForm.value;
    this.cxpPayFormLoading.set(true);
    this.expensePaymentsService.create({
      expense_id:         exp.id,
      amount:             val.amount!,
      payment_method:     val.payment_method as any,
      payment_date:       val.payment_date   || undefined,
      notes:              val.notes          || undefined,
      transfer_reference: val.transfer_reference || undefined,
      card_contrapartida: val.card_contrapartida || undefined,
    }).pipe(finalize(() => this.cxpPayFormLoading.set(false)))
      .subscribe({
        next: payment => {
          this.cxpPayments.update(list => [payment, ...list]);
          this.cxpShowPayForm.set(false);
          this.snackBar.open('Pago registrado', 'OK', { duration: 3000 });
          this.expensesService.get(exp.id).subscribe({
            next: updated => {
              this.cxpSelected.set(updated);
              this.allCxpExpenses.update(list =>
                list.map(e => e.id === updated.id ? updated : e)
                    .filter(e => e.payment_status === 'PENDIENTE' || e.payment_status === 'PARCIAL')
              );
            },
          });
        },
        error: () => this.snackBar.open('Error al registrar el pago', 'Cerrar', { duration: 4000 }),
      });
  }

  closeCxpDrawer(): void {
    this.cxpSelected.set(null);
    this.cxpPayments.set([]);
    this.cxpShowPayForm.set(false);
  }

  // ── Egresos methods ───────────────────────────────────────────────

  loadEgresos(): void {
    this.egresosLoading.set(true);
    forkJoin({
      expenses:   this.expensesService.list({ limit: 500 }),
      categories: this.categoriesSvc.list({ limit: 500 }),
    }).pipe(finalize(() => this.egresosLoading.set(false)))
      .subscribe({
        next: ({ expenses, categories }) => {
          this.allEgresos.set(expenses.data ?? []);
          this.egresosCategories.set(categories);
          this.egresosLoaded = true;
        },
        error: () => { this.allEgresos.set([]); this.egresosCategories.set([]); },
      });
  }

  reloadEgresos(): void {
    this.egresosLoaded = false;
    this.loadEgresos();
  }

  selectEgreso(exp: Expense): void {
    this.egresosSelected.set(exp);
    this.egresosShowPayForm.set(false);
    this.egresosPayments.set([]);
    this.egresosDrawerLoading.set(true);
    this.expensesService.get(exp.id).subscribe({
      next: full => {
        this.egresosSelected.set(full);
        this.allEgresos.update(list => list.map(e => e.id === full.id ? full : e));
        this.egresosDrawerLoading.set(false);
        if (full.payment_status !== 'ANULADO') this.loadEgresosPayments(full.id);
      },
      error: () => this.egresosDrawerLoading.set(false),
    });
  }

  loadEgresosPayments(expenseId: number): void {
    this.egresosPaymentsLoading.set(true);
    this.expensePaymentsService.listByExpense(expenseId, { limit: 50 }).pipe(
      finalize(() => this.egresosPaymentsLoading.set(false))
    ).subscribe({
      next: res => this.egresosPayments.set(res.data),
      error: () => this.egresosPayments.set([]),
    });
  }

  openEgresosPayForm(): void {
    const exp = this.egresosSelected();
    if (!exp) return;
    this.egresosPayForm.reset({ payment_method: 'EFECTIVO', payment_date: '', notes: '', transfer_reference: '', card_contrapartida: '', cheque_number: '' });
    this.egresosPayMethodSig.set('EFECTIVO');
    const pagado    = this.egresosPayments().filter(p => p.status === 'PAGADO').reduce((s, p) => s + +p.amount, 0);
    const scheduled = this.egresosPayments().filter(p => p.status === 'PENDIENTE' || p.status === 'VENCIDO').reduce((s, p) => s + +p.amount, 0);
    const pending   = parseFloat(Math.max(0, +exp.amount - pagado - scheduled).toFixed(2));
    this.egresosPendingAmount.set(pending);
    this.egresosPayForm.patchValue({ amount: pending > 0 ? pending : null });
    this.egresosPayForm.get('amount')!.setValidators([Validators.required, Validators.min(0.01), Validators.max(pending)]);
    this.egresosPayForm.get('amount')!.updateValueAndValidity();
    this.egresosShowPayForm.set(true);
  }

  onEgresosPayMethodChange(method: string): void {
    this.egresosPayMethodSig.set(method);
    const tRef   = this.egresosPayForm.get('transfer_reference')!;
    const cCard  = this.egresosPayForm.get('card_contrapartida')!;
    const cheque = this.egresosPayForm.get('cheque_number')!;
    tRef.clearValidators();   cCard.clearValidators();   cheque.clearValidators();
    if (method === 'TRANSFERENCIA')                                       tRef.setValidators(Validators.required);
    else if (method === 'TARJETA_DEBITO' || method === 'TARJETA_CREDITO') cCard.setValidators(Validators.required);
    else if (method === 'CHEQUE')                                         cheque.setValidators(Validators.required);
    tRef.updateValueAndValidity();
    cCard.updateValueAndValidity();
    cheque.updateValueAndValidity();
  }

  submitEgresosPayment(): void {
    if (this.egresosPayForm.invalid) return;
    const exp = this.egresosSelected();
    if (!exp) return;
    const val = this.egresosPayForm.value;
    this.egresosPayFormLoading.set(true);
    this.expensePaymentsService.create({
      expense_id:         exp.id,
      amount:             val.amount!,
      payment_method:     val.payment_method as any,
      payment_date:       val.payment_date        || undefined,
      notes:              val.notes               || undefined,
      transfer_reference: val.transfer_reference  || undefined,
      card_contrapartida: val.card_contrapartida  || undefined,
      cheque_number:      val.cheque_number       || undefined,
    }).pipe(finalize(() => this.egresosPayFormLoading.set(false)))
      .subscribe({
        next: payment => {
          this.egresosPayments.update(list => [payment, ...list]);
          this.egresosShowPayForm.set(false);
          this.snackBar.open('Pago registrado', 'OK', { duration: 3000 });
          this.expensesService.get(exp.id).subscribe({
            next: updated => {
              this.egresosSelected.set(updated);
              this.allEgresos.update(list => list.map(e => e.id === updated.id ? updated : e));
            },
          });
        },
        error: () => this.snackBar.open('Error al registrar el pago', 'Cerrar', { duration: 4000 }),
      });
  }

  closeEgresosDrawer(): void {
    this.egresosSelected.set(null);
    this.egresosPayments.set([]);
    this.egresosShowPayForm.set(false);
  }

  clearEgresosFilters(): void {
    this.egresosSearchCtrl.setValue('');
    this.egresosCategoryCtrl.setValue('');
    this.egresosDateFromCtrl.setValue('');
    this.egresosDateToCtrl.setValue('');
    this.egresosTab.set('all');
  }

  egresosSupplierName(e: Expense): string {
    return e.supplier?.name ?? e.supplier_name_free ?? '—';
  }

  truncateCatName(name: string, max = 14): string {
    return name.length > max ? name.substring(0, max) + '…' : name;
  }

  // ── Helpers ───────────────────────────────────────────────────────

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  dueDate(issueDate: string): string {
    const d = new Date(issueDate);
    d.setDate(d.getDate() + 30);
    return d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  // ── Reportes methods ──────────────────────────────────────────────

  loadReportes(): void {
    this.reportesLoading.set(true);
    this.productsService.list({ limit: 500 }).pipe(
      finalize(() => this.reportesLoading.set(false))
    ).subscribe({
      next: res => {
        this.reportesProducts.set(res.data ?? []);
        this.reportesLoaded = true;
        if (!this.ingresosLoaded) this.loadIngresos();
        if (!this.egresosLoaded)  this.loadEgresos();
        if (!this.cxcLoaded)      this.loadCxc();
        if (!this.cxpLoaded)      this.loadCxp();
        this.pettyCashService.getOpen().subscribe({
          next: pc => {
            this.reportesPettyCash.set(pc);
            if (pc) {
              this.pettyCashService.listMovements(pc.id, { limit: 10 }).subscribe({
                next: mv => this.reportesPcMovements.set(mv.data ?? []),
                error: () => {},
              });
            }
          },
          error: () => this.reportesPettyCash.set(null),
        });
      },
      error: () => { this.reportesLoaded = true; },
    });
  }

  reloadReportes(): void {
    this.reportesLoaded = false;
    this.ingresosLoaded = false;
    this.egresosLoaded  = false;
    this.cxcLoaded      = false;
    this.cxpLoaded      = false;
    this.loadReportes();
  }

  reportesPrevMonth(): void {
    let m = this.reportesMonth(), y = this.reportesYear();
    if (m === 1) { m = 12; y--; } else { m--; }
    this.reportesYear.set(y);
    this.reportesMonth.set(m);
  }

  reportesNextMonth(): void {
    if (this.reportesIsCurrentMonth()) return;
    let m = this.reportesMonth(), y = this.reportesYear();
    if (m === 12) { m = 1; y++; } else { m++; }
    this.reportesYear.set(y);
    this.reportesMonth.set(m);
  }

  exportCsvVentas(): void {
    const rows: string[][] = [
      ['N° Factura', 'Cliente', 'Fecha', 'Subtotal', 'IVA', 'Total', 'Estado Cobro'],
      ...this.reportesPeriodInvoices().map(i => [
        i.invoice_number,
        i.customer?.full_name ?? '',
        i.issue_date ?? '',
        (+(i.subtotal ?? 0)).toFixed(2),
        (+(i.tax_amount ?? 0)).toFixed(2),
        (+i.total).toFixed(2),
        i.payment_status ?? '',
      ]),
    ];
    this.downloadCsv(rows, `ventas-${this.reportesYear()}-${String(this.reportesMonth()).padStart(2, '0')}.csv`);
  }

  exportCsvGastos(): void {
    const rows: string[][] = [
      ['Fecha', 'Categoría', 'Descripción', 'Proveedor', 'Monto', 'Estado'],
      ...this.reportesPeriodExpenses().map(e => [
        e.expense_date ?? e.created_at.slice(0, 10),
        e.category?.name ?? '',
        e.description,
        e.supplier?.name ?? e.supplier_name_free ?? '',
        (+e.amount).toFixed(2),
        e.payment_status,
      ]),
    ];
    this.downloadCsv(rows, `gastos-${this.reportesYear()}-${String(this.reportesMonth()).padStart(2, '0')}.csv`);
  }

  exportCsvClientes(): void {
    const rows: string[][] = [
      ['Cliente', 'N° Facturas', 'Total Facturado'],
      ...this.reportesTopClients().map(c => [c.name, String(c.count), c.total.toFixed(2)]),
    ];
    this.downloadCsv(rows, `clientes-${this.reportesYear()}-${String(this.reportesMonth()).padStart(2, '0')}.csv`);
  }

  private downloadCsv(rows: string[][], filename: string): void {
    const csv  = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }
}
