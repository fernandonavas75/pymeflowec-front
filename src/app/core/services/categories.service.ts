import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../models/category.model';
import { ApiListResponse, ApiResponse, PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/categories`;

  list(params: Record<string, string | number | boolean | undefined> = {}): Observable<PaginatedResponse<Category>> {
    return this.http.get<ApiListResponse<Category>>(this.base, { params: params as Record<string, string> }).pipe(
      map(res => ({
        data: res.data,
        total: res.pagination.total,
        page: res.pagination.current_page,
        limit: res.pagination.per_page,
        totalPages: res.pagination.total_pages,
      }))
    );
  }

  getById(id: number): Observable<Category> {
    return this.http.get<ApiResponse<Category>>(`${this.base}/${id}`).pipe(map(r => r.data));
  }

  create(dto: CreateCategoryDto): Observable<Category> {
    return this.http.post<ApiResponse<Category>>(this.base, dto).pipe(map(r => r.data));
  }

  update(id: number, dto: UpdateCategoryDto): Observable<Category> {
    return this.http.put<ApiResponse<Category>>(`${this.base}/${id}`, dto).pipe(map(r => r.data));
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
