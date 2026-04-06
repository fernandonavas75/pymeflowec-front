export type CreditNoteStatus = 'pending' | 'applied' | 'cancelled';

export interface CreditNoteItem {
  id: number;
  product_id: number;
  product?: { id: number; name: string } | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface CreditNote {
  id: number;
  organization_id: number;
  invoice_id: number;
  invoice?: { id: number; invoice_number: string } | null;
  credit_note_number: string;
  reason: string;
  status: CreditNoteStatus;
  total: number;
  items: CreditNoteItem[];
  created_by?: number | null;
  user?: { id: number; full_name: string } | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCreditNoteDto {
  invoice_id: number;
  reason: string;
  items: {
    product_id: number;
    quantity: number;
    unit_price?: number;
  }[];
}
