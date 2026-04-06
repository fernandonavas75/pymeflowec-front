import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Payment, CreatePaymentDto } from '../models/payment.model';
import { ApiListResponse, ApiResponse, PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/payments`;

  list(params: Record<string, string | number | boolean | undefined> = {}): Observable<PaginatedResponse<Payment>> {
    return this.http.get<ApiListResponse<Payment>>(this.base, { params: params as Record<string, string> }).pipe(
      map(res => ({
        data: res.data,
        total: res.pagination.total,
        page: res.pagination.current_page,
        limit: res.pagination.per_page,
        totalPages: res.pagination.total_pages,
      }))
    );
  }

  getById(id: number): Observable<Payment> {
    return this.http.get<ApiResponse<Payment>>(`${this.base}/${id}`).pipe(map(r => r.data));
  }

  create(dto: CreatePaymentDto): Observable<Payment> {
    return this.http.post<ApiResponse<Payment>>(this.base, dto).pipe(map(r => r.data));
  }
}
