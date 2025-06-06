// src/app/core/services/auth.service.ts

import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import { 
  User, 
  UserCreate, 
  LoginCredentials, 
  AuthToken 
} from '../models/user.model';
import { TokenService } from './token.service';
import { environment } from '../../../environnements/environment';

/**
 * Service gérant l'authentification et l'état de l'utilisateur
 * Compatible avec SSR
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);
  private readonly platformId = inject(PLATFORM_ID);
  
  private readonly baseUrl = `${environment.apiUrl}/auth`;
  
  // Signal pour l'utilisateur courant
  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();
  
  // Signals réactifs
  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly isLoading = signal(false);
  
  constructor() {
    // Restaurer l'utilisateur uniquement côté client
    if (isPlatformBrowser(this.platformId)) {
      this.initializeAuth();
    }
  }
  
  /**
   * Initialise l'authentification au démarrage
   */
  private initializeAuth(): void {
    const token = this.tokenService.getToken();
    if (token && this.tokenService.isTokenValid()) {
      // TODO: Récupérer les infos utilisateur depuis l'API
      const userData = this.tokenService.getTokenData();
      if (userData) {
        // Simuler un utilisateur basique
        this.setCurrentUser({
          _id: 'temp',
          username: userData.sub,
          email: `${userData.sub}@example.com`,
          is_active: true,
          is_superuser: false,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }
  }
  
  /**
   * Connexion d'un utilisateur
   */
  login(credentials: LoginCredentials): Observable<AuthToken> {
    this.isLoading.set(true);
    
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    return this.http.post<AuthToken>(`${this.baseUrl}/login`, formData).pipe(
      tap(response => {
        this.tokenService.saveToken(response.access_token);
        this.handleSuccessfulAuth(response);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }
  
  /**
   * Inscription d'un nouvel utilisateur
   */
  register(userData: UserCreate): Observable<User> {
    this.isLoading.set(true);
    
    return this.http.post<User>(`${this.baseUrl}/register`, userData).pipe(
      tap(() => {
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }
  
  /**
   * Déconnexion
   */
  logout(): void {
    this.tokenService.removeToken();
    this.setCurrentUser(null);
    this.router.navigate(['/auth/login']);
  }
  
  /**
   * Rafraîchit le token (si implémenté côté API)
   */
  refreshToken(): Observable<AuthToken> {
    // TODO: Implémenter le refresh token
    return throwError(() => new Error('Refresh token not implemented'));
  }
  
  /**
   * Gère une authentification réussie
   */
  private handleSuccessfulAuth(token: AuthToken): void {
    const tokenData = this.tokenService.getTokenData();
    if (tokenData) {
      // TODO: Récupérer les vraies infos utilisateur depuis l'API
      this.setCurrentUser({
        _id: 'temp',
        username: tokenData.sub,
        email: `${tokenData.sub}@example.com`,
        is_active: true,
        is_superuser: false,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  }
  
  /**
   * Met à jour l'utilisateur courant
   */
  private setCurrentUser(user: User | null): void {
    this.currentUser.set(user);
    this.currentUserSubject.next(user);
  }
  
  /**
   * Vérifie si l'utilisateur est authentifié
   */
  checkAuthentication(): boolean {
    if (!this.tokenService.getToken() || !this.tokenService.isTokenValid()) {
      this.setCurrentUser(null);
      return false;
    }
    return true;
  }
  
  /**
   * Récupère le nom d'utilisateur depuis le token
   */
  getUsernameFromToken(): string | null {
    const tokenData = this.tokenService.getTokenData();
    return tokenData?.sub || null;
  }
}