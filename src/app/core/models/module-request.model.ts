export type ModuleRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED' | 'EXPIRED';

export interface PlatformModule {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ModuleRequest {
  id: number;
  company_id: number;
  module_id: number;
  requested_by: number;
  status: ModuleRequestStatus;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  comments?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
  company?: { id: number; name: string } | null;
  module?: PlatformModule | null;
  user?: { id: number; full_name: string } | null;
  reviewer?: { id: number; full_name: string } | null;
}

export interface CreateModuleRequestDto {
  module_id: number;
  comments?: string;
}

/** Módulo de la plataforma con estado de acceso para la empresa actual */
export interface ModuleCatalogItem extends PlatformModule {
  /** APPROVED = activo, PENDING = en espera, REJECTED = rechazado, REVOKED = revocado, null = sin solicitud */
  status: ModuleRequestStatus | null;
  request_id: number | null;
  expires_at: string | null;
  /** true cuando el acceso fue activado como demo de trial (approved_by === null) */
  is_trial: boolean;
}
