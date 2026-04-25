import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { AdminViewService } from '../../core/services/admin-view.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatMenuModule, MatDividerModule, AppIconComponent],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent {
  authService   = inject(AuthService);
  themeService  = inject(ThemeService);
  adminViewSvc  = inject(AdminViewService);
  private router = inject(Router);

  sidebarCollapsed = input<boolean>(false);
  toggleSidebar    = output<void>();

  get userInitials(): string {
    const name = this.authService.currentUser()?.full_name || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  get companyName(): string {
    return this.authService.currentUser()?.company?.name || '';
  }

  logout(): void {
    this.authService.logout();
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }
}
