import { VoucherType } from './expense.model';
import { PaymentMethod } from './invoice-payment.model';
import { CategoryType } from './expense-category.model';

export interface ExpenseRecurring {
  id: number;
  company_id: number;
  category_id: number;
  category?: { id: number; name: string; category_type: CategoryType } | null;
  description: string;
  amount: number;
  day_of_month: number;
  supplier_id?: number | null;
  supplier?: { id: number; name: string } | null;
  supplier_name_free?: string | null;
  voucher_type?: VoucherType | null;
  default_payment_method?: PaymentMethod | null;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseRecurringDto {
  category_id: number;
  description: string;
  amount: number;
  day_of_month: number;
  supplier_id?: number;
  supplier_name_free?: string;
  voucher_type?: VoucherType;
  default_payment_method?: PaymentMethod;
  starts_at?: string;
  ends_at?: string;
}

export type UpdateExpenseRecurringDto = Partial<CreateExpenseRecurringDto>;
