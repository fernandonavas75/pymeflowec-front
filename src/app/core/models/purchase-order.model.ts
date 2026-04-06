export type PurchaseOrderStatus = 'pending' | 'partial' | 'received' | 'cancelled';

export interface PurchaseOrderItem {
  id: number;
  product_id: number;
  product?: { id: number; name: string } | null;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: number;
  organization_id: number;
  supplier_id: number;
  supplier?: { id: number; name: string } | null;
  order_number: string;
  status: PurchaseOrderStatus;
  order_date: string;
  expected_date?: string | null;
  notes?: string | null;
  total: number;
  items: PurchaseOrderItem[];
  created_by?: number | null;
  user?: { id: number; full_name: string } | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePurchaseOrderDto {
  supplier_id: number;
  items: {
    product_id: number;
    quantity_ordered: number;
    unit_cost: number;
  }[];
  order_date?: string;
  expected_date?: string;
  notes?: string;
}

export interface ReceivePurchaseOrderDto {
  items: {
    product_id: number;
    quantity_received: number;
  }[];
}
