// src/app/core/services/api.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../../environnements/environment';

/**
 * Options pour les requêtes API
 */
export interface ApiOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams | { [param: string]: string | string[] };
  retry?: number;
  reportProgress?: boolean;
}

/**
 * Réponse paginée générique
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Service API générique pour toutes les requêtes HTTP
 * Centralise la logique de communication avec l'API
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /**
   * Effectue une requête GET
   */
  get<T>(endpoint: string, options?: ApiOptions): Observable<T> {
    return this.request<T>('GET', endpoint, null, options);
  }

  /**
   * Effectue une requête POST
   */
  post<T>(endpoint: string, body: any, options?: ApiOptions): Observable<T> {
    return this.request<T>('POST', endpoint, body, options);
  }

  /**
   * Effectue une requête PUT
   */
  put<T>(endpoint: string, body: any, options?: ApiOptions): Observable<T> {
    return this.request<T>('PUT', endpoint, body, options);
  }

  /**
   * Effectue une requête PATCH
   */
  patch<T>(endpoint: string, body: any, options?: ApiOptions): Observable<T> {
    return this.request<T>('PATCH', endpoint, body, options);
  }

  /**
   * Effectue une requête DELETE
   */
  delete<T>(endpoint: string, options?: ApiOptions): Observable<T> {
    return this.request<T>('DELETE', endpoint, null, options);
  }

  /**
   * Méthode générique pour effectuer une requête HTTP
   */
  private request<T>(
    method: string,
    endpoint: string,
    body?: any,
    options?: ApiOptions
  ): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const retryCount = options?.retry ?? 1;

    const httpOptions = {
      headers: options?.headers,
      params: options?.params,
      reportProgress: options?.reportProgress
    };

    let request$: Observable<T>;

    switch (method) {
      case 'GET':
        request$ = this.http.get<T>(url, httpOptions);
        break;
      case 'POST':
        request$ = this.http.post<T>(url, body, httpOptions);
        break;
      case 'PUT':
        request$ = this.http.put<T>(url, body, httpOptions);
        break;
      case 'PATCH':
        request$ = this.http.patch<T>(url, body, httpOptions);
        break;
      case 'DELETE':
        request$ = this.http.delete<T>(url, httpOptions);
        break;
      default:
        return throwError(() => new Error(`Méthode HTTP non supportée: ${method}`));
    }

    return request$.pipe(
      retry(retryCount),
      catchError(this.handleError)
    );
  }

  /**
   * Gère les erreurs HTTP
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      errorMessage = this.getServerErrorMessage(error);
    }

    console.error('API Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Extrait le message d'erreur du serveur
   */
  private getServerErrorMessage(error: any): string {
    switch (error.status) {
      case 400:
        return error.error?.detail || 'Requête invalide';
      case 401:
        return 'Non autorisé - Veuillez vous connecter';
      case 403:
        return 'Accès refusé';
      case 404:
        return 'Ressource introuvable';
      case 409:
        return error.error?.detail || 'Conflit de données';
      case 422:
        return this.formatValidationErrors(error.error?.detail);
      case 500:
        return 'Erreur serveur - Veuillez réessayer plus tard';
      default:
        return `Erreur ${error.status}: ${error.statusText}`;
    }
  }

  /**
   * Formate les erreurs de validation
   */
  private formatValidationErrors(errors: any): string {
    if (Array.isArray(errors)) {
      return errors.map(err => err.msg || err.message).join(', ');
    }
    return 'Erreur de validation';
  }

  /**
   * Construit des paramètres de requête pour la pagination
   */
  buildPaginationParams(page: number, pageSize: number): HttpParams {
    return new HttpParams()
      .set('skip', ((page - 1) * pageSize).toString())
      .set('limit', pageSize.toString());
  }

  /**
   * Upload de fichier
   */
  uploadFile(endpoint: string, file: File, additionalData?: any): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    return this.post(endpoint, formData, {
      reportProgress: true
    });
  }
}