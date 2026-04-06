export type CashRegisterStatus = 'open' | 'closed';
export type MovementType = 'withdrawal' | 'deposit' | 'payment' | 'opening' | 'closing';

export interface CashMovement {
  id: number;
  cash_register_id: number;
  movement_type: MovementType;
  amount: number;
  description?: string | null;
  reference_id?: number | null;
  created_by?: number | null;
  user?: { id: number; full_name: string } | null;
  created_at: string;
}

export interface CashRegister {
  id: number;
  organization_id: number;
  status: CashRegisterStatus;
  opening_amount: number;
  closing_amount?: number | null;
  actual_amount?: number | null;
  difference?: number | null;
  notes?: string | null;
  opened_by?: number | null;
  closed_by?: number | null;
  openedByUser?: { id: number; full_name: string } | null;
  closedByUser?: { id: number; full_name: string } | null;
  opened_at: string;
  closed_at?: string | null;
  movements?: CashMovement[];
  created_at: string;
}

export interface OpenCashRegisterDto {
  opening_amount?: number;
}

export interface CloseCashRegisterDto {
  actual_amount: number;
  notes?: string;
}

export interface AddMovementDto {
  movement_type: 'withdrawal' | 'deposit';
  amount: number;
  description?: string;
}
