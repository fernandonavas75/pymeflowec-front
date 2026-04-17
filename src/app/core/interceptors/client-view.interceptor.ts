import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AdminViewService } from '../services/admin-view.service';

/**
 * Cuando PLATFORM_ADMIN está en modo cliente (impersonando una empresa),
 * inyecta `company_id` como query param en todas las requests de tienda.
 * El backend usa este param para scopear los datos a la empresa indicada.
 *
 * Se omiten las rutas /platform/ y /auth/ porque ya están scoped de otra forma.
 */
export const clientViewInterceptor: HttpInterceptorFn = (req, next) => {
  const adminView = inject(AdminViewService);
  const company   = adminView.viewedCompany();

  if (!company) return next(req);

  // Rutas de plataforma y auth no necesitan company_id inyectado
  if (req.url.includes('/platform/') || req.url.includes('/auth/')) {
    return next(req);
  }

  const modified = req.clone({
    params: req.params.set('company_id', company.id.toString()),
  });

  return next(modified);
};
