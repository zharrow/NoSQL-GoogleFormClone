// src/app/core/services/token.service.ts

import { Injectable } from '@angular/core';
import { TokenData } from '../models/user.model';

/**
 * Service de gestion des tokens JWT
 * Gère le stockage, la récupération et la validation des tokens
 */
@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly TOKEN_KEY = 'access_token';
  
  /**
   * Sauvegarde le token dans le localStorage
   */
  saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }
  
  /**
   * Récupère le token depuis le localStorage
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
  
  /**
   * Supprime le token du localStorage
   */
  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
  
  /**
   * Décode le token JWT sans vérifier la signature
   */
  decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Erreur lors du décodage du token:', error);
      return null;
    }
  }
  
  /**
   * Récupère les données du token actuel
   */
  getTokenData(): TokenData | null {
    const token = this.getToken();
    if (!token) return null;
    
    const decoded = this.decodeToken(token);
    if (!decoded) return null;
    
    return {
      sub: decoded.sub,
      exp: decoded.exp
    };
  }
  
  /**
   * Vérifie si le token est expiré
   */
  isTokenExpired(token?: string): boolean {
    const tokenToCheck = token || this.getToken();
    if (!tokenToCheck) return true;
    
    const decoded = this.decodeToken(tokenToCheck);
    if (!decoded || !decoded.exp) return true;
    
    const expirationDate = new Date(decoded.exp * 1000);
    return expirationDate <= new Date();
  }
  
  /**
   * Vérifie si le token est valide (existe et non expiré)
   */
  isTokenValid(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }
  
  /**
   * Récupère le temps restant avant expiration (en secondes)
   */
  getTokenRemainingTime(): number {
    const token = this.getToken();
    if (!token) return 0;
    
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return 0;
    
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, decoded.exp - now);
  }
  
  /**
   * Vérifie si le token expire bientôt (moins de 5 minutes)
   */
  isTokenExpiringSoon(): boolean {
    const remainingTime = this.getTokenRemainingTime();
    return remainingTime > 0 && remainingTime < 300; // 5 minutes
  }
}