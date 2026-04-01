import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let message = 'Ha ocurrido un error inesperado';

      if (error.error && typeof error.error === 'object') {
        if (error.error.message) {
          message = Array.isArray(error.error.message)
            ? error.error.message[0]
            : error.error.message;
        }
      }

      if (error.status === 0) {
        message = 'No se pudo conectar con el servidor';
      } else if (error.status === 403) {
        message = 'No tienes permiso para realizar esta acción';
      } else if (error.status === 404) {
        message = 'El recurso solicitado no fue encontrado';
      } else if (error.status === 422) {
        message = error.error?.message || 'Error de validación';
      } else if (error.status >= 500) {
        message = 'Error interno del servidor';
      }

      if (error.status !== 401) {
        snackBar.open(message, 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar'],
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      }

      return throwError(() => error);
    })
  );
};
