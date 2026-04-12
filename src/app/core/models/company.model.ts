export type CompanyStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';

export interface Company {
  id: number;
  name: string;
  business_name?: string | null;
  ruc?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status: CompanyStatus;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface CreateCompanyDto {
  name: string;
  business_name?: string;
  ruc?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface UpdateCompanyDto {
  name?: string;
  business_name?: string;
  email?: string;
  phone?: string;
  address?: string;
}
