import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { ApiService } from './api.service';
import { ThemeService } from './theme.service';
import { AuthUser, LoginRequest, LoginResponse, RegisterRequest } from '../models/auth.model';

const TOKEN_KEY = 'pf_token';
const REFRESH_KEY = 'pf_refresh';
const USER_KEY = 'pf_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);
  private theme = inject(ThemeService);

  currentUser = signal<AuthUser | null>(null);
  isAuthenticated = computed(() => !!this.currentUser());
  role = computed(() => this.currentUser()?.role?.name);

  /** Usuario sin empresa = usuario de plataforma (PLATFORM_ADMIN / PLATFORM_STAFF) */
  isSystemUser = computed(() => !this.currentUser()?.company);

  /** Tiene scope PLATFORM */
  isPlatformUser = computed(() => this.currentUser()?.role?.scope === 'PLATFORM');

  /** Es PLATFORM_ADMIN */
  isPlatformAdmin = computed(() => this.currentUser()?.role?.name === 'PLATFORM_ADMIN');

  /** Es STORE_ADMIN */
  isStoreAdmin = computed(() => this.currentUser()?.role?.name === 'STORE_ADMIN');

  /** Tiene scope STORE (STORE_ADMIN o STORE_SELLER) */
  isStoreUser = computed(() => this.currentUser()?.role?.scope === 'STORE');

  /** Es STORE_WAREHOUSE */
  isStoreWarehouse = computed(() => this.currentUser()?.role?.name === 'STORE_WAREHOUSE');

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
    // Backend spreads tokens at top level: { success, user, access_token, refresh_token }
    return this.api.post<LoginResponse & { success: boolean }>('/auth/login', body).pipe(
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
    this.theme.reset();
    this.router.navigate(['/login']);
  }

  me(): Observable<AuthUser> {
    return this.api.get<{ success: boolean; data: AuthUser }>('/auth/me').pipe(
      map(res => res.data),
      tap(user => {
        this.currentUser.set(user);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      })
    );
  }

  register(data: RegisterRequest): Observable<LoginResponse> {
    // Backend spreads tokens at top level: { success, user, access_token, refresh_token }
    return this.api.post<LoginResponse & { success: boolean }>('/auth/register', data).pipe(
      tap(res => {
        localStorage.setItem(TOKEN_KEY, res.access_token);
        localStorage.setItem(REFRESH_KEY, res.refresh_token);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        this.currentUser.set(res.user);
      })
    );
  }

  refreshToken(): Observable<{ access_token: string }> {
    const refresh_token = this.getRefreshToken();
    // Backend spreads at top level: { success, access_token }
    return this.api.post<{ success: boolean; access_token: string }>('/auth/refresh', { refresh_token }).pipe(
      tap(res => {
        localStorage.setItem(TOKEN_KEY, res.access_token);
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
