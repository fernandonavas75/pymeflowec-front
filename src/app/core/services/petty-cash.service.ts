import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import {
  PettyCash, PettyCashMovement,
  OpenPettyCashDto, ClosePettyCashDto, CreatePettyCashMovementDto,
} from '../models/petty-cash.model';
import { ApiResponse, FinanceListResponse, PaginatedResponse, PaginationParams } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class PettyCashService {
  private api = inject(ApiService);

  list(params?: PaginationParams): Observable<PaginatedResponse<PettyCash>> {
    return this.api.get<FinanceListResponse<PettyCash>>('/petty-cash', params as Record<string, string | number | boolean | undefined>).pipe(
      map(res => ({
        data: res.data ?? [],
        total: res.total ?? 0,
        page: res.page ?? 1,
        limit: res.limit ?? 20,
        totalPages: Math.ceil((res.total ?? 0) / (res.limit ?? 20)),
      }))
    );
  }

  getOpen(): Observable<PettyCash | null> {
    return this.api.get<ApiResponse<PettyCash | null>>('/petty-cash/open').pipe(
      map(res => res.data ?? null)
    );
  }

  open(data: OpenPettyCashDto): Observable<PettyCash> {
    return this.api.post<ApiResponse<PettyCash>>('/petty-cash/open', data).pipe(
      map(res => res.data)
    );
  }

  close(id: number, data?: ClosePettyCashDto): Observable<PettyCash> {
    return this.api.patch<ApiResponse<PettyCash>>(`/petty-cash/${id}/close`, data ?? {}).pipe(
      map(res => res.data)
    );
  }

  listMovements(id: number, params?: PaginationParams): Observable<PaginatedResponse<PettyCashMovement>> {
    return this.api.get<FinanceListResponse<PettyCashMovement>>(
      `/petty-cash/${id}/movements`,
      params as Record<string, string | number | boolean | undefined>
    ).pipe(
      map(res => ({
        data: res.data ?? [],
        total: res.total ?? 0,
        page: res.page ?? 1,
        limit: res.limit ?? 50,
        totalPages: Math.ceil((res.total ?? 0) / (res.limit ?? 50)),
      }))
    );
  }

  addMovement(id: number, data: CreatePettyCashMovementDto): Observable<PettyCashMovement> {
    return this.api.post<ApiResponse<PettyCashMovement>>(`/petty-cash/${id}/movements`, data).pipe(
      map(res => res.data)
    );
  }
}
