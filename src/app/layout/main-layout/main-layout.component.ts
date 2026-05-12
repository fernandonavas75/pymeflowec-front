import { Component, signal, OnInit, inject } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { AuthService } from '../../core/services/auth.service';
import { InvoiceSettingsService } from '../../core/services/invoice-settings.service';
import { InvoicePdfService } from '../../core/services/invoice-pdf.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
})
export class MainLayoutComponent implements OnInit {
  private router         = inject(Router);
  private auth           = inject(AuthService);
  private invoiceSetSvc  = inject(InvoiceSettingsService);
  private pdfSvc         = inject(InvoicePdfService);

  sidebarCollapsed = signal(typeof window !== 'undefined' && window.innerWidth < 768);

  ngOnInit(): void {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      if (window.innerWidth < 768) {
        this.sidebarCollapsed.set(true);
      }
    });

    // Carga la configuración de factura al arrancar (solo STORE_ADMIN)
    if (this.auth.isStoreAdmin()) {
      this.invoiceSetSvc.get().subscribe({
        next: (s) => this.pdfSvc.updateSettings(s),
        error: () => { /* silencioso — se usarán defaults */ },
      });
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  closeSidebar(): void {
    this.sidebarCollapsed.set(true);
  }
}
