export type PaymentMethod =
  | 'EFECTIVO'
  | 'TRANSFERENCIA'
  | 'TARJETA_DEBITO'
  | 'TARJETA_CREDITO'
  | 'CHEQUE'
  | 'OTRO';

export type InvoicePaymentStatus = 'PENDIENTE' | 'COBRADO' | 'VENCIDO' | 'ANULADO';

export type InvoicePayStatusAgg = 'PENDIENTE' | 'PARCIAL' | 'COBRADO';

export interface InvoicePayment {
  id: number;
  invoice_id: number;
  company_id: number;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  transfer_reference?: string | null;
  card_contrapartida?: string | null;
  cheque_number?: string | null;
  installment_number?: number | null;
  installment_total?: number | null;
  due_date?: string | null;
  status: InvoicePaymentStatus;
  notes?: string | null;
  created_by: number;
  creator?: { id: number; full_name: string };
  created_at: string;
  updated_at: string;
}

export interface CreateInvoicePaymentDto {
  invoice_id: number;
  amount: number;
  payment_method: PaymentMethod;
  payment_date?: string;
  transfer_reference?: string;
  card_contrapartida?: string;
  cheque_number?: string;
  installment_number?: number;
  installment_total?: number;
  due_date?: string;
  status?: 'PENDIENTE' | 'COBRADO';
  notes?: string;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  EFECTIVO:        'Efectivo',
  TRANSFERENCIA:   'Transferencia',
  TARJETA_DEBITO:  'Tarjeta débito',
  TARJETA_CREDITO: 'Tarjeta crédito',
  CHEQUE:          'Cheque',
  OTRO:            'Otro',
};
