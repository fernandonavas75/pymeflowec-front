export type ExpensePaymentMethod = 'cash' | 'transfer' | 'card' | 'other';
export type ExpenseStatus = 'active' | 'cancelled';

export interface ExpenseCategory {
  id: number;
  organization_id: number;
  name: string;
  description?: string | null;
}

export interface Expense {
  id: number;
  organization_id: number;
  category_id: number;
  category?: ExpenseCategory | null;
  supplier_id?: number | null;
  supplier?: { id: number; name: string } | null;
  amount: number;
  payment_method?: ExpensePaymentMethod | null;
  expense_date: string;
  reference_number?: string | null;
  description?: string | null;
  is_recurring: boolean;
  recurrence_day?: number | null;
  status: ExpenseStatus;
  created_by?: number | null;
  user?: { id: number; full_name: string } | null;
  created_at: string;
}

export interface CreateExpenseDto {
  category_id: number;
  amount: number;
  payment_method?: ExpensePaymentMethod;
  expense_date?: string;
  supplier_id?: number;
  reference_number?: string;
  description?: string;
  is_recurring?: boolean;
  recurrence_day?: number;
}

export interface CreateExpenseCategoryDto {
  name: string;
  description?: string;
}
