import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Client, CreateClientDto, UpdateClientDto } from '../models/client.model';
import { PaginatedResponse, PaginationParams } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class ClientsService {
  private api = inject(ApiService);

  list(params?: PaginationParams): Observable<PaginatedResponse<Client>> {
    return this.api.get<PaginatedResponse<Client>>('/clients', params as Record<string, string | number | boolean | undefined>);
  }

  getById(id: string): Observable<Client> {
    return this.api.get<Client>(`/clients/${id}`);
  }

  create(data: CreateClientDto): Observable<Client> {
    return this.api.post<Client>('/clients', data);
  }

  update(id: string, data: UpdateClientDto): Observable<Client> {
    return this.api.put<Client>(`/clients/${id}`, data);
  }

  activate(id: string): Observable<Client> {
    return this.api.patch<Client>(`/clients/${id}/activate`);
  }

  deactivate(id: string): Observable<Client> {
    return this.api.patch<Client>(`/clients/${id}/deactivate`);
  }

  remove(id: string): Observable<void> {
    return this.api.delete<void>(`/clients/${id}`);
  }
}
