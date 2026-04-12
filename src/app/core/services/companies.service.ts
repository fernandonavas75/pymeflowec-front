import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Company, CreateCompanyDto, UpdateCompanyDto } from '../models/company.model';
import { ApiListResponse, ApiResponse, PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class CompaniesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/companies`;

  list(params: Record<string, string | number | boolean | undefined> = {}): Observable<PaginatedResponse<Company>> {
    return this.http.get<ApiListResponse<Company>>(this.base, { params: params as Record<string, string> }).pipe(
      map(res => ({
        data: res.data,
        total: res.pagination.total,
        page: res.pagination.current_page,
        limit: res.pagination.per_page,
        totalPages: res.pagination.total_pages,
      }))
    );
  }

  getById(id: number): Observable<Company> {
    return this.http.get<ApiResponse<Company>>(`${this.base}/${id}`).pipe(map(r => r.data));
  }

  create(dto: CreateCompanyDto): Observable<Company> {
    return this.http.post<ApiResponse<Company>>(this.base, dto).pipe(map(r => r.data));
  }

  update(id: number, dto: UpdateCompanyDto): Observable<Company> {
    return this.http.put<ApiResponse<Company>>(`${this.base}/${id}`, dto).pipe(map(r => r.data));
  }

  activate(id: number): Observable<Company> {
    return this.http.patch<ApiResponse<Company>>(`${this.base}/${id}/activate`, {}).pipe(map(r => r.data));
  }

  deactivate(id: number): Observable<Company> {
    return this.http.patch<ApiResponse<Company>>(`${this.base}/${id}/deactivate`, {}).pipe(map(r => r.data));
  }

  suspend(id: number): Observable<Company> {
    return this.http.patch<ApiResponse<Company>>(`${this.base}/${id}/suspend`, {}).pipe(map(r => r.data));
  }
}
