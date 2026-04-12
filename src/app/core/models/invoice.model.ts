import { Customer } from './customer.model';
import { Product } from './product.model';

export type InvoiceStatus = 'ISSUED' | 'CANCELLED';

export interface InvoiceDetail {
  id: number;
  invoice_id: number;
  company_id: number;
  product_id?: number | null;
  tax_rate_id?: number | null;
  product_name: string;
  description?: string | null;
  quantity: number;
  unit_price: number;
  tax_percentage: number;
  tax_amount: number;
  line_subtotal: number;
  line_total: number;
  created_at: string;
  product?: Product | null;
}

export interface Invoice {
  id: number;
  company_id: number;
  customer_id?: number | null;
  created_by: number;
  invoice_number: string;
  issue_date: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  status: InvoiceStatus;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  customer?: Customer | null;
  details?: InvoiceDetail[];
}

export interface CreateInvoiceItemDto {
  product_id?: number;
  product_name?: string;
  description?: string;
  quantity: number;
  unit_price: number;
  tax_rate_id?: number;
}

export interface CreateInvoiceDto {
  customer_id?: number;
  issue_date?: string;
  items: CreateInvoiceItemDto[];
}
