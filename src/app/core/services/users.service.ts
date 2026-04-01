import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User, CreateUserDto, UpdateUserDto, ChangePasswordDto } from '../models/user.model';
import { PaginatedResponse, PaginationParams } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private api = inject(ApiService);

  list(params?: PaginationParams): Observable<PaginatedResponse<User>> {
    return this.api.get<PaginatedResponse<User>>('/users', params as Record<string, string | number | boolean | undefined>);
  }

  getById(id: string): Observable<User> {
    return this.api.get<User>(`/users/${id}`);
  }

  create(data: CreateUserDto): Observable<User> {
    return this.api.post<User>('/users', data);
  }

  update(id: string, data: UpdateUserDto): Observable<User> {
    return this.api.put<User>(`/users/${id}`, data);
  }

  activate(id: string): Observable<User> {
    return this.api.patch<User>(`/users/${id}/activate`);
  }

  deactivate(id: string): Observable<User> {
    return this.api.patch<User>(`/users/${id}/deactivate`);
  }

  changePassword(id: string, data: ChangePasswordDto): Observable<User> {
    return this.api.patch<User>(`/users/${id}/change-password`, data);
  }
}
