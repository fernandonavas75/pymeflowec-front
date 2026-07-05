import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { ModuleRequest, CreateModuleRequestDto, PlatformModule } from '../models/module-request.model';
import { ApiListResponse, ApiResponse, PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class ModuleRequestsService {
  private api = inject(ApiService);
  private readonly base = '/module-requests';

  list(params: Record<string, string | number | boolean | undefined> = {}): Observable<PaginatedResponse<ModuleRequest>> {
    return this.api.get<ApiListResponse<ModuleRequest>>(this.base, params).pipe(
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
    return this.api.get<ApiListResponse<ModuleRequest>>(`${this.base}/all`, params).pipe(
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
    return this.api.post<ApiResponse<ModuleRequest>>(this.base, dto).pipe(map(r => r?.data));
  }

  approve(id: number, expiresAt?: string): Observable<void> {
    const body: Record<string, unknown> = {};
    if (expiresAt) body['expires_at'] = expiresAt;
    return this.api.patch<ApiResponse<ModuleRequest>>(`${this.base}/${id}/approve`, body).pipe(map(() => void 0));
  }

  reject(id: number, comments?: string): Observable<void> {
    return this.api.patch<ApiResponse<ModuleRequest>>(`${this.base}/${id}/reject`, { comments }).pipe(map(() => void 0));
  }

  revoke(id: number): Observable<void> {
    return this.api.patch<ApiResponse<ModuleRequest>>(`${this.base}/${id}/revoke`, {}).pipe(map(() => void 0));
  }

  revokeByModule(companyId: number, moduleId: number): Observable<void> {
    return this.api.patch<ApiResponse<ModuleRequest>>(`${this.base}/revoke-module`, {
      company_id: companyId, module_id: moduleId,
    }).pipe(map(() => void 0));
  }

  listPlatformModules(): Observable<PlatformModule[]> {
    return this.api.get<{ success: boolean; data: PlatformModule[] }>('/platform/modules/public').pipe(map(r => r?.data ?? []));
  }
}
