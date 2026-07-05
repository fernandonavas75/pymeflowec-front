import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaymentsBaseService } from './payments-base.service';
import { ExpensePayment, CreateExpensePaymentDto } from '../models/expense-payment.model';
import { PaginatedResponse, PaginationParams } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class ExpensePaymentsService extends PaymentsBaseService<ExpensePayment, CreateExpensePaymentDto> {
  protected readonly basePath = '/expense-payments';

  list(params?: PaginationParams): Observable<PaginatedResponse<ExpensePayment>> {
    return this.listWith({}, params);
  }

  listByExpense(expenseId: number, params?: PaginationParams): Observable<PaginatedResponse<ExpensePayment>> {
    return this.listWith({ expense_id: expenseId }, params);
  }
}
