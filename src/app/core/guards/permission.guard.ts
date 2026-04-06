import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Usuarios de sistema (sin org) bypassean todos los permisos, igual que el backend
  if (authService.isSystemUser()) return true;

  const requirePlatformStaff: boolean = route.data['platformStaff'] ?? false;
  const requiredPermissions: string[] = route.data['permissions'] ?? [];

  if (requirePlatformStaff) {
    const staff = authService.currentUser()?.platform_staff;
    if (!staff?.can_read && !staff?.can_write) {
      router.navigate(['/dashboard']);
      return false;
    }
    return true;
  }

  if (requiredPermissions.length === 0) return true;

  if (authService.hasPermission(...requiredPermissions)) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
