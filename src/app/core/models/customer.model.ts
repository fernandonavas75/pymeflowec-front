export type CustomerType = 'CEDULA' | 'RUC' | 'FINAL_CONSUMER';

export interface Customer {
  id: number;
  company_id: number;
  customer_type: CustomerType;
  document_number: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface CreateCustomerDto {
  customer_type: CustomerType;
  document_number: string;
  full_name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}
