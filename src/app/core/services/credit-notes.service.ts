import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreditNote, CreateCreditNoteDto, CreditNoteStatus } from '../models/credit-note.model';
import { ApiListResponse, ApiResponse, PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class CreditNotesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/credit-notes`;

  list(params: Record<string, string | number | boolean | undefined> = {}): Observable<PaginatedResponse<CreditNote>> {
    return this.http.get<ApiListResponse<CreditNote>>(this.base, { params: params as Record<string, string> }).pipe(
      map(res => ({
        data: res.data,
        total: res.pagination.total,
        page: res.pagination.current_page,
        limit: res.pagination.per_page,
        totalPages: res.pagination.total_pages,
      }))
    );
  }

  getById(id: number): Observable<CreditNote> {
    return this.http.get<ApiResponse<CreditNote>>(`${this.base}/${id}`).pipe(map(r => r.data));
  }

  create(dto: CreateCreditNoteDto): Observable<CreditNote> {
    return this.http.post<ApiResponse<CreditNote>>(this.base, dto).pipe(map(r => r.data));
  }

  updateStatus(id: number, status: CreditNoteStatus): Observable<CreditNote> {
    return this.http.patch<ApiResponse<CreditNote>>(`${this.base}/${id}/status`, { status }).pipe(map(r => r.data));
  }
}
