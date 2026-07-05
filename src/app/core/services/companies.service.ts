import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Company, CreateCompanyDto, UpdateCompanyDto } from '../models/company.model';
import { ApiListResponse, ApiResponse, PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class CompaniesService {
  private api = inject(ApiService);
  private readonly base = '/companies';

  list(params: Record<string, string | number | boolean | undefined> = {}): Observable<PaginatedResponse<Company>> {
    return this.api.get<ApiListResponse<Company>>(this.base, params).pipe(
      map(res => ({
        data: res.data ?? [],
        total: res.pagination?.total ?? 0,
        page: res.pagination?.current_page ?? 1,
        limit: res.pagination?.per_page ?? 20,
        totalPages: res.pagination?.total_pages ?? 0,
      }))
    );
  }

  getById(id: number): Observable<Company> {
    return this.api.get<ApiResponse<Company>>(`${this.base}/${id}`).pipe(map(r => r.data));
  }

  create(dto: CreateCompanyDto): Observable<Company> {
    return this.api.post<ApiResponse<Company>>(this.base, dto).pipe(map(r => r.data));
  }

  update(id: number, dto: UpdateCompanyDto): Observable<Company> {
    return this.api.put<ApiResponse<Company>>(`${this.base}/${id}`, dto).pipe(map(r => r.data));
  }

  activate(id: number): Observable<Company> {
    return this.api.patch<ApiResponse<Company>>(`${this.base}/${id}/activate`, {}).pipe(map(r => r.data));
  }

  deactivate(id: number): Observable<Company> {
    return this.api.patch<ApiResponse<Company>>(`${this.base}/${id}/deactivate`, {}).pipe(map(r => r.data));
  }

  suspend(id: number): Observable<Company> {
    return this.api.patch<ApiResponse<Company>>(`${this.base}/${id}/suspend`, {}).pipe(map(r => r.data));
  }
}
