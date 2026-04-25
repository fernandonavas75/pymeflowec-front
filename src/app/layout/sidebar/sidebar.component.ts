import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { CompanyModulesService } from '../../core/services/company-modules.service';
import { AdminViewService } from '../../core/services/admin-view.service';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  /**
   * Solo visible para STORE_ADMIN (NO para platform ni store_seller).
   * Nunca se muestra a usuarios de plataforma.
   */
  adminOnly?: boolean;
  /** Solo visible para usuarios de plataforma (company_id = null) */
  platformOnly?: boolean;
  /** Solo visible para PLATFORM_ADMIN (no para PLATFORM_STAFF) */
  platformAdminOnly?: boolean;
  /**
   * Código del módulo en la BD. Para STORE_ADMIN gatea la visibilidad del item
   * en base al estado del módulo en la empresa (APPROVED = activo, PENDING = en espera).
   * Para STORE_SELLER el item siempre se muestra (sin gating).
   * Implica que es un item de tienda (oculto para usuarios de plataforma).
   * Si además tiene adminOnly=true, también filtra por rol STORE_ADMIN.
   */
  moduleCode?: string;
  /** Oculto para STORE_WAREHOUSE (bodeguero no factura ni atiende clientes). */
  warehouseHidden?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Item ya procesado para la vista: incluye moduleStatus calculado */
interface RenderedItem extends NavItem {
  moduleStatus: 'APPROVED' | 'PENDING' | null;
}

interface RenderedGroup {
  label: string;
  items: RenderedItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, AppIconComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  authService        = inject(AuthService);
  adminViewSvc       = inject(AdminViewService);
  private modulesSvc = inject(CompanyModulesService);
  collapsed          = input<boolean>(false);

  moduleLoading = signal(false);

  /**
   * Definición estática de la navegación.
   *
   * Regla de moduleCode:
   *  - Para STORE_ADMIN: el item se muestra solo si la empresa tiene el módulo
   *    APPROVED o PENDING (gating dinámico cargado desde la API).
   *  - Para STORE_SELLER: el item SIEMPRE se muestra (el admin ya gestionó los módulos).
   *  - Para plataforma: nunca se muestra.
   *
   * Usa el campo `code` exacto de la tabla `erp.modules` de tu BD.
   */
  private readonly navGroups: NavGroup[] = [
    // ── Facturación (requiere MOD_INVOICING para store admin) ─────────
    {
      label: 'Facturación',
      items: [
        { label: 'Clientes', icon: 'people',      route: '/customers', moduleCode: 'MOD_INVOICING', warehouseHidden: true },
        { label: 'Facturas', icon: 'receipt_long', route: '/invoices',  moduleCode: 'MOD_INVOICING', warehouseHidden: true },
      ],
    },
    // ── Catálogo (productos requiere MOD_PRODUCTS, prov. MOD_SUPPLIERS) ─
    {
      label: 'Catálogo',
      items: [
        { label: 'Productos',   icon: 'inventory_2',    route: '/products',  moduleCode: 'MOD_PRODUCTS' },
        { label: 'Proveedores', icon: 'local_shipping', route: '/suppliers', moduleCode: 'MOD_SUPPLIERS' },
      ],
    },
    // ── Administración: sólo STORE_ADMIN ────────────────────────────
    {
      label: 'Administración',
      items: [
        {
          label: 'Tasas de impuesto',
          icon:  'percent',
          route: '/tax-rates',
          adminOnly: true,
          moduleCode: 'MOD_TAX',
        },
        { label: 'Usuarios', icon: 'manage_accounts', route: '/users',           adminOnly: true },
        { label: 'Módulos',  icon: 'extension',       route: '/module-requests', adminOnly: true },
      ],
    },
    // ── Plataforma: sólo usuarios sin empresa ────────────────────────
    {
      label: 'Plataforma',
      items: [
        { label: 'Empresas',           icon: 'business',        route: '/companies',                platformOnly: true },
        { label: 'Solicitudes',        icon: 'pending_actions', route: '/module-requests',           platformOnly: true },
        { label: 'Usuarios soporte',   icon: 'support_agent',   route: '/platform/support-users',   platformOnly: true, platformAdminOnly: true },
        { label: 'Auditoría',          icon: 'manage_search',   route: '/platform/audit-logs',      platformOnly: true },
      ],
    },
  ];

