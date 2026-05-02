import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription, forkJoin, of, finalize, catchError, map } from 'rxjs';
import { DashboardService, DashboardData, RevenueByDay } from '../../core/services/dashboard.service';
import { ProductsService } from '../../core/services/products.service';
import { AuditLogsService } from '../../core/services/audit-logs.service';
import { AuthService } from '../../core/services/auth.service';
import { CompanyModulesService } from '../../core/services/company-modules.service';
import { AdminViewService } from '../../core/services/admin-view.service';
import { Product } from '../../core/models/product.model';
import { AuditLog } from '../../core/models/audit-log.model';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';

interface BarItem    { x: number; y: number; w: number; h: number; isLast: boolean; }
interface GridLine   { y: number; value: number; isZero: boolean; }
interface ChartLabel { x: number; text: string; }

interface ActivityEvent {
  icon: string;
  color: 'success' | 'warn' | 'danger' | 'accent' | 'neutral';
  verb: string;
  detail: string;
  amount?: number;
  /** Signed stock change: +N = ingresó, -N = retiró. undefined = no aplica. */
  delta?: number;
  notes?: string;
  isOut?: boolean;
}

interface UserSummary {
  user: NonNullable<AuditLog['user']>;
  total: number;
  sales: number;
  stockIn: number;
  stockOut: number;
  initials: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, RouterLink, AppIconComponent],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit, OnDestroy {
  private dashboardService = inject(DashboardService);
  private productsService  = inject(ProductsService);
  private auditLogsSvc     = inject(AuditLogsService);
  private route            = inject(ActivatedRoute);
  authService              = inject(AuthService);
  adminViewSvc             = inject(AdminViewService);
  private modulesSvc       = inject(CompanyModulesService);

  view = toSignal(
    this.route.queryParamMap.pipe(map(p => p.get('view') ?? 'analytics')),
    { initialValue: 'analytics' },
  );

  data: DashboardData | null = null;
  loading    = true;
  lastUpdated = new Date();
  private sub?: Subscription;

  todaySales      = 0;
  sparkPath       = '';
  sparkArea       = '';
  chartBars:      BarItem[]    = [];
  chartGridLines: GridLine[]   = [];
  chartLabels:    ChartLabel[] = [];
  chartStats      = { avg: 0, vat: 0, best: 0 };

  lowStockList = signal<Product[]>([]);
  range        = signal<'7d'|'30d'>('7d');

  // ── Actividad del equipo ──────────────────────────────────────────
  activityLogs     = signal<AuditLog[]>([]);
  activityLoading  = signal(false);
  activityError    = signal<string | null>(null);
  activityRange    = signal<'today' | 'week' | 'month'>('today');
  activityPage     = signal(1);
  activityTotal    = signal(0);
  selectedUserId   = signal<number | null>(null);
  readonly activityPageSize = 40;

  private readonly INTERNAL_TABLES = new Set([
    'invoices', 'customers', 'products', 'stock_movements',
    'suppliers', 'users', 'tax_rates',
  ]);

  private isInternalLog(log: AuditLog): boolean {
    const t  = (log.table_name ?? '').toLowerCase();
    const nv = (log.new_values ?? {}) as Record<string, unknown>;
    if (this.INTERNAL_TABLES.has(t)) return true;
    // Solo mostrar aprobaciones de módulos del platform admin
    if (t === 'module_requests' && log.action === 'UPDATE') {
      return nv['status'] === 'APPROVED' || nv['status'] === 'ACTIVE';
    }
    return false;
  }

  activityEvents = computed(() => {
    const uid = this.selectedUserId();
    return this.activityLogs()
      .filter(log => this.isInternalLog(log))
      .filter(log => !uid || log.user?.id === uid)
      .map(log => ({ log, ev: this.eventOf(log) }));
  });

  activityByUser = computed((): UserSummary[] => {
    const map = new Map<number, UserSummary>();
    for (const log of this.activityLogs()) {
      if (!this.INTERNAL_TABLES.has((log.table_name ?? '').toLowerCase())) continue;
      if (!log.user) continue;
      const uid = log.user.id;
      if (!map.has(uid)) {
        const parts = (log.user.full_name ?? '').split(' ');
        map.set(uid, {
          user: log.user,
          total: 0,
          sales: 0,
          stockIn: 0,
          stockOut: 0,
          initials: (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '') || '?',
        });
      }
      const s = map.get(uid)!;
      s.total++;
      if (log.table_name === 'invoices'        && log.action === 'INSERT') s.sales++;
      if (log.table_name === 'stock_movements' && (log.new_values as any)?.movement_type?.toUpperCase() === 'IN')  s.stockIn++;
      if (log.table_name === 'stock_movements' && (log.new_values as any)?.movement_type?.toUpperCase() === 'OUT') s.stockOut++;
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  });

  selectedUserName = computed(() => {
    const uid = this.selectedUserId();
    if (!uid) return null;
    return this.activityByUser().find(s => s.user.id === uid)?.user.full_name ?? null;
  });

  selectUser(id: number): void {
    this.selectedUserId.update(curr => curr === id ? null : id);
  }

  activityPages = computed(() => Math.max(1, Math.ceil(this.activityTotal() / this.activityPageSize)));

  hasAnalytics = computed(() => {
    const isCV = this.adminViewSvc.isClientViewMode();
    if (!isCV && !this.authService.isStoreUser()) return false;
    return this.modulesSvc.approvedCodes().has('MOD_INVOICING') || this.modulesSvc.loadFailed();
  });

  hasPendingModules   = computed(() => this.authService.isStoreUser() && this.modulesSvc.pendingCodes().size > 0);
  pendingModulesCount = computed(() => this.modulesSvc.pendingCodes().size);

  get firstName(): string { return this.authService.currentUser()?.full_name?.split(' ')?.[0] ?? ''; }

  get todayDate(): string {
    const d = new Date();
    const wd = d.toLocaleDateString('es-EC', { weekday: 'long' });
    const mo = d.toLocaleDateString('es-EC', { month: 'long' });
    return `Reportes · Hoy ${wd} ${d.getDate()} de ${mo}, ${d.getFullYear()}`;
  }

  get todayInvoiceCount(): number {
    if (!this.data) return 0;
    const today = new Date().toDateString();
    return this.data.recentInvoices.filter(
      inv => inv.status === 'ISSUED' && new Date(inv.issue_date).toDateString() === today
    ).length;
  }

  ngOnInit(): void {
    const isCV = this.adminViewSvc.isClientViewMode();
    if (!isCV && !this.authService.isStoreUser()) { this.loading = false; return; }

    if (this.view() === 'activity') {
      this.loading = false;
      this.loadActivity();
      return;
    }

    if (isCV) {
      this.afterCatalogReady();
    } else {
      this.modulesSvc.loadCatalog().subscribe({
        next:  () => this.afterCatalogReady(),
        error: () => this.afterCatalogReady(),
      });
    }
  }

  private afterCatalogReady(): void {
    this.hasAnalytics() ? this.load() : (this.loading = false);
  }

  load(): void {
    this.loading = !this.data;
    this.sub = forkJoin({
      dashboard: this.dashboardService.getDashboardData(),
      products:  this.productsService.list({ page: 1, limit: 100 }).pipe(
        catchError(() => of({ data: [] as Product[], total: 0, page: 1, limit: 100, totalPages: 0 }))
      ),
    }).pipe(finalize(() => { this.loading = false; })).subscribe({
      next: ({ dashboard, products }) => {
        this.data = dashboard;
        this.lastUpdated = new Date();
        this.lowStockList.set(
          products.data
            .filter(p => p.stock < p.min_stock && p.status === 'ACTIVE')
            .sort((a, b) => (a.stock / Math.max(a.min_stock, 1)) - (b.stock / Math.max(b.min_stock, 1)))
            .slice(0, 4)
        );
        this.onDataLoaded(dashboard);
      },
      error: () => {},
    });
  }

  refresh(): void { this.sub?.unsubscribe(); this.data = null; this.load(); }
  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  // ── Activity tab ─────────────────────────────────────────────────

  setActivityRange(r: 'today' | 'week' | 'month'): void {
    this.activityRange.set(r);
    this.activityPage.set(1);
    this.loadActivity();
  }

  loadActivity(): void {
    this.activityLoading.set(true);
    this.activityError.set(null);
    this.auditLogsSvc.listMyCompany({
      page:      this.activityPage(),
      limit:     this.activityPageSize,
      date_from: this.activityDateFrom(),
    }).pipe(finalize(() => this.activityLoading.set(false)))
    .subscribe({
      next: res => {
        this.activityLogs.set(res.data);
        this.activityTotal.set(res.total);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 403) {
          this.activityError.set('Sin permiso para ver el registro. Solicita al administrador de plataforma que habilite la auditoría para tu empresa.');
        } else if (err.status === 404) {
          this.activityError.set('El registro de actividad no está disponible en este servidor.');
        } else {
          this.activityError.set(err.error?.message ?? 'Error al cargar la actividad.');
        }
      },
    });
  }

  activityPrev(): void {
    if (this.activityPage() > 1) { this.activityPage.update(p => p - 1); this.loadActivity(); }
  }

  activityNext(): void {
    if (this.activityPage() < this.activityPages()) { this.activityPage.update(p => p + 1); this.loadActivity(); }
  }

  private activityDateFrom(): string {
    const d = new Date();
    if (this.activityRange() === 'today') {
      d.setHours(0, 0, 0, 0);
    } else if (this.activityRange() === 'week') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setDate(d.getDate() - 30);
    }
    return d.toISOString();
  }

  eventOf(log: AuditLog): ActivityEvent {
    const t  = (log.table_name ?? '').toLowerCase();
    const a  = log.action;
    const nv = (log.new_values ?? {}) as Record<string, unknown>;
    const ov = (log.old_values ?? {}) as Record<string, unknown>;

    if (t === 'invoices') {
      if (a === 'INSERT') return { icon: 'receipt_long', color: 'success', verb: 'emitió una factura', detail: String(nv['invoice_number'] ?? ''), amount: Number(nv['total'] ?? 0) || undefined };
      if (a === 'UPDATE' && nv['status'] === 'CANCELLED') return { icon: 'x', color: 'danger', verb: 'canceló la factura', detail: String(nv['invoice_number'] ?? ov['invoice_number'] ?? '') };
      return { icon: 'edit', color: 'neutral', verb: 'actualizó una factura', detail: String(nv['invoice_number'] ?? ov['invoice_number'] ?? '') };
    }
    if (t === 'customers') {
      if (a === 'INSERT') return { icon: 'users', color: 'success', verb: 'registró un cliente', detail: String(nv['full_name'] ?? '') };
      if (a === 'DELETE') return { icon: 'users', color: 'danger', verb: 'eliminó un cliente', detail: String(ov['full_name'] ?? '') };
      return { icon: 'users', color: 'neutral', verb: 'modificó un cliente', detail: String(nv['full_name'] ?? ov['full_name'] ?? '') };
    }
    if (t === 'products') {
      if (a === 'INSERT') return { icon: 'package', color: 'accent', verb: 'agregó un producto', detail: String(nv['name'] ?? '') };
      if (a === 'DELETE') return { icon: 'trash', color: 'danger', verb: 'eliminó un producto', detail: String(ov['name'] ?? '') };
      return { icon: 'package', color: 'neutral', verb: 'actualizó un producto', detail: String(nv['name'] ?? ov['name'] ?? '') };
    }
    if (t === 'stock_movements') {
      const mv    = String(nv['movement_type'] ?? '').toUpperCase();
      const prod  = String(nv['product_name'] ?? nv['name'] ?? '');
      const qty   = nv['quantity'] !== undefined ? Number(nv['quantity']) : undefined;
      const notes = String(nv['notes'] ?? nv['reason'] ?? '').trim();
      if (mv === 'OUT') return {
        icon: 'trending_down', color: 'warn',
        verb: 'retiró del inventario', detail: prod,
        delta: qty !== undefined ? -qty : undefined,
        notes: notes || undefined, isOut: true,
      };
      if (mv === 'IN') return {
        icon: 'trending_up', color: 'success',
        verb: 'ingresó al inventario', detail: prod,
        delta: qty !== undefined ? +qty : undefined,
        notes: notes || undefined,
      };
      // ADJUSTMENT: derive direction from product stock delta when available
      const oldStk = ov['stock'] !== undefined ? Number(ov['stock']) : undefined;
      const newStk = nv['stock'] !== undefined ? Number(nv['stock']) : undefined;
      const adjDelta = (oldStk !== undefined && newStk !== undefined)
        ? newStk - oldStk
        : undefined;
      return {
        icon: 'settings', color: 'neutral',
        verb: 'realizó un ajuste de inventario', detail: prod,
        delta: adjDelta ?? qty,
        notes: notes || undefined,
        isOut: adjDelta !== undefined && adjDelta < 0,
      };
    }
    if (t === 'suppliers') {
      if (a === 'INSERT') return { icon: 'truck', color: 'success', verb: 'agregó un proveedor', detail: String(nv['name'] ?? '') };
      if (a === 'DELETE') return { icon: 'truck', color: 'danger', verb: 'eliminó un proveedor', detail: String(ov['name'] ?? '') };
      return { icon: 'truck', color: 'neutral', verb: 'actualizó un proveedor', detail: String(nv['name'] ?? ov['name'] ?? '') };
    }
    if (t === 'users') {
      if (a === 'INSERT') return { icon: 'user', color: 'accent', verb: 'creó un usuario', detail: String(nv['full_name'] ?? '') };
      return { icon: 'user', color: 'neutral', verb: 'actualizó un usuario', detail: String(nv['full_name'] ?? ov['full_name'] ?? '') };
    }
    if (t === 'tax_rates') {
      if (a === 'INSERT') return { icon: 'percent', color: 'accent', verb: 'agregó una tasa de impuesto', detail: String(nv['name'] ?? '') };
      return { icon: 'percent', color: 'neutral', verb: 'actualizó una tasa de impuesto', detail: String(nv['name'] ?? ov['name'] ?? '') };
    }
    if (t === 'module_requests') {
      const mod = String(nv['module_name'] ?? nv['module_id'] ?? '');
      return { icon: 'puzzle', color: 'success', verb: 'aprobó el módulo', detail: mod };
    }
    const actionLabel: Record<string, string> = { INSERT: 'agregó', UPDATE: 'modificó', DELETE: 'eliminó' };
    return { icon: 'list', color: 'neutral', verb: `${actionLabel[a] ?? 'modificó'} en ${t}`, detail: '' };
  }

  relativeTime(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60)    return 'hace un momento';
    if (diff < 3600)  return `hace ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `hace ${Math.floor(diff / 86400)}d`;
    return new Date(dateStr).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
  }

  private onDataLoaded(data: DashboardData): void {
    const values = data.revenueByDay.map(d => d.amount);
    this.todaySales = values[values.length - 1] ?? 0;
    this.sparkPath  = this.buildSparkPath(values, 200, 32);
    this.sparkArea  = this.buildSparkArea(values, 200, 32);
    this.buildBarData(data.revenueByDay);
    const total = values.reduce((s, v) => s + v, 0);
    this.chartStats = {
      avg:  total / (values.length || 1),
      vat:  data.taxByDay.reduce((s, d) => s + d.amount, 0),
      best: Math.max(...values, 0),
    };
  }

  private buildSparkPath(values: number[], w: number, h: number): string {
    if (!values.length || values.every(v => v === 0)) return `M2,${h - 2} L${w - 2},${h - 2}`;
    const max = Math.max(...values), min = Math.min(...values), range = max - min || 1;
    const pad = 2, step = (w - pad * 2) / (values.length - 1);
    return values.map((v, i) => {
      const x = (pad + i * step).toFixed(1);
      const y = (pad + (h - pad * 2) * (1 - (v - min) / range)).toFixed(1);
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
  }

  private buildSparkArea(values: number[], w: number, h: number): string {
    return this.buildSparkPath(values, w, h) + ` L${w - 2},${h} L2,${h} Z`;
  }

  private buildBarData(days: RevenueByDay[]): void {
    const W = 760, H = 220, PL = 44, PR = 12, PT = 14, PB = 28;
    const max = Math.max(...days.map(d => d.amount), 1);
    const step = (W - PL - PR) / days.length;
    const barW = step * 0.65;

    this.chartGridLines = Array.from({ length: 5 }, (_, i) => {
      const value = (max / 4) * i;
      const y = H - PB - (H - PT - PB) * (value / max);
      return { y, value: Math.round(value), isZero: i === 0 };
    });

    this.chartBars = days.map((d, i) => ({
      x: PL + i * step + (step - barW) / 2,
      y: H - PB - (H - PT - PB) * (d.amount / max || 0),
      w: barW,
      h: (H - PT - PB) * (d.amount / max || 0),
      isLast: i === days.length - 1,
    }));

    const every = Math.ceil(days.length / 5);
    this.chartLabels = days
      .map((d, i) => ({ x: PL + i * step + step / 2, text: d.date.split(',')[0] }))
      .filter((_, i) => i === 0 || i % every === 0 || i === days.length - 1);
  }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(v);
  }

  stockPct(p: Product): number {
    return Math.min(100, Math.round((p.stock / Math.max(p.min_stock, 1)) * 100));
  }

  stockState(p: Product): 'out' | 'low' {
    return p.stock === 0 ? 'out' : 'low';
  }

  customerName(inv: any): string {
    return inv.customer?.full_name ?? 'Consumidor Final';
  }
}
