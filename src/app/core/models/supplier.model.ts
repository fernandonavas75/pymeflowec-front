export interface Supplier {
  id: string;
  organization_id: string;
  business_name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierDto {
  business_name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface UpdateSupplierDto extends Partial<CreateSupplierDto> {}
