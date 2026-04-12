import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Customer, CreateCustomerDto, UpdateCustomerDto } from '../models/customer.model';
import { PaginatedResponse, PaginationParams, ApiResponse, ApiListResponse } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class CustomersService {
  private api = inject(ApiService);

  list(params?: PaginationParams): Observable<PaginatedResponse<Customer>> {
    return this.api.get<ApiListResponse<Customer>>('/customers', params as Record<string, string | number | boolean | undefined>).pipe(
      map(res => ({
        data: res.data,
        total: res.pagination.total,
        page: res.pagination.current_page,
        limit: res.pagination.per_page,
        totalPages: res.pagination.total_pages,
      }))
    );
  }

  getById(id: number | string): Observable<Customer> {
    return this.api.get<ApiResponse<Customer>>(`/customers/${id}`).pipe(
      map(res => res.data)
    );
  }

  create(data: CreateCustomerDto): Observable<Customer> {
    return this.api.post<ApiResponse<Customer>>('/customers', data).pipe(
      map(res => res.data)
    );
  }

  update(id: number | string, data: UpdateCustomerDto): Observable<Customer> {
    return this.api.put<ApiResponse<Customer>>(`/customers/${id}`, data).pipe(
      map(res => res.data)
    );
  }

  remove(id: number | string): Observable<void> {
    return this.api.delete<void>(`/customers/${id}`);
  }
}
