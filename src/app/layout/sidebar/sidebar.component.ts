import { Component, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  /** Solo visible para STORE_ADMIN (o plataforma) */
  adminOnly?: boolean;
  /** Solo visible para usuarios de plataforma */
  platformOnly?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule, MatTooltipModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  authService = inject(AuthService);
  collapsed = input<boolean>(false);

  private navGroups: NavGroup[] = [
    {
      label: 'Ventas',
      items: [
        { label: 'Clientes',  icon: 'people',       route: '/customers' },
        { label: 'Facturas',  icon: 'receipt_long',  route: '/invoices'  },
      ],
    },
    {
      label: 'Inventario',
      items: [
        { label: 'Productos',   icon: 'inventory_2',    route: '/products'  },
        { label: 'Proveedores', icon: 'local_shipping', route: '/suppliers' },
      ],
    },
    {
      label: 'Administración',
      items: [
        { label: 'Tasas de impuesto', icon: 'percent',          route: '/tax-rates',       adminOnly: true },
        { label: 'Usuarios',          icon: 'manage_accounts',  route: '/users',           adminOnly: true },
        { label: 'Módulos',           icon: 'extension',        route: '/module-requests', adminOnly: true },
      ],
    },
    {
      label: 'Plataforma',
      items: [
        { label: 'Empresas',  icon: 'business', route: '/companies',       platformOnly: true },
        { label: 'Módulos',   icon: 'widgets',  route: '/platform/modules', platformOnly: true },
      ],
    },
  ];

  get visibleNavGroups(): NavGroup[] {
    const isSystem  = this.authService.isSystemUser();
    const isAdmin   = this.authService.isStoreAdmin();

    return this.navGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item => {
          if (item.platformOnly) return isSystem;
          if (item.adminOnly)    return isSystem || isAdmin;
          return true;
        }),
      }))
      .filter(group => group.items.length > 0);
  }

  get userInitials(): string {
    const name = this.authService.currentUser()?.full_name || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  logout(): void {
    this.authService.logout();
  }
}
