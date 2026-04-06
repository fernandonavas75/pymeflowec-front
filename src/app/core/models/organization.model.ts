export type OrgStatus = 'active' | 'inactive' | 'suspended';

export interface Organization {
  id: number;
  name: string;
  ruc: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  tax_rate: number;
  status: OrgStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateOrganizationDto {
  name: string;
  ruc: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface UpdateOrganizationDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_rate?: number;
}
