import { CategoryType } from './expense-category.model';

export type BudgetPeriodType = 'MONTHLY' | 'ANNUAL';

export interface ExpenseBudget {
  id: number;
  company_id: number;
  category_id: number;
  period_type: BudgetPeriodType;
  period_year: number;
  period_month?: number | null;
  budgeted_amount: number;
  notes?: string | null;
  category?: { id: number; name: string; category_type: CategoryType };
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseBudgetDto {
  category_id: number;
  period_type: BudgetPeriodType;
  period_year: number;
  period_month?: number;
  budgeted_amount: number;
  notes?: string;
}

export interface UpdateExpenseBudgetDto {
  budgeted_amount?: number;
  notes?: string;
}

export const BUDGET_PERIOD_TYPE_LABELS: Record<BudgetPeriodType, string> = {
  MONTHLY: 'Mensual',
  ANNUAL:  'Anual',
};

export const MONTHS: { value: number; label: string }[] = [
  { value: 1,  label: 'Enero' },
  { value: 2,  label: 'Febrero' },
  { value: 3,  label: 'Marzo' },
  { value: 4,  label: 'Abril' },
  { value: 5,  label: 'Mayo' },
  { value: 6,  label: 'Junio' },
  { value: 7,  label: 'Julio' },
  { value: 8,  label: 'Agosto' },
  { value: 9,  label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];
