import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import {
  ExpenseRecurring,
  CreateExpenseRecurringDto,
  UpdateExpenseRecurringDto,
} from '../models/expense-recurring.model';
import { ApiResponse, FinanceListResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class ExpenseRecurringService {
  private api = inject(ApiService);

  list(params?: { page?: number; limit?: number }): Observable<{ data: ExpenseRecurring[]; total: number }> {
    return this.api
      .get<FinanceListResponse<ExpenseRecurring>>(
        '/expense-recurring',
        params as Record<string, string | number | boolean | undefined>,
      )
      .pipe(map(res => ({ data: res.data ?? [], total: res.total ?? 0 })));
  }

  get(id: number): Observable<ExpenseRecurring> {
    return this.api
      .get<ApiResponse<ExpenseRecurring>>(`/expense-recurring/${id}`)
      .pipe(map(res => res.data));
  }

  create(data: CreateExpenseRecurringDto): Observable<ExpenseRecurring> {
    return this.api
      .post<ApiResponse<ExpenseRecurring>>('/expense-recurring', data)
      .pipe(map(res => res.data));
  }

  update(id: number, data: UpdateExpenseRecurringDto): Observable<ExpenseRecurring> {
    return this.api
      .put<ApiResponse<ExpenseRecurring>>(`/expense-recurring/${id}`, data)
      .pipe(map(res => res.data));
  }

  remove(id: number): Observable<void> {
    return this.api.delete<void>(`/expense-recurring/${id}`);
  }
}
