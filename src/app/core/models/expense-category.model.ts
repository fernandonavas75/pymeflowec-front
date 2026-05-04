export type CategoryType =
  | 'ADMINISTRATIVO' | 'OPERATIVO' | 'VENTAS' | 'FINANCIERO'
  | 'TRIBUTARIO' | 'RECURSOS_HUMANOS' | 'INVENTARIO' | 'IMPREVISTO';

export interface ExpenseCategory {
  id: number;
  company_id: number;
  name: string;
  category_type: CategoryType;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseCategoryDto {
  name: string;
  category_type: CategoryType;
  description?: string;
}

export interface UpdateExpenseCategoryDto {
  name?: string;
  category_type?: CategoryType;
  description?: string;
  is_active?: boolean;
}

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  ADMINISTRATIVO:   'Administrativo',
  OPERATIVO:        'Operativo',
  VENTAS:           'Ventas',
  FINANCIERO:       'Financiero',
  TRIBUTARIO:       'Tributario',
  RECURSOS_HUMANOS: 'Recursos Humanos',
  INVENTARIO:       'Inventario',
  IMPREVISTO:       'Imprevisto',
};

export const CATEGORY_TYPES: CategoryType[] = [
  'ADMINISTRATIVO', 'OPERATIVO', 'VENTAS', 'FINANCIERO',
  'TRIBUTARIO', 'RECURSOS_HUMANOS', 'INVENTARIO', 'IMPREVISTO',
];
