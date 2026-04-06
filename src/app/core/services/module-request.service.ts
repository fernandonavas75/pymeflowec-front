import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { PlatformModule } from '../models/auth.model';

export interface ModuleRequest {
  id: number;
  module_id: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  notes: string | null;
  module: PlatformModule;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class ModuleRequestService {
  private api = inject(ApiService);

  getPublicModules(): Observable<PlatformModule[]> {
    return this.api.get<{ data: PlatformModule[] }>('/platform/modules/public').pipe(
      map(res => res.data)
    );
  }

  getMyRequests(): Observable<ModuleRequest[]> {
    return this.api.get<{ data: ModuleRequest[] }>('/module-requests').pipe(
      map(res => res.data)
    );
  }

  requestModule(moduleId: number, notes?: string): Observable<ModuleRequest> {
    return this.api.post<{ data: ModuleRequest }>('/module-requests', { module_id: moduleId, notes }).pipe(
      map(res => res.data)
    );
  }

  cancelRequest(id: number): Observable<void> {
    return this.api.patch<void>(`/module-requests/${id}/cancel`);
  }
}
