export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  company_name: string;
  company_ruc: string;
  company_email?: string;
  company_phone?: string;
  full_name: string;
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  company_id: number | null;
  role_id: number;
  full_name: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  role: {
    id: number;
    name: 'PLATFORM_ADMIN' | 'PLATFORM_STAFF' | 'STORE_ADMIN' | 'STORE_SELLER' | string;
    scope: 'PLATFORM' | 'STORE';
    description?: string | null;
  };
  /** null para usuarios de plataforma sin empresa */
  company: {
    id: number;
    name: string;
    business_name?: string | null;
    ruc?: string | null;
    email?: string | null;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
  } | null;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}
