export interface Product {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  category?: string;
  stock: number;
  unit_price: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  category?: string;
  unit_price: number;
  stock: number;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}
