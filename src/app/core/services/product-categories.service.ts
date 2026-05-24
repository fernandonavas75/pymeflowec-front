import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { ProductCategory, CreateProductCategoryDto, UpdateProductCategoryDto } from '../models/product-category.model';
import { ApiResponse } from '../models/pagination.model';

interface CategoriesListResponse {
  success: boolean;
  data: ProductCategory[];
}

@Injectable({ providedIn: 'root' })
export class ProductCategoriesService {
  private api = inject(ApiService);

  list(): Observable<ProductCategory[]> {
    return this.api.get<CategoriesListResponse>('/product-categories').pipe(
      map(res => res.data ?? [])
    );
  }

  getById(id: number | string): Observable<ProductCategory> {
    return this.api.get<ApiResponse<ProductCategory>>(`/product-categories/${id}`).pipe(
      map(res => res.data)
    );
  }

  create(dto: CreateProductCategoryDto): Observable<ProductCategory> {
    return this.api.post<ApiResponse<ProductCategory>>('/product-categories', dto).pipe(
      map(res => res.data)
    );
  }

  update(id: number | string, dto: UpdateProductCategoryDto): Observable<ProductCategory> {
    return this.api.put<ApiResponse<ProductCategory>>(`/product-categories/${id}`, dto).pipe(
      map(res => res.data)
    );
  }

  remove(id: number | string): Observable<void> {
    return this.api.delete<void>(`/product-categories/${id}`);
  }
}
