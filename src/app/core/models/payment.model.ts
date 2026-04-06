export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'credit' | 'other';

export interface Payment {
  id: number;
  organization_id: number;
  invoice_id: number;
  invoice?: { id: number; invoice_number: string } | null;
  cash_register_id?: number | null;
  payment_method: PaymentMethod;
  amount: number;
  payment_date: string;
  reference_number?: string | null;
  notes?: string | null;
  created_by?: number | null;
  user?: { id: number; full_name: string } | null;
  created_at: string;
}

export interface CreatePaymentDto {
  invoice_id: number;
  payment_method: PaymentMethod;
  amount: number;
  payment_date?: string;
  reference_number?: string;
  cash_register_id?: number;
  notes?: string;
}
