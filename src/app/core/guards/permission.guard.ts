import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard basado en roles del backend.
 *
 * Datos de ruta soportados:
 *  - platform: true      → accesible para cualquier usuario de plataforma
 *                          (PLATFORM_ADMIN y PLATFORM_SUPPORT; ningún usuario de tienda)
 *  - platformAdmin: true → exclusivo para PLATFORM_ADMIN
 *  - roles: string[]     → requiere uno de los roles indicados
 *  - adminOnly: true     → alias para roles: ['STORE_ADMIN']
 *  - writeOnly: true     → ruta de escritura (formularios new/edit, settings);
 *                          bloqueada para PLATFORM_SUPPORT en modo cliente
 *
 * Usuarios de plataforma en guards de tienda:
 *  - PLATFORM_ADMIN bypasea cualquier guard (en modo cliente opera como STORE_ADMIN).
 *  - PLATFORM_SUPPORT solo bypasea rutas de lectura — el backend rechaza sus
 *    escrituras con 403 (platformStoreAccess: soporte = solo GET), así que las
 *    rutas marcadas writeOnly lo redirigen a /dashboard.
 */
export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  const requirePlatformAdmin: boolean = route.data['platformAdmin'] ?? false;
  const requirePlatform: boolean      = route.data['platform'] ?? false;
  const adminOnly: boolean            = route.data['adminOnly'] ?? false;
  const requiredRoles: string[]       = adminOnly
    ? ['STORE_ADMIN']
    : (route.data['roles'] ?? []);

  // ── Rutas exclusivas de PLATFORM_ADMIN ────────────────────────────
  if (requirePlatformAdmin) {
    if (auth.isPlatformAdmin()) return true;
    router.navigate(['/dashboard']);
    return false;
  }

  // ── Rutas para cualquier usuario de plataforma ────────────────────
  if (requirePlatform) {
    if (auth.isSystemUser()) return true;
    router.navigate(['/dashboard']);
    return false;
  }

  // ── Usuarios de plataforma en guards de tienda ─────────────────────
  if (auth.isSystemUser()) {
    if (auth.isPlatformAdmin()) return true;
    // PLATFORM_SUPPORT: solo lectura — sin acceso a rutas de escritura
    const writeOnly: boolean = route.data['writeOnly'] ?? false;
    if (!writeOnly) return true;
    router.navigate(['/dashboard']);
    return false;
  }

  // ── Sin roles requeridos → cualquier usuario autenticado ──────────
  if (requiredRoles.length === 0) return true;

  if (auth.hasRole(...requiredRoles)) return true;

  router.navigate(['/dashboard']);
  return false;
};
