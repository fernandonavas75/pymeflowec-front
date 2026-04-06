import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiListResponse, ApiResponse } from '../models/pagination.model';

export interface PlatformRole {
  id: number;
  code: string;
  name: string;
  description?: string;
  can_write: boolean;
  can_read: boolean;
}

export interface PlatformStaffMember {
  id: number;
  user_id: number;
  user?: { id: number; full_name: string; email: string } | null;
  platform_role_id: number;
  platform_role?: PlatformRole | null;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AssignStaffDto {
  user_id: number;
  platform_role_id: number;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class PlatformStaffService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/platform/staff`;

  listRoles(): Observable<PlatformRole[]> {
    return this.http.get<ApiListResponse<PlatformRole>>(`${this.base}/roles`).pipe(map(r => r.data));
  }

  list(): Observable<PlatformStaffMember[]> {
    return this.http.get<ApiListResponse<PlatformStaffMember>>(this.base).pipe(map(r => r.data));
  }

  assign(dto: AssignStaffDto): Observable<PlatformStaffMember> {
    return this.http.post<ApiResponse<PlatformStaffMember>>(this.base, dto).pipe(map(r => r.data));
  }

  revoke(id: number): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/revoke`, {});
  }
}
