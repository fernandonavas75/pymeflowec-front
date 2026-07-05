import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { CompanyModulesService } from '../../core/services/company-modules.service';
import { AdminViewService } from '../../core/services/admin-view.service';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';

interface ModCard {
  icon: string; label: string; description: string;
  route: string; color: 'green'|'blue'|'purple'|'teal'|'amber'|'indigo'|'rose';
  moduleCode?: string; adminOnly?: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, AppIconComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  authService          = inject(AuthService);
  adminViewSvc         = inject(AdminViewService);
  private modulesSvc   = inject(CompanyModulesService);
  private snackBar     = inject(MatSnackBar);
  private destroyRef   = inject(DestroyRef);

  loading = signal(true);

  // ── Static card defs ──────────────────────────────────────────────
  private readonly STORE_CARDS: ModCard[] = [
    { icon: 'people',           label: 'Clientes',        description: 'Administra tus clientes',         route: '/customers',       color: 'blue',   moduleCode: 'MOD_INVOICING' },
    { icon: 'receipt_long',     label: 'Facturación',     description: 'Emite y controla tus facturas',   route: '/invoices',        color: 'green',  moduleCode: 'MOD_INVOICING' },
    { icon: 'inventory_2',      label: 'Productos',       description: 'Gestiona tu inventario',          route: '/products',        color: 'purple', moduleCode: 'MOD_PRODUCTS' },
    { icon: 'local_shipping',   label: 'Proveedores',     description: 'Controla tus proveedores',        route: '/suppliers',       color: 'teal',   moduleCode: 'MOD_PARAMS' },
    { icon: 'percent',          label: 'Impuestos',       description: 'Configura tasas de impuesto',     route: '/tax-rates',       color: 'amber',  moduleCode: 'MOD_PARAMS', adminOnly: true },
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

  hasPendingModules   = computed(() => this.authService.isStoreUser() && this.modulesSvc.pendingCodes().size > 0);
  pendingModulesCount = computed(() => this.modulesSvc.pendingCodes().size);

  firstName = computed(() => this.authService.currentUser()?.full_name?.split(' ')?.[0] ?? '');

  readonly todayDate = (() => {
    const d = new Date();
    const wd = d.toLocaleDateString('es-EC', { weekday: 'long' });
    const mo = d.toLocaleDateString('es-EC', { month: 'long' });
    return `Dashboard · Hoy ${wd} ${d.getDate()} de ${mo}, ${d.getFullYear()}`;
  })();

  // ── Lifecycle ─────────────────────────────────────────────────────
  ngOnInit(): void {
    const isCV = this.adminViewSvc.isClientViewMode();
    if (isCV || !this.authService.isStoreUser()) { this.loading.set(false); return; }
    this.modulesSvc.loadCatalog()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  () => this.loading.set(false),
        error: () => this.loading.set(false),
      });
  }

  comingSoon(): void {
    this.snackBar.open('🚧 Funcionalidad en desarrollo', 'Cerrar', { duration: 3000 });
  }
}
