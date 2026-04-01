import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Supplier, CreateSupplierDto, UpdateSupplierDto } from '../models/supplier.model';
import { PaginatedResponse, PaginationParams } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class SuppliersService {
  private api = inject(ApiService);

  list(params?: PaginationParams): Observable<PaginatedResponse<Supplier>> {
    return this.api.get<PaginatedResponse<Supplier>>('/suppliers', params as Record<string, string | number | boolean | undefined>);
  }

  getById(id: string): Observable<Supplier> {
    return this.api.get<Supplier>(`/suppliers/${id}`);
  }

  create(data: CreateSupplierDto): Observable<Supplier> {
    return this.api.post<Supplier>('/suppliers', data);
  }

  update(id: string, data: UpdateSupplierDto): Observable<Supplier> {
    return this.api.put<Supplier>(`/suppliers/${id}`, data);
  }

  activate(id: string): Observable<Supplier> {
    return this.api.patch<Supplier>(`/suppliers/${id}/activate`);
  }

  deactivate(id: string): Observable<Supplier> {
    return this.api.patch<Supplier>(`/suppliers/${id}/deactivate`);
  }

  remove(id: string): Observable<void> {
    return this.api.delete<void>(`/suppliers/${id}`);
  }
}
