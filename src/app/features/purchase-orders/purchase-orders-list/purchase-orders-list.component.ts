import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PurchaseOrdersService } from '../../../core/services/purchase-orders.service';
import { PurchaseOrder } from '../../../core/models/purchase-order.model';

@Component({
  selector: 'app-purchase-orders-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatTableModule, MatButtonModule,
    MatIconModule, MatPaginatorModule, MatTooltipModule, MatProgressSpinnerModule,
  ],
  templateUrl: './purchase-orders-list.component.html',
})
export class PurchaseOrdersListComponent implements OnInit {
  private svc = inject(PurchaseOrdersService);

  orders = signal<PurchaseOrder[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  limit = signal(10);
  displayedColumns = ['number', 'supplier', 'date', 'total', 'status', 'actions'];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.list({ page: this.page(), limit: this.limit() }).subscribe({
      next: res => { this.orders.set(res.data); this.total.set(res.total); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onPageChange(e: PageEvent): void { this.page.set(e.pageIndex + 1); this.limit.set(e.pageSize); this.load(); }

  statusClass(s: string): string {
    const map: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-700',
      partial: 'bg-blue-50 text-blue-700',
      received: 'bg-green-50 text-green-700',
      cancelled: 'bg-red-50 text-red-700',
    };
    return map[s] ?? 'bg-gray-50 text-gray-600';
  }

  statusLabel(s: string): string {
    const map: Record<string, string> = { pending: 'Pendiente', partial: 'Parcial', received: 'Recibida', cancelled: 'Cancelada' };
    return map[s] ?? s;
  }
}
