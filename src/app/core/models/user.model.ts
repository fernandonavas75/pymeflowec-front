export interface User {
  id: string;
  organization_id: string;
  role_id: string;
  full_name: string;
  email: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  role?: {
    id?: string;
    name: string;
  };
  organization?: {
    id?: string;
    name: string;
  };
}

export interface CreateUserDto {
  full_name: string;
  email: string;
  password: string;
  role_id: string;
}

export interface UpdateUserDto {
  full_name?: string;
  email?: string;
  role_id?: string;
}

export interface ChangePasswordDto {
  current_password: string;
  new_password: string;
}
