import { inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse, FinanceListResponse, PaginatedResponse, PaginationParams } from '../models/pagination.model';

/**
 * Base compartida para los servicios de pagos (cobros de factura y pagos de egreso).
 * Ambos endpoints exponen exactamente la misma API: listado paginado filtrable,
 * creación y anulación. Solo cambia el `basePath` y los tipos.
 */
export abstract class PaymentsBaseService<TPayment, TCreateDto> {
  protected api = inject(ApiService);
  protected abstract readonly basePath: string;

  protected listWith(
    extra: Record<string, string | number | boolean | undefined>,
    params?: PaginationParams,
  ): Observable<PaginatedResponse<TPayment>> {
    return this.api.get<FinanceListResponse<TPayment>>(this.basePath, {
      ...extra,
      ...(params as Record<string, string | number | boolean | undefined>),
    }).pipe(
      map(res => ({
        data: res.data ?? [],
        total: res.pagination?.total ?? 0,
        page: res.pagination?.current_page ?? 1,
        limit: res.pagination?.per_page ?? 20,
        totalPages: res.pagination?.total_pages ?? 0,
      }))
    );
  }

  create(data: TCreateDto): Observable<TPayment> {
    return this.api.post<ApiResponse<TPayment>>(this.basePath, data).pipe(
      map(res => res.data)
    );
  }

  annul(id: number): Observable<TPayment> {
    return this.api.patch<ApiResponse<TPayment>>(`${this.basePath}/${id}/annul`).pipe(
      map(res => res.data)
    );
  }
}
