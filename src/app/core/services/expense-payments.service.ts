import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { ExpensePayment, CreateExpensePaymentDto } from '../models/expense-payment.model';
import { ApiResponse, FinanceListResponse, PaginatedResponse, PaginationParams } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class ExpensePaymentsService {
  private api = inject(ApiService);

  listByExpense(expenseId: number, params?: PaginationParams): Observable<PaginatedResponse<ExpensePayment>> {
    return this.api.get<FinanceListResponse<ExpensePayment>>('/expense-payments', {
      expense_id: expenseId,
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

  create(data: CreateExpensePaymentDto): Observable<ExpensePayment> {
    return this.api.post<ApiResponse<ExpensePayment>>('/expense-payments', data).pipe(
      map(res => res.data)
    );
  }

  annul(id: number): Observable<ExpensePayment> {
    return this.api.patch<ApiResponse<ExpensePayment>>(`/expense-payments/${id}/annul`).pipe(
      map(res => res.data)
    );
  }
}
