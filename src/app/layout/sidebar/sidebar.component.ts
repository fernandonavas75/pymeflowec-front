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
  roles?: string[];
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

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Productos', icon: 'inventory_2', route: '/products' },
    { label: 'Clientes', icon: 'people', route: '/clients' },
    { label: 'Proveedores', icon: 'local_shipping', route: '/suppliers', roles: ['superadmin', 'admin', 'manager'] },
    { label: 'Pedidos', icon: 'shopping_cart', route: '/orders' },
    { label: 'Facturas', icon: 'receipt_long', route: '/invoices' },
    { label: 'Usuarios', icon: 'manage_accounts', route: '/users', roles: ['superadmin', 'admin'] },
  ];

  get visibleNavItems(): NavItem[] {
    const role = this.authService.role();
    return this.navItems.filter(item => {
      if (!item.roles) return true;
      return role && item.roles.includes(role);
    });
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
