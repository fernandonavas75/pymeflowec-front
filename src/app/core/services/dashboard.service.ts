import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { OrdersService } from './orders.service';
import { InvoicesService } from './invoices.service';
import { ProductsService } from './products.service';
import { ClientsService } from './clients.service';
import { Order } from '../models/order.model';
import { Invoice } from '../models/invoice.model';

export interface DashboardData {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalClients: number;
  lowStockProducts: number;
  ordersByStatus: {
    pending: number;
    confirmed: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  recentOrders: Order[];
  recentInvoices: Invoice[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private ordersService = inject(OrdersService);
  private invoicesService = inject(InvoicesService);
  private productsService = inject(ProductsService);
  private clientsService = inject(ClientsService);

  getDashboardData(): Observable<DashboardData> {
    return forkJoin({
      orders: this.ordersService.list({ page: 1, limit: 100 }),
      invoices: this.invoicesService.list({ page: 1, limit: 100 }),
      products: this.productsService.list({ page: 1, limit: 100 }),
      clients: this.clientsService.list({ page: 1, limit: 100 }),
    }).pipe(
      map(({ orders, invoices, products, clients }) => {
        const allOrders = orders.data;
        const allInvoices = invoices.data;
        const allProducts = products.data;

        const ordersByStatus = {
          pending: allOrders.filter(o => o.status === 'pending').length,
          confirmed: allOrders.filter(o => o.status === 'confirmed').length,
          shipped: allOrders.filter(o => o.status === 'shipped').length,
          delivered: allOrders.filter(o => o.status === 'delivered').length,
          cancelled: allOrders.filter(o => o.status === 'cancelled').length,
        };

        const totalRevenue = allInvoices
          .filter(i => i.status === 'paid')
          .reduce((sum, i) => sum + i.total, 0);

        const lowStockProducts = allProducts.filter(p => p.stock < 5).length;

        const recentOrders = allOrders
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);

        const recentInvoices = allInvoices
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);

        return {
          totalOrders: orders.total,
          pendingOrders: ordersByStatus.pending,
          totalRevenue,
          totalClients: clients.total,
          lowStockProducts,
          ordersByStatus,
          recentOrders,
          recentInvoices,
        };
      })
    );
  }
}
