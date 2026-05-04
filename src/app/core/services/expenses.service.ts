import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Expense, CreateExpenseDto, UpdateExpenseDto } from '../models/expense.model';
import { ApiResponse, FinanceListResponse } from '../models/pagination.model';

export interface ExpenseListParams {
  payment_status?: string;
  category_id?: number;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class ExpensesService {
  private api = inject(ApiService);

  list(params?: ExpenseListParams): Observable<{ data: Expense[]; total: number }> {
    return this.api
      .get<FinanceListResponse<Expense>>(
        '/expenses',
        params as Record<string, string | number | boolean | undefined>,
      )
      .pipe(map(res => ({ data: res.data ?? [], total: res.total ?? 0 })));
  }

  get(id: number): Observable<Expense> {
    return this.api
      .get<ApiResponse<Expense>>(`/expenses/${id}`)
      .pipe(map(res => res.data));
  }

  create(data: CreateExpenseDto): Observable<Expense> {
    return this.api
      .post<ApiResponse<Expense>>('/expenses', data)
      .pipe(map(res => res.data));
  }

  update(id: number, data: UpdateExpenseDto): Observable<Expense> {
    return this.api
      .put<ApiResponse<Expense>>(`/expenses/${id}`, data)
      .pipe(map(res => res.data));
  }

  annul(id: number): Observable<Expense> {
    return this.api
      .patch<ApiResponse<Expense>>(`/expenses/${id}/annul`)
      .pipe(map(res => res.data));
  }
}
