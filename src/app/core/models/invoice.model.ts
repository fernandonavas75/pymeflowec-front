import { Order } from './order.model';
import { Product } from './product.model';

export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type PaymentStatus = 'pending' | 'partial' | 'paid';

export interface InvoiceDetail {
  id: string;
  invoice_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product?: Product;
}

export interface Invoice {
  id: string;
  organization_id: string;
  order_id: string;
  invoice_number: string;
  issue_date: string;
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  payment_status: PaymentStatus;
  created_at: string;
  order?: Order;
  details?: InvoiceDetail[];
}

export interface CreateManualInvoiceDto {
  issue_date?: string;
  items: {
    product_id: string;
    quantity: number;
    unit_price: number;
  }[];
}
