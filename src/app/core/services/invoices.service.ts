import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Invoice, CreateManualInvoiceDto } from '../models/invoice.model';
import { PaginatedResponse, PaginationParams, ApiResponse, ApiListResponse } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class InvoicesService {
  private api = inject(ApiService);

  list(params?: PaginationParams): Observable<PaginatedResponse<Invoice>> {
    return this.api.get<ApiListResponse<Invoice>>('/invoices', params as Record<string, string | number | boolean | undefined>).pipe(
      map(res => ({
        data: res.data,
        total: res.pagination.total,
        page: res.pagination.current_page,
        limit: res.pagination.per_page,
        totalPages: res.pagination.total_pages,
      }))
    );
  }

  getById(id: string): Observable<Invoice> {
    return this.api.get<ApiResponse<Invoice>>(`/invoices/${id}`).pipe(
      map(res => res.data)
    );
  }

  createFromOrder(orderId: string): Observable<Invoice> {
    return this.api.post<ApiResponse<Invoice>>('/invoices/from-order', { order_id: orderId }).pipe(
      map(res => res.data)
    );
  }

  createManual(data: CreateManualInvoiceDto): Observable<Invoice> {
    return this.api.post<ApiResponse<Invoice>>('/invoices/manual', data).pipe(
      map(res => res.data)
    );
  }

  markPaid(id: string): Observable<Invoice> {
    return this.api.patch<ApiResponse<Invoice>>(`/invoices/${id}/paid`).pipe(
      map(res => res.data)
    );
  }

  markOverdue(id: string): Observable<Invoice> {
    return this.api.patch<ApiResponse<Invoice>>(`/invoices/${id}/overdue`).pipe(
      map(res => res.data)
    );
  }

  cancel(id: string): Observable<Invoice> {
    return this.api.patch<ApiResponse<Invoice>>(`/invoices/${id}/cancel`).pipe(
      map(res => res.data)
    );
  }
}
