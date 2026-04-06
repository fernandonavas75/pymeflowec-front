export interface Supplier {
  id: string;
  organization_id: string;
  business_name: string;
  ruc?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_terms?: string;
  notes?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierDto {
  business_name: string;
  ruc?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_terms?: string;
  notes?: string;
}

export interface UpdateSupplierDto extends Partial<CreateSupplierDto> {}
