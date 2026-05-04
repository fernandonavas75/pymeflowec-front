import { CategoryType } from './expense-category.model';

export type ExpensePaymentStatus = 'PENDIENTE' | 'PARCIAL' | 'PAGADO' | 'ANULADO';
export type VoucherType =
  | 'FACTURA' | 'NOTA_VENTA' | 'RECIBO' | 'LIQUIDACION' | 'SIN_COMPROBANTE' | 'OTRO';

export interface Expense {
  id: number;
  company_id: number;
  category_id: number;
  category?: { id: number; name: string; category_type: CategoryType } | null;
  description: string;
  amount: number;
  supplier_id?: number | null;
  supplier?: { id: number; name: string } | null;
  supplier_name_free?: string | null;
  expense_date?: string | null;
  voucher_number?: string | null;
  voucher_type?: VoucherType | null;
  notes?: string | null;
  payment_status: ExpensePaymentStatus;
  amount_paid?: number;
  amount_pending?: number;
  created_by?: number;
  creator?: { id: number; full_name: string } | null;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseDto {
  category_id: number;
  description: string;
  amount: number;
  supplier_id?: number;
  supplier_name_free?: string;
  expense_date?: string;
  voucher_number?: string;
  voucher_type?: VoucherType;
  notes?: string;
}

export type UpdateExpenseDto = Partial<CreateExpenseDto>;

export const EXPENSE_PAYMENT_STATUS_LABELS: Record<ExpensePaymentStatus, string> = {
  PENDIENTE: 'Pendiente',
  PARCIAL:   'Parcial',
  PAGADO:    'Pagado',
  ANULADO:   'Anulado',
};

export const VOUCHER_TYPE_LABELS: Record<VoucherType, string> = {
  FACTURA:         'Factura',
  NOTA_VENTA:      'Nota de venta',
  RECIBO:          'Recibo',
  LIQUIDACION:     'Liquidación',
  SIN_COMPROBANTE: 'Sin comprobante',
  OTRO:            'Otro',
};

export const VOUCHER_TYPES: VoucherType[] = [
  'FACTURA', 'NOTA_VENTA', 'RECIBO', 'LIQUIDACION', 'SIN_COMPROBANTE', 'OTRO',
];
