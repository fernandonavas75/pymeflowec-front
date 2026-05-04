import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import {
  ExpenseCategory,
  CreateExpenseCategoryDto,
  UpdateExpenseCategoryDto,
} from '../models/expense-category.model';
import { ApiResponse, FinanceListResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class ExpenseCategoriesService {
  private api = inject(ApiService);

  list(params?: { page?: number; limit?: number }): Observable<ExpenseCategory[]> {
    return this.api
      .get<FinanceListResponse<ExpenseCategory>>(
        '/expense-categories',
        params as Record<string, string | number | boolean | undefined>,
      )
      .pipe(map(res => res.data ?? []));
  }

  get(id: number): Observable<ExpenseCategory> {
    return this.api
      .get<ApiResponse<ExpenseCategory>>(`/expense-categories/${id}`)
      .pipe(map(res => res.data));
  }

  create(data: CreateExpenseCategoryDto): Observable<ExpenseCategory> {
    return this.api
      .post<ApiResponse<ExpenseCategory>>('/expense-categories', data)
      .pipe(map(res => res.data));
  }

  update(id: number, data: UpdateExpenseCategoryDto): Observable<ExpenseCategory> {
    return this.api
      .put<ApiResponse<ExpenseCategory>>(`/expense-categories/${id}`, data)
      .pipe(map(res => res.data));
  }

  remove(id: number): Observable<void> {
    return this.api.delete<void>(`/expense-categories/${id}`);
  }
}
