import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Client, CreateClientDto, UpdateClientDto } from '../models/client.model';
import { PaginatedResponse, PaginationParams, ApiResponse, ApiListResponse } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class ClientsService {
  private api = inject(ApiService);

  list(params?: PaginationParams): Observable<PaginatedResponse<Client>> {
    return this.api.get<ApiListResponse<Client>>('/clients', params as Record<string, string | number | boolean | undefined>).pipe(
      map(res => ({
        data: res.data,
        total: res.pagination.total,
        page: res.pagination.current_page,
        limit: res.pagination.per_page,
        totalPages: res.pagination.total_pages,
      }))
    );
  }

  getById(id: string): Observable<Client> {
    return this.api.get<ApiResponse<Client>>(`/clients/${id}`).pipe(
      map(res => res.data)
    );
  }

  create(data: CreateClientDto): Observable<Client> {
    return this.api.post<ApiResponse<Client>>('/clients', data).pipe(
      map(res => res.data)
    );
  }

  update(id: string, data: UpdateClientDto): Observable<Client> {
    return this.api.put<ApiResponse<Client>>(`/clients/${id}`, data).pipe(
      map(res => res.data)
    );
  }

  activate(id: string): Observable<Client> {
    return this.api.patch<ApiResponse<Client>>(`/clients/${id}/activate`).pipe(
      map(res => res.data)
    );
  }

  deactivate(id: string): Observable<Client> {
    return this.api.patch<ApiResponse<Client>>(`/clients/${id}/deactivate`).pipe(
      map(res => res.data)
    );
  }

  remove(id: string): Observable<void> {
    return this.api.delete<void>(`/clients/${id}`);
  }
}
