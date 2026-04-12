import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, catchError, of } from 'rxjs';
import { InvoicesService } from './invoices.service';
import { ProductsService } from './products.service';
import { CustomersService } from './customers.service';
import { Invoice } from '../models/invoice.model';

export interface RevenueByDay {
  date: string;
  amount: number;
}

export interface DashboardData {
  totalInvoices: number;
  issuedInvoices: number;
  totalRevenue: number;
  recentInvoices: Invoice[];
  revenueByDay: RevenueByDay[];
  totalProducts: number;
  lowStockProducts: number;
  totalCustomers: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private invoicesService  = inject(InvoicesService);
  private productsService  = inject(ProductsService);
  private customersService = inject(CustomersService);

  getDashboardData(): Observable<DashboardData> {
    const emptyList = { data: [] as any[], total: 0 };
    return forkJoin({
      invoices:  this.invoicesService.list({ page: 1, limit: 50 }).pipe(catchError(() => of(emptyList))),
      products:  this.productsService.list({ page: 1, limit: 50 }).pipe(catchError(() => of(emptyList))),
      customers: this.customersService.list({ page: 1, limit: 1 }).pipe(catchError(() => of(emptyList))),
    }).pipe(
      map(({ invoices, products, customers }) => {
        const allInvoices = invoices.data;
        const allProducts = products.data;

        const issuedInvoices = allInvoices.filter(i => i.status === 'ISSUED');

        const totalRevenue = issuedInvoices.reduce((sum, i) => sum + i.total, 0);

        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d;
        });

        const revenueByDay: RevenueByDay[] = last7Days.map(day => ({
          date: day.toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric' }),
          amount: issuedInvoices
            .filter(inv => new Date(inv.issue_date).toDateString() === day.toDateString())
            .reduce((sum, inv) => sum + inv.total, 0),
        }));

        const recentInvoices = [...allInvoices]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);

        return {
          totalInvoices:    invoices.total,
          issuedInvoices:   issuedInvoices.length,
          totalRevenue,
          recentInvoices,
          revenueByDay,
          totalProducts:    products.total,
          lowStockProducts: allProducts.filter(p => (p.stock ?? 0) < (p.min_stock ?? 5)).length,
          totalCustomers:   customers.total,
        };
      })
    );
  }
}
