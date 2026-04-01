import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AuthUser, LoginRequest, LoginResponse } from '../models/auth.model';

const TOKEN_KEY = 'pf_token';
const REFRESH_KEY = 'pf_refresh';
const USER_KEY = 'pf_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  currentUser = signal<AuthUser | null>(null);
  isAuthenticated = computed(() => !!this.currentUser());
  role = computed(() => this.currentUser()?.role?.name);

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      if (userStr) {
        const user = JSON.parse(userStr) as AuthUser;
        this.currentUser.set(user);
      }
    } catch {
      this.clearStorage();
    }
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    const body: LoginRequest = { email, password };
    return this.api.post<LoginResponse>('/auth/login', body).pipe(
      tap(res => {
        localStorage.setItem(TOKEN_KEY, res.access_token);
        localStorage.setItem(REFRESH_KEY, res.refresh_token);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        this.currentUser.set(res.user);
      })
    );
  }

  logout(): void {
    this.clearStorage();
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  me(): Observable<AuthUser> {
    return this.api.get<{ data: AuthUser }>('/auth/me').pipe(
      map(res => res.data),
      tap(user => {
        this.currentUser.set(user);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      })
    );
  }

  forgotPassword(email: string): Observable<unknown> {
    return this.api.post('/auth/forgot-password', { email });
  }

  resetPassword(token: string, password: string): Observable<unknown> {
    return this.api.post('/auth/reset-password', { token, password });
  }

  refreshToken(): Observable<LoginResponse> {
    const refresh_token = this.getRefreshToken();
    return this.api.post<LoginResponse>('/auth/refresh', { refresh_token }).pipe(
      tap(res => {
        localStorage.setItem(TOKEN_KEY, res.access_token);
        if (res.refresh_token) {
          localStorage.setItem(REFRESH_KEY, res.refresh_token);
        }
      })
    );
  }

  hasRole(...roles: string[]): boolean {
    const userRole = this.role();
    if (!userRole) return false;
    return roles.includes(userRole);
  }

  private clearStorage(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  }
}