  ngOnInit(): void {
    // Todos los usuarios de tienda cargan el catálogo de módulos.
    if (this.authService.isStoreUser()) {
      this.moduleLoading.set(true);
      this.modulesSvc.loadCatalog().subscribe({
        next:  () => this.moduleLoading.set(false),
        error: () => this.moduleLoading.set(false),
      });
    }
  }

  visibleNavGroups = computed((): RenderedGroup[] => {
    const isClientView    = this.adminViewSvc.isClientViewMode();
    const clientLoading   = this.adminViewSvc.loading();

    // En modo cliente el administrador de plataforma se comporta como STORE_ADMIN
    const isSystem        = isClientView ? false : this.authService.isSystemUser();
    const isAdmin         = isClientView ? true  : this.authService.isStoreAdmin();
    const isPlatformAdmin = this.authService.isPlatformAdmin();
    const isWarehouse     = this.authService.isStoreWarehouse();
    const approved   = this.modulesSvc.approvedCodes();
    const pending    = this.modulesSvc.pendingCodes();
    const loadFailed = this.modulesSvc.loadFailed();

    // Mientras cargan los módulos en modo cliente, no renderizamos los grupos de tienda
    if (isClientView && clientLoading) return [];

    const groups: RenderedGroup[] = [];

    for (const group of this.navGroups) {
      const items: RenderedItem[] = [];

      for (const item of group.items) {

        // ── 0. Items ocultos para bodeguero ────────────────────────
        if (item.warehouseHidden && isWarehouse) continue;

        // ── 1. Items de plataforma ──────────────────────────────────
        if (item.platformOnly) {
          // En modo cliente ocultamos la sección de plataforma
          if (!isClientView && isSystem) {
            // platformAdminOnly → solo PLATFORM_ADMIN puede verlo
            if (item.platformAdminOnly && !isPlatformAdmin) continue;
            items.push({ ...item, moduleStatus: null });
          }
          continue;
        }

        // Los usuarios de plataforma no ven nada más (salvo que estén en modo cliente)
        if (isSystem) continue;

        // ── 2. Items con código de módulo ───────────────────────────
        if (item.moduleCode) {
          if (item.adminOnly && !isAdmin) continue; // requiere ser admin además del módulo

          // Fallback: si la API falló mostramos todos los items operacionales
          if (loadFailed) {
            items.push({ ...item, moduleStatus: null });
            continue;
          }

          const code       = item.moduleCode;
          const isApproved = approved.has(code);
          const isPending  = pending.has(code);

          if (isAdmin) {
            // STORE_ADMIN: gating dinámico — muestra APPROVED (activo) y PENDING (en espera)
            if (!isApproved && !isPending) continue;
            const moduleStatus: 'APPROVED' | 'PENDING' = isApproved ? 'APPROVED' : 'PENDING';
            items.push({ ...item, moduleStatus });
          } else {
            // STORE_SELLER: solo muestra módulos APROBADOS (sin indicador de espera)
            if (!isApproved) continue;
            items.push({ ...item, moduleStatus: null });
          }
          continue;
        }

        // ── 3. Items solo para STORE_ADMIN (sin código de módulo) ───
        if (item.adminOnly) {
          if (isAdmin) items.push({ ...item, moduleStatus: null });
          continue;
        }

        // ── 4. Items generales de tienda ────────────────────────────
        items.push({ ...item, moduleStatus: null });
      }

      if (items.length > 0) groups.push({ label: group.label, items });
    }

    return groups;
  });

  get userInitials(): string {
    const name = this.authService.currentUser()?.full_name || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  logout(): void {
    this.adminViewSvc.exitClientView();
    this.modulesSvc.reset();
    this.authService.logout();
  }
}
