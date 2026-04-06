import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PurchaseOrder, CreatePurchaseOrderDto, ReceivePurchaseOrderDto, PurchaseOrderStatus } from '../models/purchase-order.model';
import { ApiListResponse, ApiResponse, PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class PurchaseOrdersService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/purchase-orders`;

  list(params: Record<string, string | number | boolean | undefined> = {}): Observable<PaginatedResponse<PurchaseOrder>> {
    return this.http.get<ApiListResponse<PurchaseOrder>>(this.base, { params: params as Record<string, string> }).pipe(
      map(res => ({
        data: res.data,
        total: res.pagination.total,
        page: res.pagination.current_page,
        limit: res.pagination.per_page,
        totalPages: res.pagination.total_pages,
      }))
    );
  }

  getById(id: number): Observable<PurchaseOrder> {
    return this.http.get<ApiResponse<PurchaseOrder>>(`${this.base}/${id}`).pipe(map(r => r.data));
  }

  create(dto: CreatePurchaseOrderDto): Observable<PurchaseOrder> {
    return this.http.post<ApiResponse<PurchaseOrder>>(this.base, dto).pipe(map(r => r.data));
  }

  receive(id: number, dto: ReceivePurchaseOrderDto): Observable<PurchaseOrder> {
    return this.http.patch<ApiResponse<PurchaseOrder>>(`${this.base}/${id}/receive`, dto).pipe(map(r => r.data));
  }

  updateStatus(id: number, status: PurchaseOrderStatus): Observable<PurchaseOrder> {
    return this.http.patch<ApiResponse<PurchaseOrder>>(`${this.base}/${id}/status`, { status }).pipe(map(r => r.data));
  }
}
