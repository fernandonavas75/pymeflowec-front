import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { ModuleCatalogItem } from '../models/module-request.model';

@Injectable({ providedIn: 'root' })
export class CompanyModulesService {
  private api = inject(ApiService);

  /** Caché reactivo del catálogo */
  catalog = signal<ModuleCatalogItem[]>([]);

  /** Códigos de módulos aprobados */
  approvedCodes = signal<Set<string>>(new Set());

  /** Códigos de módulos pendientes de aprobación */
  pendingCodes = signal<Set<string>>(new Set());

  /**
   * true si la última carga falló.
   * El sidebar usa esto como fallback para mostrar todos los items
   * en vez de un sidebar vacío por error de red.
   */
  loadFailed = signal(false);

  /**
   * true cuando el catálogo fue cargado al menos una vez (con éxito o con error).
   * El dashboard lo usa para evitar una doble llamada HTTP al loadCatalog.
   */
  catalogReady = signal(false);

  /** Resetea todos los signals — llamar en logout para evitar datos de sesión anterior */
  reset(): void {
    this.catalog.set([]);
    this.approvedCodes.set(new Set());
    this.pendingCodes.set(new Set());
    this.loadFailed.set(false);
    this.catalogReady.set(false);
  }

  /**
   * Carga el catálogo completo con estado de la empresa.
   * Sin argumentos usa la empresa del JWT; con `companyId` (admin de
   * plataforma) carga el catálogo de esa empresa específica.
   */
  loadCatalog(companyId?: number): Observable<ModuleCatalogItem[]> {
    return this.api
      .get<{ success: boolean; data: ModuleCatalogItem[] }>(
        '/platform/modules/company-catalog',
        companyId !== undefined ? { company_id: companyId } : undefined,
      )
      .pipe(
        map(r => r?.data ?? []),
        tap(items => {
          const now = new Date();
          this.catalog.set(items);
          this.approvedCodes.set(new Set(
            items
              .filter(m => m.status === 'APPROVED' && (!m.expires_at || new Date(m.expires_at) > now))
              .map(m => m.code)
          ));
          this.pendingCodes.set(new Set(items.filter(m => m.status === 'PENDING').map(m => m.code)));
          this.loadFailed.set(false);
          this.catalogReady.set(true);
        }),
        catchError(err => {
          // Si la API falla marcamos el error para que el sidebar muestre el fallback
          this.loadFailed.set(true);
          this.catalogReady.set(true);
          return throwError(() => err);
        }),
      );
  }

  /**
   * Versión para administrador de plataforma: carga el catálogo de módulos
   * de una empresa específica pasando su ID como query param.
   */
  loadCatalogForCompany(companyId: number): Observable<ModuleCatalogItem[]> {
    return this.loadCatalog(companyId);
  }
}
