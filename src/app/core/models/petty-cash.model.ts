export type PettyCashStatus = 'OPEN' | 'CLOSED';
export type PettyCashMovementType = 'EXPENSE' | 'REPLENISH' | 'ADJUSTMENT';

export interface PettyCash {
  id: number;
  company_id: number;
  name: string;
  opening_amount: number;
  current_balance: number;
  status: PettyCashStatus;
  opened_by: number;
  opened_at: string;
  closed_by?: number | null;
  closed_at?: string | null;
  closing_amount_reported?: number | null;
  notes?: string | null;
  openedBy?: { id: number; full_name: string };
  closedBy?: { id: number; full_name: string } | null;
  created_at: string;
  updated_at: string;
}

export interface PettyCashMovement {
  id: number;
  petty_cash_id: number;
  company_id: number;
  movement_type: PettyCashMovementType;
  category_id?: number | null;
  amount: number;
  description: string;
  voucher_number?: string | null;
  balance_after: number;
  created_by: number;
  category?: { id: number; name: string } | null;
  creator?: { id: number; full_name: string };
  created_at: string;
}

export interface OpenPettyCashDto {
  opening_amount: number;
  name?: string;
  notes?: string;
}

export interface ClosePettyCashDto {
  closing_amount_reported?: number;
  notes?: string;
}

export interface CreatePettyCashMovementDto {
  movement_type: PettyCashMovementType;
  amount: number;
  description: string;
  category_id?: number;
  voucher_number?: string;
}

export const MOVEMENT_TYPE_LABELS: Record<PettyCashMovementType, string> = {
  EXPENSE:    'Egreso',
  REPLENISH:  'Reposición',
  ADJUSTMENT: 'Ajuste',
};
