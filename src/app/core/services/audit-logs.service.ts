import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { AuditLog } from '../models/audit-log.model';
import { PaginatedResponse, PaginationParams, ApiListResponse } from '../models/pagination.model';

export interface ServerLog {
  level: string;
  message: string;
  timestamp?: string;
  stack?: string;
}

@Injectable({ providedIn: 'root' })
export class AuditLogsService {
  private api = inject(ApiService);

  list(params?: PaginationParams): Observable<PaginatedResponse<AuditLog>> {
    return this.api
      .get<ApiListResponse<AuditLog>>('/audit-logs', params as Record<string, string | number | boolean | undefined>)
      .pipe(
        map(res => ({
          data: res.data ?? [],
          total: res.pagination?.total ?? 0,
          page: res.pagination?.current_page ?? 1,
          limit: res.pagination?.per_page ?? 50,
          totalPages: res.pagination?.total_pages ?? 0,
        })),
      );
  }

  serverLogs(params?: { level?: string; limit?: number }): Observable<ServerLog[]> {
    return this.api
      .get<{ success: boolean; data: ServerLog[] }>('/platform/server-logs', params as Record<string, string | number | boolean | undefined>)
      .pipe(map(res => res.data ?? []));
  }
}
