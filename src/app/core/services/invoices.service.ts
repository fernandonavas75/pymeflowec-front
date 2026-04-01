import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Invoice, CreateManualInvoiceDto } from '../models/invoice.model';
import { PaginatedResponse, PaginationParams } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class InvoicesService {
  private api = inject(ApiService);

  list(params?: PaginationParams): Observable<PaginatedResponse<Invoice>> {
    return this.api.get<PaginatedResponse<Invoice>>('/invoices', params as Record<string, string | number | boolean | undefined>);
  }

  getById(id: string): Observable<Invoice> {
    return this.api.get<Invoice>(`/invoices/${id}`);
  }

  createFromOrder(orderId: string): Observable<Invoice> {
    return this.api.post<Invoice>('/invoices/from-order', { order_id: orderId });
  }

  createManual(data: CreateManualInvoiceDto): Observable<Invoice> {
    return this.api.post<Invoice>('/invoices/manual', data);
  }

  markPaid(id: string): Observable<Invoice> {
    return this.api.patch<Invoice>(`/invoices/${id}/paid`);
  }

  markOverdue(id: string): Observable<Invoice> {
    return this.api.patch<Invoice>(`/invoices/${id}/overdue`);
  }

  cancel(id: string): Observable<Invoice> {
    return this.api.patch<Invoice>(`/invoices/${id}/cancel`);
  }
}
