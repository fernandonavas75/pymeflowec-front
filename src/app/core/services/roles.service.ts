import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Role, Permission, CreateRoleDto, UpdateRoleDto } from '../models/role.model';
import { ApiListResponse, ApiResponse, PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class RolesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/roles`;

  list(params: Record<string, string | number | boolean | undefined> = {}): Observable<PaginatedResponse<Role>> {
    return this.http.get<ApiListResponse<Role>>(this.base, { params: params as Record<string, string> }).pipe(
      map(res => ({
        data: res.data,
        total: res.pagination.total,
        page: res.pagination.current_page,
        limit: res.pagination.per_page,
        totalPages: res.pagination.total_pages,
      }))
    );
  }

  listAll(): Observable<Role[]> {
    return this.http.get<ApiListResponse<Role>>(`${this.base}?limit=100`).pipe(map(r => r.data));
  }

  getById(id: number): Observable<Role> {
    return this.http.get<ApiResponse<Role>>(`${this.base}/${id}`).pipe(map(r => r.data));
  }

  listPermissions(): Observable<Permission[]> {
    return this.http.get<ApiResponse<Permission[]>>(`${this.base}/permissions`).pipe(map(r => r.data));
  }

  create(dto: CreateRoleDto): Observable<Role> {
    return this.http.post<ApiResponse<Role>>(this.base, dto).pipe(map(r => r.data));
  }

  update(id: number, dto: UpdateRoleDto): Observable<Role> {
    return this.http.put<ApiResponse<Role>>(`${this.base}/${id}`, dto).pipe(map(r => r.data));
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
