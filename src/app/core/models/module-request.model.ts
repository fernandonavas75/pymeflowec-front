export type ModuleRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface PlatformModule {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
  dependencies?: string[];
}

export interface ModuleRequest {
  id: number;
  organization_id: number;
  organization?: { id: number; name: string } | null;
  module_id: number;
  module?: PlatformModule | null;
  status: ModuleRequestStatus;
  notes?: string | null;
  rejection_reason?: string | null;
  requested_by?: number | null;
  user?: { id: number; full_name: string } | null;
  reviewed_by?: number | null;
  reviewer?: { id: number; full_name: string } | null;
  created_at: string;
  updated_at: string;
}

export interface CreateModuleRequestDto {
  module_id: number;
  notes?: string;
}
