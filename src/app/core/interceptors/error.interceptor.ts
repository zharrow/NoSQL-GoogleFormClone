// src/app/core/interceptors/error.interceptor.ts

import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

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
 * Intercepteur d'erreur fonctionnel pour Angular 19
 * Affiche des notifications toast pour les erreurs
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const apiError = parseError(error);
      
      // Ne pas afficher de toast pour certaines erreurs
      if (shouldShowToast(apiError)) {
        showErrorMessage(toastService, apiError);
      }

      return throwError(() => apiError);
    })
  );
};

/**
 * Parse l'erreur HTTP en format standardisé
 */
function parseError(error: HttpErrorResponse): ApiError {
  let message = 'Une erreur inattendue s\'est produite';
  let details = null;

  if (error.error instanceof ErrorEvent) {
    // Erreur côté client
    message = error.error.message;
  } else {
    // Erreur côté serveur
    message = getServerErrorMessage(error);
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
function getServerErrorMessage(error: HttpErrorResponse): string {
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
      return formatValidationErrors(error.error?.detail);
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
function formatValidationErrors(errors: any): string {
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
function shouldShowToast(error: ApiError): boolean {
  // Ne pas afficher de toast pour les erreurs 401 (gérées par AuthInterceptor)
  if (error.status === 401) return false;

  // Ne pas afficher pour les annulations de requêtes
  if (error.message.includes('cancelled')) return false;

  return true;
}

/**
 * Affiche le message d'erreur approprié
 */
function showErrorMessage(toastService: ToastService, error: ApiError): void {
  // Déterminer le type de toast selon le statut
  if (error.status >= 500) {
    toastService.error(error.message, 'Erreur serveur');
  } else if (error.status === 404) {
    toastService.warning(error.message, 'Introuvable');
  } else if (error.status === 0) {
    toastService.error(error.message, 'Connexion perdue');
  } else {
    toastService.error(error.message);
  }

  // Logger l'erreur complète en développement
  if (!isProduction()) {
    console.error('API Error:', error);
  }
}

/**
 * Vérifie si on est en production
 */
function isProduction(): boolean {
  return !window.location.hostname.includes('localhost');
}