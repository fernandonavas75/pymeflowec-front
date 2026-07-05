import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { InvoiceSettings, UpdateInvoiceSettingsDto } from '../models/invoice-settings.model';
import { ApiResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class InvoiceSettingsService {
  private api = inject(ApiService);
  private readonly path = '/companies/my-invoice-settings';

  get(): Observable<InvoiceSettings> {
    return this.api.get<ApiResponse<InvoiceSettings>>(this.path).pipe(map(r => r.data));
  }

  update(dto: UpdateInvoiceSettingsDto): Observable<InvoiceSettings> {
    return this.api.patch<ApiResponse<InvoiceSettings>>(this.path, dto).pipe(map(r => r.data));
  }
}
