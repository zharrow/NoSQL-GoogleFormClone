// src/app/core/interceptors/auth.interceptor.ts

import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { TokenService } from '../services/token.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

/**
 * Intercepteur HTTP pour gérer l'authentification
 * Ajoute automatiquement le token JWT aux requêtes
 * Gère le rafraîchissement du token et les erreurs 401
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly tokenService = inject(TokenService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Ajouter le token si disponible
    const token = this.tokenService.getToken();
    if (token && this.shouldAddToken(request)) {
      request = this.addToken(request, token);
    }

    return next.handle(request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Vérifie si le token doit être ajouté à la requête
   */
  private shouldAddToken(request: HttpRequest<any>): boolean {
    // Ne pas ajouter le token pour les endpoints d'auth
    const authUrls = ['/auth/login', '/auth/register', '/auth/refresh'];
    return !authUrls.some(url => request.url.includes(url));
  }

  /**
   * Ajoute le token JWT à la requête
   */
  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  /**
   * Gère les erreurs 401 (non autorisé)
   */
  private handle401Error(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Si on est déjà en train de rafraîchir, attendre
    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => {
          return next.handle(this.addToken(request, token!));
        })
      );
    }

    // Commencer le rafraîchissement
    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    // TODO: Implémenter le refresh token quand l'API le supportera
    // Pour l'instant, on déconnecte simplement l'utilisateur
    this.authService.logout();
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: this.router.url }
    });

    return throwError(() => new Error('Session expirée'));

    // Code pour le refresh token (à décommenter quand implémenté)
    /*
    return this.authService.refreshToken().pipe(
      switchMap((token: AuthToken) => {
        this.isRefreshing = false;
        this.refreshTokenSubject.next(token.access_token);
        return next.handle(this.addToken(request, token.access_token));
      }),
      catchError(err => {
        this.isRefreshing = false;
        this.authService.logout();
        return throwError(() => err);
      })
    );
    */
  }
}

/**
 * Provider pour l'intercepteur d'authentification
 */
export const authInterceptorProvider = {
  provide: 'HTTP_INTERCEPTORS',
  useClass: AuthInterceptor,
  multi: true
};