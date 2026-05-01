import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { AdminViewService } from '../../core/services/admin-view.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterLink, AppIconComponent],
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

  menuOpen = signal(false);

  get userInitials(): string {
    const name = this.authService.currentUser()?.full_name || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  get companyName(): string {
    return this.authService.currentUser()?.company?.name || '';
  }

  toggleMenu(): void { this.menuOpen.update(v => !v); }
  closeMenu(): void  { this.menuOpen.set(false); }

  logout(): void {
    this.authService.logout();
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }
}
