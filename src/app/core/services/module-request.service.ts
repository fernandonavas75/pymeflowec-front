import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { PlatformModule } from '../models/module-request.model';

export interface SimpleModuleRequest {
  id: number;
  module_id: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comments: string | null;
  module: PlatformModule;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class ModuleRequestService {
  private api = inject(ApiService);

  getPublicModules(): Observable<PlatformModule[]> {
    return this.api.get<{ success: boolean; data: PlatformModule[] }>('/platform/modules/public').pipe(
      map(res => res.data)
    );
  }

  getMyRequests(): Observable<SimpleModuleRequest[]> {
    return this.api.get<{ success: boolean; data: SimpleModuleRequest[] }>('/module-requests').pipe(
      map(res => res.data)
    );
  }

  requestModule(moduleId: number, comments?: string): Observable<SimpleModuleRequest> {
    return this.api.post<{ success: boolean; data: SimpleModuleRequest }>('/module-requests', { module_id: moduleId, comments }).pipe(
      map(res => res.data)
    );
  }
}
