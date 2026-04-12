import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard basado en roles del backend.
 *
 * Datos de ruta soportados:
 *  - platform: true         → solo usuarios de plataforma (sin empresa)
 *  - roles: string[]        → requiere uno de los roles indicados
 *  - adminOnly: true        → alias para roles: ['STORE_ADMIN']
 *
 * Los usuarios de plataforma (isSystemUser) siempre pasan guardas de tienda.
 */
export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const requirePlatform: boolean = route.data['platform'] ?? false;
  const adminOnly: boolean = route.data['adminOnly'] ?? false;
  const requiredRoles: string[] = adminOnly
    ? ['STORE_ADMIN']
    : (route.data['roles'] ?? []);

  // Rutas de plataforma: solo accesibles para usuarios sin empresa
  if (requirePlatform) {
    if (auth.isSystemUser()) return true;
    router.navigate(['/dashboard']);
    return false;
  }

  // Usuarios de plataforma bypasean todas las comprobaciones de tienda
  if (auth.isSystemUser()) return true;

  // Sin roles requeridos → cualquier usuario autenticado puede pasar
  if (requiredRoles.length === 0) return true;

  if (auth.hasRole(...requiredRoles)) return true;

  router.navigate(['/dashboard']);
  return false;
};
