export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  role: {
    id?: string;
    name: string;
  };
  organization: {
    id: string;
    name: string;
    tax_rate: number;
  };
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}
