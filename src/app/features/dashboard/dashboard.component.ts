import { Component, computed, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DashboardService, DashboardData } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { CompanyModulesService } from '../../core/services/company-modules.service';
import { AdminViewService } from '../../core/services/admin-view.service';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

interface DashboardCard {
  icon: string;
  label: string;
  description: string;
  route: string;
  color: 'green' | 'blue' | 'purple' | 'teal' | 'amber' | 'indigo' | 'rose';
  moduleCode?: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NgApexchartsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    StatCardComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private dashboardService = inject(DashboardService);
  authService              = inject(AuthService);
  private modulesSvc       = inject(CompanyModulesService);
  private adminViewSvc     = inject(AdminViewService);

  data: DashboardData | null = null;
  loading = true;
  lastUpdated = new Date();
  chartOptions: any = {};
  private sub?: Subscription;

  invoicesColumns = ['number', 'date', 'total', 'status'];

  // ── Definición estática de tarjetas ────────────────────────────────

  private readonly STORE_CARD_DEFS: DashboardCard[] = [
    {
      icon: 'people', label: 'Clientes',
      description: 'Administra tus clientes y contactos',
      route: '/customers', color: 'blue', moduleCode: 'MOD_INVOICING',
    },
    {
      icon: 'receipt_long', label: 'Facturación',
      description: 'Emite y controla tus facturas electrónicas',
      route: '/invoices', color: 'green', moduleCode: 'MOD_INVOICING',
    },
    {
      icon: 'inventory_2', label: 'Productos',
      description: 'Gestiona tu inventario y catálogo',
      route: '/products', color: 'purple', moduleCode: 'MOD_PRODUCTS',
    },
    {
      icon: 'local_shipping', label: 'Proveedores',
      description: 'Controla tus proveedores y compras',
      route: '/suppliers', color: 'teal', moduleCode: 'MOD_SUPPLIERS',
    },
    {
      icon: 'percent', label: 'Tasas de impuesto',
      description: 'Configura impuestos y tributos',
      route: '/tax-rates', color: 'amber', moduleCode: 'MOD_TAX', adminOnly: true,
    },
    {
      icon: 'manage_accounts', label: 'Usuarios',
      description: 'Gestiona los usuarios de tu empresa',
      route: '/users', color: 'indigo', adminOnly: true,
    },
    {
      icon: 'extension', label: 'Módulos ERP',
      description: 'Solicita y administra módulos del ERP',
      route: '/module-requests', color: 'rose', adminOnly: true,
    },
  ];

  private readonly PLATFORM_CARD_DEFS: DashboardCard[] = [
    {
      icon: 'business', label: 'Empresas',
      description: 'Gestiona las empresas registradas en la plataforma',
      route: '/companies', color: 'blue',
    },
    {
      icon: 'pending_actions', label: 'Solicitudes',
      description: 'Revisa y aprueba solicitudes de módulos pendientes',
      route: '/module-requests', color: 'amber',
    },
  ];

  // ── Computed signals ────────────────────────────────────────────────

  /** Tarjetas visibles para el usuario actual */
  moduleCards = computed((): DashboardCard[] => {
    const isClientView = this.adminViewSvc.isClientViewMode();

    // Usuarios de plataforma fuera del modo cliente → tarjetas de plataforma
    if (!isClientView && this.authService.isSystemUser()) return this.PLATFORM_CARD_DEFS;

    // Modo cliente (plataforma viendo empresa) o usuario de tienda → tarjetas de tienda
    const approved = this.modulesSvc.approvedCodes();
    const failed   = this.modulesSvc.loadFailed();
    const isAdmin  = isClientView ? true : this.authService.isStoreAdmin();

    return this.STORE_CARD_DEFS.filter(card => {
      if (card.adminOnly && !isAdmin) return false;
      if (!card.moduleCode)           return true;   // sin gate de módulo (Usuarios, Módulos ERP)
      if (failed)                     return true;   // fallback si API falla
      return approved.has(card.moduleCode);
    });
  });

