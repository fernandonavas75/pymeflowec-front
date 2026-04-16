export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE';

export interface AuditLog {
  id: number;
  company_id: number | null;
  user_id: number | null;
  /** INSERT | UPDATE | DELETE — generado por trigger de BD */
  action: AuditAction;
  /** Tabla afectada (ej. "invoices", "products") */
  table_name: string;
  record_id?: number | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  user?: { id: number; full_name: string; email: string } | null;
  company?: { id: number; name: string } | null;
}
