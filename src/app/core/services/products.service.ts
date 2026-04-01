import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Product, CreateProductDto, UpdateProductDto } from '../models/product.model';
import { PaginatedResponse, PaginationParams } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private api = inject(ApiService);

  list(params?: PaginationParams): Observable<PaginatedResponse<Product>> {
    return this.api.get<PaginatedResponse<Product>>('/products', params as Record<string, string | number | boolean | undefined>);
  }

  getById(id: string): Observable<Product> {
    return this.api.get<Product>(`/products/${id}`);
  }

  create(data: CreateProductDto): Observable<Product> {
    return this.api.post<Product>('/products', data);
  }

  update(id: string, data: UpdateProductDto): Observable<Product> {
    return this.api.put<Product>(`/products/${id}`, data);
  }

  updateStock(id: string, stock: number): Observable<Product> {
    return this.api.patch<Product>(`/products/${id}/stock`, { stock });
  }

  activate(id: string): Observable<Product> {
    return this.api.patch<Product>(`/products/${id}/activate`);
  }

  deactivate(id: string): Observable<Product> {
    return this.api.patch<Product>(`/products/${id}/deactivate`);
  }

  remove(id: string): Observable<void> {
    return this.api.delete<void>(`/products/${id}`);
  }
}
