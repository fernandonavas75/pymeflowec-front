export type ProductStatus = 'ACTIVE' | 'INACTIVE';
export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT';
export type StockReferenceType = 'PURCHASE' | 'SALE' | 'MANUAL';

export interface Product {
  id: number;
  company_id: number;
  supplier_id?: number | null;
  tax_rate_id?: number | null;
  sku?: string | null;
  name: string;
  description?: string | null;
  purchase_price: number;
  sale_price: number;
  stock: number;
  min_stock: number;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  supplier?: { id: number; name: string } | null;
  tax_rate?: { id: number; tax_name: string; percentage: number } | null;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  purchase_price?: number;
  sale_price: number;
  stock?: number;
  min_stock?: number;
  sku?: string;
  supplier_id?: number;
  tax_rate_id?: number;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

export interface AdjustStockDto {
  quantity: number;
  movement_type: StockMovementType;
  reference_type: StockReferenceType;
  notes?: string;
}
