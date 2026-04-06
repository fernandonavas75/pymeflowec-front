import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CashRegister, OpenCashRegisterDto, CloseCashRegisterDto, AddMovementDto } from '../models/cash-register.model';
import { ApiListResponse, ApiResponse, PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class CashRegistersService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/cash-registers`;

  list(params: Record<string, string | number | boolean | undefined> = {}): Observable<PaginatedResponse<CashRegister>> {
    return this.http.get<ApiListResponse<CashRegister>>(this.base, { params: params as Record<string, string> }).pipe(
      map(res => ({
        data: res.data,
        total: res.pagination.total,
        page: res.pagination.current_page,
        limit: res.pagination.per_page,
        totalPages: res.pagination.total_pages,
      }))
    );
  }

  getById(id: number): Observable<CashRegister> {
    return this.http.get<ApiResponse<CashRegister>>(`${this.base}/${id}`).pipe(map(r => r.data));
  }

  open(dto: OpenCashRegisterDto): Observable<CashRegister> {
    return this.http.post<ApiResponse<CashRegister>>(this.base, dto).pipe(map(r => r.data));
  }

  close(id: number, dto: CloseCashRegisterDto): Observable<CashRegister> {
    return this.http.patch<ApiResponse<CashRegister>>(`${this.base}/${id}/close`, dto).pipe(map(r => r.data));
  }

  addMovement(id: number, dto: AddMovementDto): Observable<CashRegister> {
    return this.http.post<ApiResponse<CashRegister>>(`${this.base}/${id}/movements`, dto).pipe(map(r => r.data));
  }
}
