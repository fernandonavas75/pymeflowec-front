import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { interval, Subscription, switchMap, startWith } from 'rxjs';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
  isRefreshing = false;
  lastUpdated = new Date();
  private subscription?: Subscription;

  ordersColumns = ['id', 'client', 'date', 'status', 'total'];
  invoicesColumns = ['number', 'date', 'total', 'status'];

  get firstName(): string {
    return this.authService.currentUser()?.full_name?.split(' ')?.[0] ?? '';
  }

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  get donutChartOptions() {
    if (!this.data) return {};
    const d = this.data.ordersByStatus;
    return {
      series: [d.pending, d.confirmed, d.shipped, d.delivered, d.cancelled],
      chart: { type: 'donut' as const, height: 260, toolbar: { show: false } },
      labels: ['Pendiente', 'Confirmado', 'Enviado', 'Entregado', 'Cancelado'],
      colors: ['#f59e0b', '#3b82f6', '#6366f1', '#22c55e', '#ef4444'],
      legend: { position: 'bottom' as const, fontSize: '12px' },
      plotOptions: { pie: { donut: { size: '65%' } } },
      dataLabels: { enabled: false },
      responsive: [{ breakpoint: 480, options: { chart: { height: 220 } } }],
    };
  }

  get barChartOptions() {
    if (!this.data) return {};
    const orders = this.data.recentOrders;
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    const counts = last7.map(day => {
      return orders.filter(o => {
        const oDate = new Date(o.order_date || o.created_at);
        return oDate.toDateString() === day.toDateString();
      }).length;
    });

    const labels = last7.map(d =>
      d.toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric' })
    );

    return {
      series: [{ name: 'Pedidos', data: counts }],
      chart: { type: 'area' as const, height: 260, toolbar: { show: false }, sparkline: { enabled: false } },
      xaxis: { categories: labels, labels: { style: { fontSize: '11px' } } },
      yaxis: { min: 0, tickAmount: 3 },
      colors: ['#6366f1'],
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 } },
      stroke: { curve: 'smooth' as const, width: 2 },
      dataLabels: { enabled: false },
      grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
      tooltip: { y: { formatter: (v: number) => `${v} pedido${v !== 1 ? 's' : ''}` } },
    };
  }

  ngOnInit(): void {
    this.subscription = interval(30000).pipe(
      startWith(0),
      switchMap(() => {
        if (!this.loading) this.isRefreshing = true;
        return this.dashboardService.getDashboardData();
      })
    ).subscribe({
      next: data => {
        this.data = data;
        this.loading = false;
        this.isRefreshing = false;
        this.lastUpdated = new Date();
      },
      error: () => {
        this.loading = false;
        this.isRefreshing = false;
      },
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(value);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
