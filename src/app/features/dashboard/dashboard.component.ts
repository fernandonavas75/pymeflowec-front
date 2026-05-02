import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription, forkJoin, of, finalize, catchError } from 'rxjs';
import { DashboardService, DashboardData, RevenueByDay } from '../../core/services/dashboard.service';
import { ProductsService } from '../../core/services/products.service';
import { AuthService } from '../../core/services/auth.service';
import { CompanyModulesService } from '../../core/services/company-modules.service';
import { AdminViewService } from '../../core/services/admin-view.service';
import { Product } from '../../core/models/product.model';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';

interface ModCard {
  icon: string; label: string; description: string;
  route: string; color: 'green'|'blue'|'purple'|'teal'|'amber'|'indigo'|'rose';
  moduleCode?: string; adminOnly?: boolean;
}
interface BarItem  { x: number; y: number; w: number; h: number; isLast: boolean; }
interface GridLine { y: number; value: number; isZero: boolean; }
interface ChartLabel { x: number; text: string; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, AppIconComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private dashboardService = inject(DashboardService);
  private productsService  = inject(ProductsService);
  authService              = inject(AuthService);
  adminViewSvc             = inject(AdminViewService);
  private modulesSvc       = inject(CompanyModulesService);

  private snackBar = inject(MatSnackBar);

  data: DashboardData | null = null;
  loading    = true;
  lastUpdated = new Date();
  private sub?: Subscription;

  // Chart / sparkline state (populated on data load)
  todaySales      = 0;
  sparkPath       = '';
  sparkArea       = '';
  chartBars:      BarItem[]    = [];
  chartGridLines: GridLine[]   = [];
  chartLabels:    ChartLabel[] = [];
  chartStats      = { avg: 0, vat: 0, best: 0 };

  lowStockList = signal<Product[]>([]);
  range        = signal<'7d'|'30d'>('7d');

  // ── Static card defs ──────────────────────────────────────────────
  private readonly STORE_CARDS: ModCard[] = [
    { icon: 'people',           label: 'Clientes',        description: 'Administra tus clientes',         route: '/customers',       color: 'blue',   moduleCode: 'MOD_INVOICING' },
    { icon: 'receipt_long',     label: 'Facturación',     description: 'Emite y controla tus facturas',   route: '/invoices',        color: 'green',  moduleCode: 'MOD_INVOICING' },
    { icon: 'inventory_2',      label: 'Productos',       description: 'Gestiona tu inventario',          route: '/products',        color: 'purple', moduleCode: 'MOD_PRODUCTS' },
    { icon: 'local_shipping',   label: 'Proveedores',     description: 'Controla tus proveedores',        route: '/suppliers',       color: 'teal',   moduleCode: 'MOD_SUPPLIERS' },
    { icon: 'percent',          label: 'Impuestos',       description: 'Configura tasas de impuesto',     route: '/tax-rates',       color: 'amber',  moduleCode: 'MOD_TAX', adminOnly: true },
    { icon: 'manage_accounts',  label: 'Usuarios',        description: 'Gestiona los usuarios',           route: '/users',           color: 'indigo', adminOnly: true },
    { icon: 'extension',        label: 'Módulos ERP',     description: 'Solicita módulos del ERP',        route: '/module-requests', color: 'rose',   adminOnly: true },
    { icon: 'bar_chart',        label: 'Reportes',        description: 'Ventas, productos y proyecciones', route: '/reports',         color: 'indigo', moduleCode: 'MOD_INVOICING' },
  ];

  private readonly PLATFORM_CARDS: ModCard[] = [
    { icon: 'business',        label: 'Empresas',    description: 'Gestiona las empresas registradas', route: '/companies',       color: 'blue' },
    { icon: 'pending_actions', label: 'Solicitudes', description: 'Aprueba solicitudes de módulos',    route: '/module-requests', color: 'amber' },
  ];

  // ── Computed ─────────────────────────────────────────────────────
  moduleCards = computed((): ModCard[] => {
    const isCV = this.adminViewSvc.isClientViewMode();
    if (!isCV && this.authService.isSystemUser()) return this.PLATFORM_CARDS;
    const approved = this.modulesSvc.approvedCodes();
    const failed   = this.modulesSvc.loadFailed();
    const isAdmin  = isCV ? true : this.authService.isStoreAdmin();
    return this.STORE_CARDS.filter(c => {
      if (c.adminOnly && !isAdmin) return false;
      if (!c.moduleCode)           return true;
      if (failed)                  return true;
      return approved.has(c.moduleCode);
    });
  });

  hasPendingModules  = computed(() => this.authService.isStoreUser() && this.modulesSvc.pendingCodes().size > 0);
  pendingModulesCount = computed(() => this.modulesSvc.pendingCodes().size);
  hasRequestableModules = computed(() =>
    !this.modulesSvc.loadFailed() &&
    this.modulesSvc.catalog().some(m => m.status !== 'APPROVED' && m.status !== 'PENDING')
  );

  hasAnalytics = computed(() => {
    const isCV = this.adminViewSvc.isClientViewMode();
    if (!isCV && !this.authService.isStoreUser()) return false;
    return this.modulesSvc.approvedCodes().has('MOD_INVOICING') || this.modulesSvc.loadFailed();
  });

  // ── Getters ──────────────────────────────────────────────────────
  get firstName(): string { return this.authService.currentUser()?.full_name?.split(' ')?.[0] ?? ''; }

  get todayDate(): string {
    const d = new Date();
    const wd = d.toLocaleDateString('es-EC', { weekday: 'long' });
    const mo = d.toLocaleDateString('es-EC', { month: 'long' });
    return `Dashboard · Hoy ${wd} ${d.getDate()} de ${mo}, ${d.getFullYear()}`;
  }

  get todayInvoiceCount(): number {
    if (!this.data) return 0;
    const today = new Date().toDateString();
    return this.data.recentInvoices.filter(
      inv => inv.status === 'ISSUED' && new Date(inv.issue_date).toDateString() === today
    ).length;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────
  ngOnInit(): void {
    const isCV = this.adminViewSvc.isClientViewMode();
    if (!isCV && !this.authService.isStoreUser()) { this.loading = false; return; }
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
    if (this.adminViewSvc.isClientViewMode()) { this.loading = false; return; }
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

  // ── Chart builders ───────────────────────────────────────────────
  private onDataLoaded(data: DashboardData): void {
    const values = data.revenueByDay.map(d => d.amount);
    this.todaySales = values[values.length - 1] ?? 0;
    this.sparkPath  = this.buildSparkPath(values, 200, 32);
    this.sparkArea  = this.buildSparkArea(values, 200, 32);
    this.buildBarData(data.revenueByDay);
    const total = values.reduce((s, v) => s + v, 0);
    this.chartStats = {
      avg:  total / (values.length || 1),
      vat:  total * 0.13,
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

  comingSoon(): void {
    this.snackBar.open('🚧 Funcionalidad en desarrollo', 'Cerrar', { duration: 3000 });
  }

  // ── Formatters ────────────────────────────────────────────────────
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
