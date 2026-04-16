import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ModuleRequest, CreateModuleRequestDto, PlatformModule } from '../models/module-request.model';
import { ApiListResponse, ApiResponse, PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class ModuleRequestsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/module-requests`;

  list(params: Record<string, string | number | boolean | undefined> = {}): Observable<PaginatedResponse<ModuleRequest>> {
    return this.http.get<ApiListResponse<ModuleRequest>>(this.base, { params: params as Record<string, string> }).pipe(
      map(res => ({
        data: res.data ?? [],
        total: res.pagination?.total ?? 0,
        page: res.pagination?.current_page ?? 1,
        limit: res.pagination?.per_page ?? 20,
        totalPages: res.pagination?.total_pages ?? 0,
      }))
    );
  }

  listAll(params: Record<string, string | number | boolean | undefined> = {}): Observable<PaginatedResponse<ModuleRequest>> {
    return this.http.get<ApiListResponse<ModuleRequest>>(`${this.base}/all`, { params: params as Record<string, string> }).pipe(
      map(res => ({
        data: res.data ?? [],
        total: res.pagination?.total ?? 0,
        page: res.pagination?.current_page ?? 1,
        limit: res.pagination?.per_page ?? 20,
        totalPages: res.pagination?.total_pages ?? 0,
      }))
    );
  }

  create(dto: CreateModuleRequestDto): Observable<ModuleRequest> {
    return this.http.post<ApiResponse<ModuleRequest>>(this.base, dto).pipe(map(r => r?.data));
  }

  approve(id: number): Observable<void> {
    return this.http.patch<ApiResponse<ModuleRequest>>(`${this.base}/${id}/approve`, {}).pipe(map(() => void 0));
  }

  reject(id: number, comments?: string): Observable<void> {
    return this.http.patch<ApiResponse<ModuleRequest>>(`${this.base}/${id}/reject`, { comments }).pipe(map(() => void 0));
  }

  listPlatformModules(): Observable<PlatformModule[]> {
    return this.http.get<{ success: boolean; data: PlatformModule[] }>(`${environment.apiUrl}/platform/modules/public`).pipe(map(r => r?.data ?? []));
  }
}
