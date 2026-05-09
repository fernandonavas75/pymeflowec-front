import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { ExpenseBudget, CreateExpenseBudgetDto, UpdateExpenseBudgetDto } from '../models/expense-budget.model';
import { ApiResponse, FinanceListResponse, PaginatedResponse } from '../models/pagination.model';

export interface BudgetListParams {
  year?: number;
  month?: number;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class ExpenseBudgetsService {
  private api = inject(ApiService);

  list(params?: BudgetListParams): Observable<PaginatedResponse<ExpenseBudget>> {
    return this.api.get<FinanceListResponse<ExpenseBudget>>('/expense-budgets', {
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

  get(id: number): Observable<ExpenseBudget> {
    return this.api.get<ApiResponse<ExpenseBudget>>(`/expense-budgets/${id}`).pipe(
      map(res => res.data)
    );
  }

  create(data: CreateExpenseBudgetDto): Observable<ExpenseBudget> {
    return this.api.post<ApiResponse<ExpenseBudget>>('/expense-budgets', data).pipe(
      map(res => res.data)
    );
  }

  update(id: number, data: UpdateExpenseBudgetDto): Observable<ExpenseBudget> {
    return this.api.put<ApiResponse<ExpenseBudget>>(`/expense-budgets/${id}`, data).pipe(
      map(res => res.data)
    );
  }

  remove(id: number): Observable<void> {
    return this.api.delete<void>(`/expense-budgets/${id}`);
  }
}
