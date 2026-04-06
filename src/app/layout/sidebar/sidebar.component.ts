import { Component, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  permission?: string;
  platformStaff?: boolean;
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
  toggleCollapse = output<void>();

  private navGroups: NavGroup[] = [
    {
      label: 'Ventas',
      items: [
        { label: 'Clientes',          icon: 'people',           route: '/clients',       permission: 'clients.view'        },
        { label: 'Pedidos',           icon: 'shopping_cart',    route: '/orders',        permission: 'orders.view'         },
        { label: 'Facturas',          icon: 'receipt_long',     route: '/invoices',      permission: 'invoices.view'       },
        { label: 'Pagos',             icon: 'payments',         route: '/payments',      permission: 'payments.view'       },
        { label: 'Notas de crédito',  icon: 'note_alt',         route: '/credit-notes',  permission: 'credit_notes.manage' },
      ],
    },
    {
      label: 'Inventario',
      items: [
        { label: 'Productos',   icon: 'inventory_2', route: '/products',   permission: 'products.view' },
        { label: 'Categorías',  icon: 'category',    route: '/categories', permission: 'products.view' },
      ],
    },
    {
      label: 'Compras',
      items: [
        { label: 'Proveedores',         icon: 'local_shipping', route: '/suppliers',       permission: 'suppliers.view'  },
        { label: 'Órdenes de compra',   icon: 'shopping_bag',   route: '/purchase-orders', permission: 'purchases.view'  },
      ],
    },
    {
      label: 'Finanzas',
      items: [
        { label: 'Caja',    icon: 'point_of_sale',          route: '/cash-registers', permission: 'cash_register.operate' },
        { label: 'Gastos',  icon: 'account_balance_wallet', route: '/expenses',       permission: 'expenses.view'         },
      ],
    },
    {
      label: 'Administración',
      items: [
        { label: 'Usuarios',  icon: 'manage_accounts', route: '/users',          permission: 'users.view'          },
        { label: 'Roles',     icon: 'security',        route: '/roles',          permission: 'roles.manage'        },
        { label: 'Módulos',   icon: 'extension',       route: '/module-requests', permission: 'modules.view'       },
      ],
    },
    {
      label: 'Plataforma',
      items: [
        { label: 'Organizaciones',  icon: 'business',              route: '/organizations',     platformStaff: true },
        { label: 'Módulos',         icon: 'widgets',               route: '/platform/modules',  platformStaff: true },
        { label: 'Staff',           icon: 'admin_panel_settings',  route: '/platform/staff',    platformStaff: true },
      ],
    },
  ];

  get visibleNavGroups(): NavGroup[] {
    const isSystem = this.authService.isSystemUser();
    return this.navGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item => {
          if (item.platformStaff) return isSystem || this.authService.isPlatformStaff();
          if (item.permission)   return isSystem || this.authService.hasPermission(item.permission);
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

  onToggle(): void {
    this.toggleCollapse.emit();
  }
}
