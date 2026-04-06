import { Component, inject, OnDestroy, OnInit, computed } from '@angular/core';
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

  // Permisos para mostrar/ocultar secciones
  canViewOrders   = computed(() => this.authService.hasPermission('orders.view'));
  canViewInvoices = computed(() => this.authService.hasPermission('invoices.view'));
  canViewProducts = computed(() => this.authService.hasPermission('products.view'));
  canViewClients  = computed(() => this.authService.hasPermission('clients.view'));
  canCreateOrder   = computed(() => this.authService.hasPermission('orders.create'));
  canCreateClient  = computed(() => this.authService.hasPermission('clients.create'));
  canCreateProduct = computed(() => this.authService.hasPermission('products.create'));
  canCreateInvoice = computed(() => this.authService.hasPermission('invoices.create'));

  ordersColumns   = ['id', 'client', 'date', 'status', 'total'];
  invoicesColumns = ['number', 'date', 'total', 'status'];

  get firstName(): string {
    return this.authService.currentUser()?.full_name?.split(' ')?.[0] ?? '';
  }

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  get donutChartOptions() {
    if (!this.data) return {};
    const d = this.data.ordersByStatus;
    const total = d.pending + d.confirmed + d.shipped + d.delivered + d.cancelled;
    return {
      series: [d.pending, d.confirmed, d.shipped, d.delivered, d.cancelled],
      chart: { type: 'donut' as const, height: 280, toolbar: { show: false } },
      labels: ['Pendiente', 'Confirmado', 'Enviado', 'Entregado', 'Cancelado'],
      colors: ['#f59e0b', '#3b82f6', '#6366f1', '#22c55e', '#ef4444'],
      legend: { position: 'bottom' as const, fontSize: '12px', fontFamily: 'inherit' },
      plotOptions: {
        pie: {
          donut: {
            size: '68%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                fontSize: '13px',
                fontWeight: '600',
                color: '#374151',
                formatter: () => String(total),
              },
            },
          },
        },
      },
      dataLabels: { enabled: false },
      stroke: { width: 0 },
      responsive: [{ breakpoint: 480, options: { chart: { height: 220 } } }],
    };
  }

  get revenueChartOptions() {
    if (!this.data) return {};
    const days = this.data.revenueByDay;
    return {
      series: [{ name: 'Ingresos cobrados', data: days.map(d => d.amount) }],
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
