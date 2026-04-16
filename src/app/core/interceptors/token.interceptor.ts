import { HttpInterceptorFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AdminViewService } from '../services/admin-view.service';

const TOKEN_KEY = 'pf_token';

function addAuthHeader(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });
}

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService    = inject(AuthService);
  const adminViewSvc   = inject(AdminViewService);
  const token          = localStorage.getItem(TOKEN_KEY);

  let authReq = token ? addAuthHeader(req, token) : req;

  /**
   * Modo cliente: cuando el admin de plataforma visualiza una empresa,
   * adjuntamos el ID de esa empresa en la cabecera X-Company-Id para que
   * el backend sirva los datos de la empresa visualizada.
   */
  const viewedCompany = adminViewSvc.viewedCompany();
  if (viewedCompany && !req.url.includes('/auth/')) {
    authReq = authReq.clone({
      setHeaders: { 'X-Company-Id': viewedCompany.id.toString() }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/refresh') && !req.url.includes('/auth/login')) {
        return authService.refreshToken().pipe(
          switchMap(res => {
            let retryReq = addAuthHeader(req, res.access_token);
            if (viewedCompany && !req.url.includes('/auth/')) {
              retryReq = retryReq.clone({
                setHeaders: { 'X-Company-Id': viewedCompany.id.toString() }
              });
            }
            return next(retryReq);
          }),
          catchError(refreshError => {
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
