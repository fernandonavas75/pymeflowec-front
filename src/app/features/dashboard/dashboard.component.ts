import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DashboardService, DashboardData } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NgApexchartsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    StatCardComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private dashboardService = inject(DashboardService);
  authService = inject(AuthService);

  data: DashboardData | null = null;
  loading = true;
  lastUpdated = new Date();
  private sub?: Subscription;

  invoicesColumns = ['number', 'date', 'total', 'status'];

  get isStoreUser(): boolean {
    return this.authService.isStoreUser();
  }

  get isAdmin(): boolean {
    return this.authService.isStoreAdmin();
  }

  get firstName(): string {
    return this.authService.currentUser()?.full_name?.split(' ')?.[0] ?? '';
  }

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  get revenueChartOptions() {
    if (!this.data) return {};
    const days = this.data.revenueByDay;
    return {
      series: [{ name: 'Ingresos facturados', data: days.map(d => d.amount) }],
      chart: { type: 'area' as const, height: 280, toolbar: { show: false }, fontFamily: 'inherit' },
      xaxis: {
        categories: days.map(d => d.date),
        labels: { style: { fontSize: '11px', colors: '#64748b' } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        min: 0,
        labels: { formatter: (v: number) => `$${v.toFixed(0)}`, style: { fontSize: '11px', colors: '#64748b' } },
      },
      colors: ['#22c55e'],
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.01, stops: [0, 100] } },
      stroke: { curve: 'smooth' as const, width: 2 },
      dataLabels: { enabled: false },
      grid: { borderColor: '#f1f5f9', strokeDashArray: 4, padding: { left: 0, right: 0 } },
      tooltip: { y: { formatter: (v: number) => `$${v.toFixed(2)}` } },
    };
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = !this.data;
    this.sub = this.dashboardService.getDashboardData().subscribe({
      next: data => {
        this.data = data;
        this.loading = false;
        this.lastUpdated = new Date();
      },
      error: () => { this.loading = false; },
    });
  }

  refresh(): void {
    this.sub?.unsubscribe();
    this.data = null;
    this.load();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(value);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
  }
}
