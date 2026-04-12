export interface User {
  id: number;
  company_id: number | null;
  role_id: number;
  full_name: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  role?: {
    id: number;
    name: string;
    scope: 'PLATFORM' | 'STORE';
  };
  company?: {
    id: number;
    name: string;
  } | null;
}

export interface CreateUserDto {
  full_name: string;
  email: string;
  password: string;
  role_id: number;
}

export interface UpdateUserDto {
  full_name?: string;
  email?: string;
  role_id?: number;
}

export interface ChangePasswordDto {
  new_password: string;
}
