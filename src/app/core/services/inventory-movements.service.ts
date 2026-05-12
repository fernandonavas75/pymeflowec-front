import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { InventoryMovement } from '../models/inventory-movement.model';
import { ApiListResponse } from '../models/pagination.model';

export interface InventoryMovementListParams {
  product_id?: number;
  movement_type?: 'IN' | 'OUT' | 'ADJUSTMENT';
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class InventoryMovementsService {
  private api = inject(ApiService);

  list(params?: InventoryMovementListParams): Observable<{ data: InventoryMovement[]; total: number }> {
    return this.api
      .get<ApiListResponse<InventoryMovement>>(
        '/inventory-movements',
        params as Record<string, string | number | boolean | undefined>,
      )
      .pipe(map(res => ({ data: res.data ?? [], total: res.pagination?.total ?? 0 })));
  }
}
