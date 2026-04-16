export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface AuditLog {
  id: number;
  company_id: number | null;
  user_id: number | null;
  action: string;
  resource: string;
  resource_id?: string | null;
  method: HttpMethod;
  status_code: number;
  ip_address?: string | null;
  details?: Record<string, unknown> | null;
  created_at: string;
  user?: { id: number; full_name: string; email: string } | null;
  company?: { id: number; name: string } | null;
}