  /** true si la empresa tiene al menos un módulo en estado PENDING */
  hasPendingModules = computed(() => {
    if (!this.authService.isStoreUser()) return false;
    return this.modulesSvc.pendingCodes().size > 0;
  });

  /** Cantidad de módulos PENDING (para mostrar en mensajes) */
  pendingModulesCount = computed(() => this.modulesSvc.pendingCodes().size);

  /**
   * Mostrar sección de analytics solo si la empresa tiene MOD_INVOICING aprobado.
   * Si loadFailed (API inalcanzable) se muestra igualmente como fallback.
   */
  hasAnalytics = computed(() => {
    const isClientView = this.adminViewSvc.isClientViewMode();
    if (!isClientView && !this.authService.isStoreUser()) return false;
    return this.modulesSvc.approvedCodes().has('MOD_INVOICING') || this.modulesSvc.loadFailed();
  });

  // ── Getters de presentación ─────────────────────────────────────────

  get firstName(): string {
    return this.authService.currentUser()?.full_name?.split(' ')?.[0] ?? '';
  }

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  private buildChartOptions(data: DashboardData): any {
    const days = data.revenueByDay;
    const exp  = data.expensesByDay;
    return {
      series: [
        { name: 'Ingresos', data: days.map(d => d.amount) },
        { name: 'Gastos',   data: exp.map(d => d.amount)  },
      ],
      chart:       { type: 'area' as const, height: 300, toolbar: { show: false }, fontFamily: 'inherit' },
      xaxis:       {
        categories: days.map(d => d.date),
        labels:     { style: { fontSize: '11px', colors: '#64748b' } },
        axisBorder: { show: false },
        axisTicks:  { show: false },
      },
      yaxis:       {
        min: 0,
        labels: { formatter: (v: number) => `$${v.toFixed(0)}`, style: { fontSize: '11px', colors: '#64748b' } },
      },
      colors:  ['#22c55e', '#f43f5e'],
      fill:    {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.25, opacityTo: 0.01, stops: [0, 100] },
      },
      stroke:      { curve: 'smooth' as const, width: [2, 2] },
      dataLabels:  { enabled: false },
      grid:        { borderColor: '#f1f5f9', strokeDashArray: 4, padding: { left: 0, right: 0 } },
      legend:      { position: 'top' as const, horizontalAlign: 'right' as const, fontSize: '12px' },
      tooltip:     { y: { formatter: (v: number) => `$${v.toFixed(2)}` } },
    };
  }

  // ── Ciclo de vida ───────────────────────────────────────────────────

  ngOnInit(): void {
    const isClientView = this.adminViewSvc.isClientViewMode();

    // Usuarios de plataforma fuera del modo cliente: no necesitan analytics
    if (!isClientView && !this.authService.isStoreUser()) {
      this.loading = false;
      return;
    }

    // En modo cliente el catálogo ya fue cargado por AdminViewService; solo continuamos.
    // Para usuarios de tienda siempre refrescamos el catálogo.
    if (isClientView) {
      this.afterCatalogReady();
    } else {
      this.modulesSvc.loadCatalog().subscribe({
        next:  () => this.afterCatalogReady(),
        error: () => this.afterCatalogReady(),
      });
    }
  }

  /** Decide si cargar analytics una vez que el catálogo de módulos está listo */
  private afterCatalogReady(): void {
    // En modo cliente el platform admin no tiene company_id en el token,
    // las llamadas a invoices/products/customers darían 403 — no cargar analytics.
    if (this.adminViewSvc.isClientViewMode()) {
      this.loading = false;
      return;
    }
    if (this.hasAnalytics()) {
      this.load();
    } else {
      this.loading = false;
    }
  }

  load(): void {
    this.loading = !this.data;
    this.sub = this.dashboardService.getDashboardData().pipe(
      finalize(() => { this.loading = false; })
    ).subscribe({
      next: data => {
        this.data = data;
        this.lastUpdated = new Date();
        this.chartOptions = this.buildChartOptions(data);
      },
      error: () => {},
    });
  }

  refresh(): void {
    this.sub?.unsubscribe();
    this.data = null;
    this.chartOptions = {};
    this.load();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(value);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
  }
}
