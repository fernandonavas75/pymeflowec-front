import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Order, CreateOrderDto } from '../models/order.model';
import { PaginatedResponse, PaginationParams } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private api = inject(ApiService);

  list(params?: PaginationParams): Observable<PaginatedResponse<Order>> {
    return this.api.get<PaginatedResponse<Order>>('/orders', params as Record<string, string | number | boolean | undefined>);
  }

  getById(id: string): Observable<Order> {
    return this.api.get<Order>(`/orders/${id}`);
  }

  create(data: CreateOrderDto): Observable<Order> {
    return this.api.post<Order>('/orders', data);
  }

  confirm(id: string): Observable<Order> {
    return this.api.patch<Order>(`/orders/${id}/confirm`);
  }

  ship(id: string): Observable<Order> {
    return this.api.patch<Order>(`/orders/${id}/ship`);
  }

  deliver(id: string): Observable<Order> {
    return this.api.patch<Order>(`/orders/${id}/deliver`);
  }

  cancel(id: string): Observable<Order> {
    return this.api.patch<Order>(`/orders/${id}/cancel`);
  }
}
