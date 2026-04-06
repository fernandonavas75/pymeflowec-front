import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Product, CreateProductDto, UpdateProductDto, AdjustStockDto } from '../models/product.model';
import { PaginatedResponse, PaginationParams, ApiResponse, ApiListResponse } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private api = inject(ApiService);

  list(params?: PaginationParams): Observable<PaginatedResponse<Product>> {
    return this.api.get<ApiListResponse<Product>>('/products', params as Record<string, string | number | boolean | undefined>).pipe(
      map(res => ({
        data: res.data,
        total: res.pagination.total,
        page: res.pagination.current_page,
        limit: res.pagination.per_page,
        totalPages: res.pagination.total_pages,
      }))
    );
  }

  getById(id: string): Observable<Product> {
    return this.api.get<ApiResponse<Product>>(`/products/${id}`).pipe(
      map(res => res.data)
    );
  }

  create(data: CreateProductDto): Observable<Product> {
    return this.api.post<ApiResponse<Product>>('/products', data).pipe(
      map(res => res.data)
    );
  }

  update(id: string, data: UpdateProductDto): Observable<Product> {
    return this.api.put<ApiResponse<Product>>(`/products/${id}`, data).pipe(
      map(res => res.data)
    );
  }

  adjustStock(id: string, data: AdjustStockDto): Observable<Product> {
    return this.api.patch<ApiResponse<Product>>(`/products/${id}/stock`, data).pipe(
      map(res => res.data)
    );
  }

  activate(id: string): Observable<Product> {
    return this.api.patch<ApiResponse<Product>>(`/products/${id}/activate`).pipe(
      map(res => res.data)
    );
  }

  deactivate(id: string): Observable<Product> {
    return this.api.patch<ApiResponse<Product>>(`/products/${id}/deactivate`).pipe(
      map(res => res.data)
    );
  }

  remove(id: string): Observable<void> {
    return this.api.delete<void>(`/products/${id}`);
  }
}
