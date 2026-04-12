import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';

export interface StoreRole {
  id: number;
  name: string;
  scope: 'STORE';
  description?: string | null;
}

@Injectable({ providedIn: 'root' })
export class RolesService {
  private api = inject(ApiService);

  listStoreRoles(): Observable<StoreRole[]> {
    return this.api.get<{ success: boolean; data: StoreRole[] }>('/roles').pipe(
      map(res => res.data)
    );
  }
}
