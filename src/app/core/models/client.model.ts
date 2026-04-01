export interface Client {
  id: string;
  organization_id: string;
  full_name: string;
  identification: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CreateClientDto {
  full_name: string;
  identification: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface UpdateClientDto extends Partial<CreateClientDto> {}
