import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { InvoiceSettings, UpdateInvoiceSettingsDto } from '../models/invoice-settings.model';
import { ApiResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class InvoiceSettingsService {
  private http = inject(HttpClient);
  private url  = `${environment.apiUrl}/companies/my-invoice-settings`;

  get(): Observable<InvoiceSettings> {
    return this.http.get<ApiResponse<InvoiceSettings>>(this.url).pipe(map(r => r.data));
  }

  update(dto: UpdateInvoiceSettingsDto): Observable<InvoiceSettings> {
    return this.http.patch<ApiResponse<InvoiceSettings>>(this.url, dto).pipe(map(r => r.data));
  }
}
