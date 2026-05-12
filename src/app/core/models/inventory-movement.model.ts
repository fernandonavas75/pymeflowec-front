import { StockMovementType, StockReferenceType } from './product.model';

export interface InventoryMovement {
  id: number;
  company_id: number;
  product_id: number;
  product?: {
    id: number;
    name: string;
    sku?: string | null;
    purchase_price: number;
    supplier_id?: number | null;
    supplier?: { id: number; name: string } | null;
  } | null;
  movement_type: StockMovementType;
  reference_type: StockReferenceType;
  quantity: number;
  notes?: string | null;
  created_by?: number | null;
  creator?: { id: number; full_name: string } | null;
  created_at: string;
  updated_at: string;
}
