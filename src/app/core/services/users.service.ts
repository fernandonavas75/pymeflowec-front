import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { User, CreateUserDto, UpdateUserDto, ChangePasswordDto } from '../models/user.model';
import { PaginatedResponse, PaginationParams, ApiResponse, ApiListResponse } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private api = inject(ApiService);

  list(params?: PaginationParams): Observable<PaginatedResponse<User>> {
    return this.api.get<ApiListResponse<User>>('/users', params as Record<string, string | number | boolean | undefined>).pipe(
      map(res => ({
        data: res.data,
        total: res.pagination.total,
        page: res.pagination.current_page,
        limit: res.pagination.per_page,
        totalPages: res.pagination.total_pages,
      }))
    );
  }

  getById(id: number | string): Observable<User> {
    return this.api.get<ApiResponse<User>>(`/users/${id}`).pipe(
      map(res => res.data)
    );
  }

  create(data: CreateUserDto): Observable<User> {
    return this.api.post<ApiResponse<User>>('/users', data).pipe(
      map(res => res.data)
    );
  }

  update(id: number | string, data: UpdateUserDto): Observable<User> {
    return this.api.put<ApiResponse<User>>(`/users/${id}`, data).pipe(
      map(res => res.data)
    );
  }

  activate(id: number | string): Observable<User> {
    return this.api.patch<ApiResponse<User>>(`/users/${id}/activate`).pipe(
      map(res => res.data)
    );
  }

  deactivate(id: number | string): Observable<User> {
    return this.api.patch<ApiResponse<User>>(`/users/${id}/deactivate`).pipe(
      map(res => res.data)
    );
  }

  lock(id: number | string): Observable<User> {
    return this.api.patch<ApiResponse<User>>(`/users/${id}/lock`).pipe(
      map(res => res.data)
    );
  }

  changePassword(id: number | string, data: ChangePasswordDto): Observable<void> {
    return this.api.patch<void>(`/users/${id}/change-password`, data);
  }

  remove(id: number | string): Observable<void> {
    return this.api.delete<void>(`/users/${id}`);
  }
}
