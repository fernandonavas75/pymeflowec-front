import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { CompanyModulesService } from '../../core/services/company-modules.service';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
  /**
   * Código del módulo en la BD. Para STORE_ADMIN gatea la visibilidad del item
   * en base al estado del módulo en la empresa (APPROVED = activo, PENDING = en espera).
   * Para STORE_SELLER el item siempre se muestra (sin gating).
   * Implica que es un item de tienda (oculto para usuarios de plataforma).
   * Si además tiene adminOnly=true, también filtra por rol STORE_ADMIN.
   */
  moduleCode?: string;
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
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule, MatTooltipModule, MatProgressSpinnerModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  authService        = inject(AuthService);
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
        { label: 'Clientes', icon: 'people',      route: '/customers', moduleCode: 'MOD_INVOICING' },
        { label: 'Facturas', icon: 'receipt_long', route: '/invoices',  moduleCode: 'MOD_INVOICING' },
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
        { label: 'Empresas',    icon: 'business',        route: '/companies',       platformOnly: true },
        { label: 'Solicitudes', icon: 'pending_actions', route: '/module-requests', platformOnly: true },
      ],
    },
  ];

  ngOnInit(): void {
    // Todos los usuarios de tienda cargan el catálogo de módulos.
    // STORE_SELLER lo usa para ver solo módulos aprobados.
    // STORE_ADMIN lo usa para ver aprobados + pendientes (con indicador).
    if (this.authService.isStoreUser()) {
      this.moduleLoading.set(true);
      this.modulesSvc.loadCatalog().subscribe({
        next:  () => this.moduleLoading.set(false),
        error: () => this.moduleLoading.set(false),
      });
    }
  }

  visibleNavGroups = computed((): RenderedGroup[] => {
    const isSystem   = this.authService.isSystemUser();
    const isAdmin    = this.authService.isStoreAdmin();
    const approved   = this.modulesSvc.approvedCodes();
    const pending    = this.modulesSvc.pendingCodes();
    const loadFailed = this.modulesSvc.loadFailed();

    const groups: RenderedGroup[] = [];

    for (const group of this.navGroups) {
      const items: RenderedItem[] = [];

      for (const item of group.items) {

        // ── 1. Items de plataforma ──────────────────────────────────
        if (item.platformOnly) {
          if (isSystem) items.push({ ...item, moduleStatus: null });
          continue;
        }

        // Los usuarios de plataforma no ven nada más
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
    this.modulesSvc.reset();
    this.authService.logout();
  }
}
