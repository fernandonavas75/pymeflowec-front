export type ProductUnit = 'unidad' | 'kg' | 'lb' | 'litro' | 'metro' | 'paquete' | 'caja' | 'docena' | 'funda';

export interface Product {
  id: string;
  organization_id: string;
  category_id?: string | null;
  category?: { id: number | string; name: string } | null;
  tax_rate_id?: string | null;
  tax_rate?: { id: number | string; name: string; rate: number } | null;
  name: string;
  description?: string;
  barcode?: string | null;
  sku?: string | null;
  unit: ProductUnit;
  stock: number;
  min_stock: number;
  cost_price: number;
  unit_price: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  unit_price: number;
  cost_price?: number;
  stock?: number;
  min_stock?: number;
  unit?: ProductUnit;
  category_id?: string;
  tax_rate_id?: string;
  barcode?: string;
  sku?: string;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

export interface AdjustStockDto {
  quantity: number;
  movement_type: 'in' | 'out' | 'adjustment';
  reason?: string;
}
