import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard basado en roles del backend.
 *
 * Datos de ruta soportados:
 *  - platform: true      → accesible para cualquier usuario de plataforma
 *                          (PLATFORM_ADMIN y PLATFORM_STAFF; ningún usuario de tienda)
 *  - platformAdmin: true → exclusivo para PLATFORM_ADMIN
 *  - roles: string[]     → requiere uno de los roles indicados
 *  - adminOnly: true     → alias para roles: ['STORE_ADMIN']
 *
 * Los usuarios de plataforma (isSystemUser) bypasean todos los guards de tienda.
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

  // ── Usuarios de plataforma bypasean todos los guards de tienda ─────
  if (auth.isSystemUser()) return true;

  // ── Sin roles requeridos → cualquier usuario autenticado ──────────
  if (requiredRoles.length === 0) return true;

  if (auth.hasRole(...requiredRoles)) return true;

  router.navigate(['/dashboard']);
  return false;
};
