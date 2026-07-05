import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaymentsBaseService } from './payments-base.service';
import { InvoicePayment, CreateInvoicePaymentDto } from '../models/invoice-payment.model';
import { PaginatedResponse, PaginationParams } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class InvoicePaymentsService extends PaymentsBaseService<InvoicePayment, CreateInvoicePaymentDto> {
  protected readonly basePath = '/invoice-payments';

  list(params?: PaginationParams): Observable<PaginatedResponse<InvoicePayment>> {
    return this.listWith({}, params);
  }

  listByInvoice(invoiceId: number, params?: PaginationParams): Observable<PaginatedResponse<InvoicePayment>> {
    return this.listWith({ invoice_id: invoiceId }, params);
  }
}
