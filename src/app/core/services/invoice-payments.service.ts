import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { InvoicePayment, CreateInvoicePaymentDto } from '../models/invoice-payment.model';
import { ApiResponse, FinanceListResponse, PaginatedResponse, PaginationParams } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class InvoicePaymentsService {
  private api = inject(ApiService);

  list(params?: PaginationParams): Observable<PaginatedResponse<InvoicePayment>> {
    return this.api.get<FinanceListResponse<InvoicePayment>>('/invoice-payments', {
      ...(params as Record<string, string | number | boolean | undefined>),
    }).pipe(
      map(res => ({
        data: res.data ?? [],
        total: res.pagination?.total ?? 0,
        page: res.pagination?.current_page ?? 1,
        limit: res.pagination?.per_page ?? 20,
        totalPages: res.pagination?.total_pages ?? 0,
      }))
    );
  }

  listByInvoice(invoiceId: number, params?: PaginationParams): Observable<PaginatedResponse<InvoicePayment>> {
    return this.api.get<FinanceListResponse<InvoicePayment>>('/invoice-payments', {
      invoice_id: invoiceId,
      ...(params as Record<string, string | number | boolean | undefined>),
    }).pipe(
      map(res => ({
        data: res.data ?? [],
        total: res.pagination?.total ?? 0,
        page: res.pagination?.current_page ?? 1,
        limit: res.pagination?.per_page ?? 20,
        totalPages: res.pagination?.total_pages ?? 0,
      }))
    );
  }

  create(data: CreateInvoicePaymentDto): Observable<InvoicePayment> {
    return this.api.post<ApiResponse<InvoicePayment>>('/invoice-payments', data).pipe(
      map(res => res.data)
    );
  }

  annul(id: number): Observable<InvoicePayment> {
    return this.api.patch<ApiResponse<InvoicePayment>>(`/invoice-payments/${id}/annul`).pipe(
      map(res => res.data)
    );
  }
}
