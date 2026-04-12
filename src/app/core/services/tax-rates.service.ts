import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { TaxRate, CreateTaxRateDto, UpdateTaxRateDto } from '../models/tax-rate.model';
import { PaginatedResponse, PaginationParams, ApiResponse, ApiListResponse } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class TaxRatesService {
  private api = inject(ApiService);

  list(params?: PaginationParams): Observable<PaginatedResponse<TaxRate>> {
    return this.api.get<ApiListResponse<TaxRate>>('/tax-rates', params as Record<string, string | number | boolean | undefined>).pipe(
      map(res => ({
        data: res.data,
        total: res.pagination.total,
        page: res.pagination.current_page,
        limit: res.pagination.per_page,
        totalPages: res.pagination.total_pages,
      }))
    );
  }

  getById(id: number | string): Observable<TaxRate> {
    return this.api.get<ApiResponse<TaxRate>>(`/tax-rates/${id}`).pipe(
      map(res => res.data)
    );
  }

  create(data: CreateTaxRateDto): Observable<TaxRate> {
    return this.api.post<ApiResponse<TaxRate>>('/tax-rates', data).pipe(
      map(res => res.data)
    );
  }

  update(id: number | string, data: UpdateTaxRateDto): Observable<TaxRate> {
    return this.api.put<ApiResponse<TaxRate>>(`/tax-rates/${id}`, data).pipe(
      map(res => res.data)
    );
  }
}
