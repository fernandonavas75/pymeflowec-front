import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { OrdersService } from './orders.service';
import { InvoicesService } from './invoices.service';
import { ProductsService } from './products.service';
import { ClientsService } from './clients.service';
import { Order } from '../models/order.model';
import { Invoice } from '../models/invoice.model';

export interface RevenueByDay {
  date: string;
  amount: number;
}

export interface DashboardData {
  totalOrders: number;
  pendingOrders: number;
  ordersByStatus: {
    pending: number;
    confirmed: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  recentOrders: Order[];
  totalInvoices: number;
  totalRevenue: number;
  overdueInvoices: number;
  revenueByDay: RevenueByDay[];
  recentInvoices: Invoice[];
  totalProducts: number;
  lowStockProducts: number;
  totalClients: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private ordersService = inject(OrdersService);
  private invoicesService = inject(InvoicesService);
  private productsService = inject(ProductsService);
  private clientsService = inject(ClientsService);

  getDashboardData(): Observable<DashboardData> {
    return forkJoin({
      orders: this.ordersService.list({ page: 1, limit: 20 }),
      invoices: this.invoicesService.list({ page: 1, limit: 20 }),
      products: this.productsService.list({ page: 1, limit: 50 }),
      clients: this.clientsService.list({ page: 1, limit: 1 }),
    }).pipe(
      map(({ orders, invoices, products, clients }) => {
        const allOrders = orders.data;
        const allInvoices = invoices.data;
        const allProducts = products.data;

        const ordersByStatus = {
          pending:   allOrders.filter(o => o.status === 'pending').length,
          confirmed: allOrders.filter(o => o.status === 'confirmed').length,
          shipped:   allOrders.filter(o => o.status === 'shipped').length,
          delivered: allOrders.filter(o => o.status === 'delivered').length,
          cancelled: allOrders.filter(o => o.status === 'cancelled').length,
        };

        const totalRevenue = allInvoices
          .filter(i => i.status === 'paid')
          .reduce((sum, i) => sum + i.total, 0);

        const overdueInvoices = allInvoices.filter(i => i.status === 'overdue').length;

        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d;
        });

        const revenueByDay: RevenueByDay[] = last7Days.map(day => ({
          date: day.toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric' }),
          amount: allInvoices
            .filter(inv =>
              inv.status === 'paid' &&
              new Date(inv.issue_date).toDateString() === day.toDateString()
            )
            .reduce((sum, inv) => sum + inv.total, 0),
        }));

        const recentOrders = [...allOrders]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);

        const recentInvoices = [...allInvoices]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);

        return {
          totalOrders: orders.total,
          pendingOrders: ordersByStatus.pending,
          ordersByStatus,
          recentOrders,
          totalInvoices: invoices.total,
          totalRevenue,
          overdueInvoices,
          revenueByDay,
          recentInvoices,
          totalProducts: products.total,
          lowStockProducts: allProducts.filter(p => p.stock < 5).length,
          totalClients: clients.total,
        };
      })
    );
  }
}
