import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Organization, CreateOrganizationDto, UpdateOrganizationDto } from '../models/organization.model';
import { ApiListResponse, ApiResponse, PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class OrganizationsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/organizations`;

  list(params: Record<string, string | number | boolean | undefined> = {}): Observable<PaginatedResponse<Organization>> {
    return this.http.get<ApiListResponse<Organization>>(this.base, { params: params as Record<string, string> }).pipe(
      map(res => ({
        data: res.data,
        total: res.pagination.total,
        page: res.pagination.current_page,
        limit: res.pagination.per_page,
        totalPages: res.pagination.total_pages,
      }))
    );
  }

  getById(id: number): Observable<Organization> {
    return this.http.get<ApiResponse<Organization>>(`${this.base}/${id}`).pipe(map(r => r.data));
  }

  create(dto: CreateOrganizationDto): Observable<Organization> {
    return this.http.post<ApiResponse<Organization>>(this.base, dto).pipe(map(r => r.data));
  }

  update(id: number, dto: UpdateOrganizationDto): Observable<Organization> {
    return this.http.put<ApiResponse<Organization>>(`${this.base}/${id}`, dto).pipe(map(r => r.data));
  }

  activate(id: number): Observable<Organization> {
    return this.http.patch<ApiResponse<Organization>>(`${this.base}/${id}/activate`, {}).pipe(map(r => r.data));
  }

  deactivate(id: number): Observable<Organization> {
    return this.http.patch<ApiResponse<Organization>>(`${this.base}/${id}/deactivate`, {}).pipe(map(r => r.data));
  }
}
