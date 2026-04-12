export interface Supplier {
  id: number;
  company_id: number;
  name: string;
  ruc?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface CreateSupplierDto {
  name: string;
  ruc?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface UpdateSupplierDto extends Partial<CreateSupplierDto> {}
