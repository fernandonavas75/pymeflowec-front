import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Supplier, CreateSupplierDto, UpdateSupplierDto } from '../models/supplier.model';
import { PaginatedResponse, PaginationParams, ApiResponse, ApiListResponse } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class SuppliersService {
  private api = inject(ApiService);

  list(params?: PaginationParams): Observable<PaginatedResponse<Supplier>> {
    return this.api.get<ApiListResponse<Supplier>>('/suppliers', params as Record<string, string | number | boolean | undefined>).pipe(
      map(res => ({
        data: res.data,
        total: res.pagination.total,
        page: res.pagination.current_page,
        limit: res.pagination.per_page,
        totalPages: res.pagination.total_pages,
      }))
    );
  }

  getById(id: string): Observable<Supplier> {
    return this.api.get<ApiResponse<Supplier>>(`/suppliers/${id}`).pipe(
      map(res => res.data)
    );
  }

  create(data: CreateSupplierDto): Observable<Supplier> {
    return this.api.post<ApiResponse<Supplier>>('/suppliers', data).pipe(
      map(res => res.data)
    );
  }

  update(id: string, data: UpdateSupplierDto): Observable<Supplier> {
    return this.api.put<ApiResponse<Supplier>>(`/suppliers/${id}`, data).pipe(
      map(res => res.data)
    );
  }

  activate(id: string): Observable<Supplier> {
    return this.api.patch<ApiResponse<Supplier>>(`/suppliers/${id}/activate`).pipe(
      map(res => res.data)
    );
  }

  deactivate(id: string): Observable<Supplier> {
    return this.api.patch<ApiResponse<Supplier>>(`/suppliers/${id}/deactivate`).pipe(
      map(res => res.data)
    );
  }

  remove(id: string): Observable<void> {
    return this.api.delete<void>(`/suppliers/${id}`);
  }
}
