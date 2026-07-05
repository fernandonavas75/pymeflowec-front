import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { TaxRate, CreateTaxRateDto, UpdateTaxRateDto } from '../models/tax-rate.model';
import { PaginatedResponse, PaginationParams, ApiResponse, ApiListResponse } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class TaxRatesService {
  private api = inject(ApiService);

  /**
   * Tasa de IVA vigente (%) leída del módulo de tasas (`/api/tax-rates`).
   * Fallback 15 (tarifa Ecuador actual) mientras carga, si la API falla
   * o si la empresa no tiene MOD_TAX activo (403).
   */
  ivaPct    = signal(15);
  ivaFactor = computed(() => 1 + this.ivaPct() / 100);
  ivaLabel  = computed(() => `IVA ${this.ivaPct()}%`);
  private ivaRequested = false;

  /**
   * Carga (una sola vez por sesión) la tasa de IVA vigente. Elige entre las
   * tasas activas y dentro de su rango de vigencia la que se llame "IVA";
   * si hay varias, la de `valid_from` más reciente (orden del backend).
   */
  loadIvaRate(): void {
    if (this.ivaRequested) return;
    this.ivaRequested = true;
    this.list({ limit: 100 }).subscribe({
      next: res => {
        const today = new Date().toISOString().slice(0, 10);
        const vigentes = res.data.filter(t =>
          t.is_active &&
          (!t.valid_from || t.valid_from <= today) &&
          (!t.valid_to || t.valid_to >= today)
        );
        const iva = vigentes.find(t => /iva/i.test(t.tax_name)) ?? vigentes[0];
        if (iva && +iva.percentage > 0) this.ivaPct.set(+iva.percentage);
      },
      error: () => { /* sin MOD_TAX o error de red: se conserva el fallback */ },
    });
  }

  list(params?: PaginationParams): Observable<PaginatedResponse<TaxRate>> {
    return this.api.get<ApiListResponse<TaxRate>>('/tax-rates', params as Record<string, string | number | boolean | undefined>).pipe(
      map(res => ({
        data: res.data ?? [],
        total: res.pagination?.total ?? 0,
        page: res.pagination?.current_page ?? 1,
        limit: res.pagination?.per_page ?? 20,
        totalPages: res.pagination?.total_pages ?? 0,
      }))
    );
  }

  getById(id: number | string): Observable<TaxRate> {
    return this.api.get<ApiResponse<TaxRate>>(`/tax-rates/${id}`).pipe(
      map(res => res.data)
    );
  }

  create(data: CreateTaxRateDto): Observable<TaxRate> {
    return this.api.post<ApiResponse<TaxRate>>('/tax-rates', data).pipe(
      map(res => res.data)
    );
  }

  update(id: number | string, data: UpdateTaxRateDto): Observable<TaxRate> {
    return this.api.put<ApiResponse<TaxRate>>(`/tax-rates/${id}`, data).pipe(
      map(res => res.data)
    );
  }
}
