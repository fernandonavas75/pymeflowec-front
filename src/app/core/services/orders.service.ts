import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Order, CreateOrderDto } from '../models/order.model';
import { PaginatedResponse, PaginationParams, ApiResponse, ApiListResponse } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private api = inject(ApiService);

  list(params?: PaginationParams): Observable<PaginatedResponse<Order>> {
    return this.api.get<ApiListResponse<Order>>('/orders', params as Record<string, string | number | boolean | undefined>).pipe(
      map(res => ({
        data: res.data,
        total: res.pagination.total,
        page: res.pagination.current_page,
        limit: res.pagination.per_page,
        totalPages: res.pagination.total_pages,
      }))
    );
  }

  getById(id: string): Observable<Order> {
    return this.api.get<ApiResponse<Order>>(`/orders/${id}`).pipe(
      map(res => res.data)
    );
  }

  create(data: CreateOrderDto): Observable<Order> {
    return this.api.post<ApiResponse<Order>>('/orders', data).pipe(
      map(res => res.data)
    );
  }

  confirm(id: string): Observable<Order> {
    return this.api.patch<ApiResponse<Order>>(`/orders/${id}/confirm`).pipe(
      map(res => res.data)
    );
  }

  ship(id: string): Observable<Order> {
    return this.api.patch<ApiResponse<Order>>(`/orders/${id}/ship`).pipe(
      map(res => res.data)
    );
  }

  deliver(id: string): Observable<Order> {
    return this.api.patch<ApiResponse<Order>>(`/orders/${id}/deliver`).pipe(
      map(res => res.data)
    );
  }

  cancel(id: string): Observable<Order> {
    return this.api.patch<ApiResponse<Order>>(`/orders/${id}/cancel`).pipe(
      map(res => res.data)
    );
  }
}
