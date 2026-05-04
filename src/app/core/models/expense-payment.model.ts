import { PaymentMethod, PAYMENT_METHOD_LABELS } from './invoice-payment.model';

export type { PaymentMethod };
export { PAYMENT_METHOD_LABELS };

export type ExpensePaymentStatus = 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'ANULADO';

export interface ExpensePayment {
  id: number;
  expense_id: number;
  company_id: number;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  transfer_reference?: string | null;
  card_contrapartida?: string | null;
  cheque_number?: string | null;
  due_date?: string | null;
  status: ExpensePaymentStatus;
  notes?: string | null;
  created_by: number;
  creator?: { id: number; full_name: string };
  created_at: string;
  updated_at: string;
}

export interface CreateExpensePaymentDto {
  expense_id: number;
  amount: number;
  payment_method: PaymentMethod;
  payment_date?: string;
  transfer_reference?: string;
  card_contrapartida?: string;
  cheque_number?: string;
  due_date?: string;
  status?: 'PENDIENTE' | 'PAGADO';
  notes?: string;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  'EFECTIVO', 'TRANSFERENCIA', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'CHEQUE', 'OTRO',
];
