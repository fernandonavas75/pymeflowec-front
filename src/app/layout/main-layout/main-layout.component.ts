import { Component, signal, OnInit, inject } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
})
export class MainLayoutComponent implements OnInit {
  private router = inject(Router);

  // En mobile (< 768px) el sidebar arranca cerrado
  sidebarCollapsed = signal(typeof window !== 'undefined' && window.innerWidth < 768);

  ngOnInit(): void {
    // Cierra el sidebar al navegar (solo en mobile)
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      if (window.innerWidth < 768) {
        this.sidebarCollapsed.set(true);
      }
    });
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  closeSidebar(): void {
    this.sidebarCollapsed.set(true);
  }
}
