export interface Permission {
  id: number;
  code: string;
  module: string;
  description: string;
}

export interface Role {
  id: number;
  organization_id?: number | null;
  name: string;
  description?: string | null;
  permissions?: Permission[];
  users_count?: number;
  created_at?: string;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  permission_ids?: number[];
}

export interface UpdateRoleDto extends Partial<CreateRoleDto> {}
