import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OrdersService } from '../../../core/services/orders.service';
import { Order } from '../../../core/models/order.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatTooltipModule,
    StatusBadgeComponent,
  ],
  templateUrl: './orders-list.component.html',
})
export class OrdersListComponent implements OnInit {
  private ordersService = inject(OrdersService);

  orders = signal<Order[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  limit = signal(20);

  statusCtrl = new FormControl('');

  displayedColumns = ['id', 'client', 'date', 'status', 'total', 'actions'];

  ngOnInit(): void {
    this.loadOrders();
    this.statusCtrl.valueChanges.subscribe(() => {
      this.page.set(1);
      this.loadOrders();
    });
  }

  loadOrders(): void {
    this.loading.set(true);
    const params: Record<string, string | number | boolean | undefined> = {
      page: this.page(),
      limit: this.limit(),
    };
    if (this.statusCtrl.value) params['status'] = this.statusCtrl.value;

    this.ordersService.list(params).subscribe({
      next: res => {
        this.orders.set(res.data);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.limit.set(event.pageSize);
    this.loadOrders();
  }

  formatId(id: string | number): string {
    return `${id}`.slice(-6).toUpperCase();
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
