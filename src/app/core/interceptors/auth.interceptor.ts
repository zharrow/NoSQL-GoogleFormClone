// src/app/core/interceptors/auth.interceptor.ts

import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { TokenService } from '../services/token.service';
import { Router } from '@angular/router';

/**
 * Intercepteur d'authentification fonctionnel pour Angular 19
 * Ajoute automatiquement le token JWT aux requêtes
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  // Ajouter le token si disponible et nécessaire
  const token = tokenService.getToken();
  if (token && shouldAddToken(req.url)) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token expiré ou invalide
        tokenService.removeToken();
        router.navigate(['/auth/login'], {
          queryParams: { returnUrl: router.url }
        });
      }
      return throwError(() => error);
    })
  );
};

/**
 * Vérifie si le token doit être ajouté à la requête
 */
function shouldAddToken(url: string): boolean {
  const authUrls = ['/auth/login', '/auth/register', '/auth/refresh'];
  return !authUrls.some(authUrl => url.includes(authUrl));
}