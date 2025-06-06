// src/app/core/services/storage.service.ts

import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Service abstrait pour le stockage
 * Gère automatiquement les différences entre client et serveur
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly platformId = inject(PLATFORM_ID);
  private inMemoryStorage = new Map<string, string>();
  
  /**
   * Obtient une valeur du stockage
   */
  getItem(key: string): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(key);
    }
    return this.inMemoryStorage.get(key) || null;
  }
  
  /**
   * Définit une valeur dans le stockage
   */
  setItem(key: string, value: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(key, value);
    } else {
      this.inMemoryStorage.set(key, value);
    }
  }
  
  /**
   * Supprime une valeur du stockage
   */
  removeItem(key: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(key);
    } else {
      this.inMemoryStorage.delete(key);
    }
  }
  
  /**
   * Efface tout le stockage
   */
  clear(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.clear();
    } else {
      this.inMemoryStorage.clear();
    }
  }
}