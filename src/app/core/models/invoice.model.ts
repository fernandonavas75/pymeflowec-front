import { Order } from './order.model';
import { Product } from './product.model';

export type InvoiceStatus = 'issued' | 'paid' | 'overdue' | 'cancelled';

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
  created_at: string;
  order?: Order;
  details?: InvoiceDetail[];
}

export interface CreateManualInvoiceDto {
  client_id: string;
  details: {
    product_id: string;
    quantity: number;
    unit_price: number;
  }[];
}
