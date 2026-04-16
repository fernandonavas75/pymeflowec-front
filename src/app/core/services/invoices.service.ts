import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Invoice, CreateInvoiceDto } from '../models/invoice.model';
import { PaginatedResponse, PaginationParams, ApiResponse, ApiListResponse } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class InvoicesService {
  private api = inject(ApiService);

  list(params?: PaginationParams): Observable<PaginatedResponse<Invoice>> {
    return this.api.get<ApiListResponse<Invoice>>('/invoices', params as Record<string, string | number | boolean | undefined>).pipe(
      map(res => ({
        data: res.data ?? [],
        total: res.pagination?.total ?? 0,
        page: res.pagination?.current_page ?? 1,
        limit: res.pagination?.per_page ?? 20,
        totalPages: res.pagination?.total_pages ?? 0,
      }))
    );
  }

  getById(id: number | string): Observable<Invoice> {
    return this.api.get<ApiResponse<Invoice>>(`/invoices/${id}`).pipe(
      map(res => res.data)
    );
  }

  create(data: CreateInvoiceDto): Observable<Invoice> {
    return this.api.post<ApiResponse<Invoice>>('/invoices', data).pipe(
      map(res => res.data)
    );
  }

  cancel(id: number | string): Observable<Invoice> {
    return this.api.patch<ApiResponse<Invoice>>(`/invoices/${id}/cancel`).pipe(
      map(res => res.data)
    );
  }
}
