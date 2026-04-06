import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Expense, ExpenseCategory, CreateExpenseDto, CreateExpenseCategoryDto } from '../models/expense.model';
import { ApiListResponse, ApiResponse, PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class ExpensesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/expenses`;

  list(params: Record<string, string | number | boolean | undefined> = {}): Observable<PaginatedResponse<Expense>> {
    return this.http.get<ApiListResponse<Expense>>(this.base, { params: params as Record<string, string> }).pipe(
      map(res => ({
        data: res.data,
        total: res.pagination.total,
        page: res.pagination.current_page,
        limit: res.pagination.per_page,
        totalPages: res.pagination.total_pages,
      }))
    );
  }

  getById(id: number): Observable<Expense> {
    return this.http.get<ApiResponse<Expense>>(`${this.base}/${id}`).pipe(map(r => r.data));
  }

  create(dto: CreateExpenseDto): Observable<Expense> {
    return this.http.post<ApiResponse<Expense>>(this.base, dto).pipe(map(r => r.data));
  }

  cancel(id: number): Observable<Expense> {
    return this.http.patch<ApiResponse<Expense>>(`${this.base}/${id}/cancel`, {}).pipe(map(r => r.data));
  }

  listCategories(): Observable<ExpenseCategory[]> {
    return this.http.get<ApiListResponse<ExpenseCategory>>(`${this.base}/categories`).pipe(map(r => r.data));
  }

  createCategory(dto: CreateExpenseCategoryDto): Observable<ExpenseCategory> {
    return this.http.post<ApiResponse<ExpenseCategory>>(`${this.base}/categories`, dto).pipe(map(r => r.data));
  }
}
