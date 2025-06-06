// src/app/core/interceptors/error.interceptor.ts

import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastService } from '../../core/services/toast.service';

/**
 * Structure d'une erreur API
 */
interface ApiError {
  status: number;
  message: string;
  details?: any;
  timestamp: Date;
}

/**
 * Intercepteur HTTP pour gérer les erreurs globalement
 * Affiche des notifications toast pour les erreurs
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private readonly toastService = inject(ToastService);

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        const apiError = this.parseError(error);
        
        // Ne pas afficher de toast pour certaines erreurs
        if (!this.shouldShowToast(apiError)) {
          return throwError(() => apiError);
        }

        // Afficher le message d'erreur
        this.showErrorMessage(apiError);

        return throwError(() => apiError);
      })
    );
  }

  /**
   * Parse l'erreur HTTP en format standardisé
   */
  private parseError(error: HttpErrorResponse): ApiError {
    let message = 'Une erreur inattendue s\'est produite';
    let details = null;

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      message = error.error.message;
    } else {
      // Erreur côté serveur
      message = this.getServerErrorMessage(error);
      details = error.error?.detail || error.error;
    }

    return {
      status: error.status,
      message,
      details,
      timestamp: new Date()
    };
  }

  /**
   * Détermine le message d'erreur basé sur le statut HTTP
   */
  private getServerErrorMessage(error: HttpErrorResponse): string {
    // Si le serveur a fourni un message, l'utiliser
    if (error.error?.detail && typeof error.error.detail === 'string') {
      return error.error.detail;
    }

    // Messages par défaut selon le statut
    switch (error.status) {
      case 0:
        return 'Impossible de contacter le serveur. Vérifiez votre connexion.';
      case 400:
        return 'Requête invalide. Vérifiez les données saisies.';
      case 401:
        return 'Session expirée. Veuillez vous reconnecter.';
      case 403:
        return 'Vous n\'avez pas les permissions nécessaires.';
      case 404:
        return 'La ressource demandée est introuvable.';
      case 409:
        return 'Conflit de données. L\'opération ne peut pas être effectuée.';
      case 422:
        return this.formatValidationErrors(error.error?.detail);
      case 429:
        return 'Trop de requêtes. Veuillez patienter avant de réessayer.';
      case 500:
        return 'Erreur serveur. Nos équipes ont été notifiées.';
      case 502:
        return 'Service temporairement indisponible.';
      case 503:
        return 'Service en maintenance. Veuillez réessayer plus tard.';
      default:
        return `Erreur ${error.status}: ${error.statusText}`;
    }
  }

  /**
   * Formate les erreurs de validation (422)
   */
  private formatValidationErrors(errors: any): string {
    if (!errors) return 'Erreur de validation';

    // Si c'est un tableau d'erreurs FastAPI
    if (Array.isArray(errors)) {
      const messages = errors.map(err => {
        const field = err.loc?.join('.') || 'champ';
        return `${field}: ${err.msg}`;
      });
      return messages.join(', ');
    }

    // Si c'est un objet d'erreurs
    if (typeof errors === 'object') {
      const messages = Object.entries(errors).map(([field, msg]) => {
        return `${field}: ${msg}`;
      });
      return messages.join(', ');
    }

    return errors.toString();
  }

  /**
   * Détermine si un toast doit être affiché pour cette erreur
   */
  private shouldShowToast(error: ApiError): boolean {
    // Ne pas afficher de toast pour les erreurs 401 (gérées par AuthInterceptor)
    if (error.status === 401) return false;

    // Ne pas afficher pour les annulations de requêtes
    if (error.message.includes('cancelled')) return false;

    return true;
  }

  /**
   * Affiche le message d'erreur approprié
   */
  private showErrorMessage(error: ApiError): void {
    // Déterminer le type de toast selon le statut
    if (error.status >= 500) {
      this.toastService.error(error.message, 'Erreur serveur');
    } else if (error.status === 404) {
      this.toastService.warning(error.message, 'Introuvable');
    } else if (error.status === 0) {
      this.toastService.error(error.message, 'Connexion perdue');
    } else {
      this.toastService.error(error.message);
    }

    // Logger l'erreur complète en développement
    if (!this.isProduction()) {
      console.error('API Error:', error);
    }
  }

  /**
   * Vérifie si on est en production
   */
  private isProduction(): boolean {
    return !window.location.hostname.includes('localhost');
  }
}

/**
 * Provider pour l'intercepteur d'erreurs
 */
export const errorInterceptorProvider = {
  provide: 'HTTP_INTERCEPTORS',
  useClass: ErrorInterceptor,
  multi: true
};