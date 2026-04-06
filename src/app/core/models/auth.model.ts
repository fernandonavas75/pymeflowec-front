export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  org_name: string;
  org_ruc: string;
  org_email?: string;
  org_phone?: string;
  org_city?: string;
  full_name: string;
  email: string;
  password: string;
}

export interface PlatformModule {
  id: number;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_default: boolean;
  sort_order: number;
}

export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  status: string;
  role: {
    id?: string;
    name: string;
  } | null;
  permissions: string[];
  /** null para usuarios de sistema sin organización */
  organization: {
    id: string;
    name: string;
  } | null;
  platform_staff: {
    id: number;
    can_read: boolean;
    can_write: boolean;
    role: string | null;
  } | null;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}
