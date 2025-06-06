// src/app/core/services/theme.service.ts

import { Injectable, inject, signal, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly STORAGE_KEY = 'app-theme';
  
  // Signal pour le thème actuel
  readonly currentTheme = signal<Theme>('system');
  readonly effectiveTheme = signal<'light' | 'dark'>('light');
  
  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeTheme();
      this.watchSystemTheme();
    }
  }
  
  /**
   * Initialise le thème depuis le stockage ou les préférences système
   */
  private initializeTheme(): void {
    const savedTheme = localStorage.getItem(this.STORAGE_KEY) as Theme;
    const theme = savedTheme || 'system';
    
    this.currentTheme.set(theme);
    this.applyTheme(theme);
    
    // Effect pour appliquer le thème quand il change
    effect(() => {
      const theme = this.currentTheme();
      this.applyTheme(theme);
      localStorage.setItem(this.STORAGE_KEY, theme);
    });
  }
  
  /**
   * Applique le thème sur le document
   */
  private applyTheme(theme: Theme): void {
    const effectiveTheme = theme === 'system' 
      ? this.getSystemTheme() 
      : theme;
    
    this.effectiveTheme.set(effectiveTheme);
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    
    // Mise à jour de la meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', 
        effectiveTheme === 'dark' ? '#121212' : '#ffffff'
      );
    }
  }
  
  /**
   * Détecte le thème système
   */
  private getSystemTheme(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? 'dark' 
      : 'light';
  }
  
  /**
   * Surveille les changements de thème système
   */
  private watchSystemTheme(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    mediaQuery.addEventListener('change', (e) => {
      if (this.currentTheme() === 'system') {
        this.applyTheme('system');
      }
    });
  }
  
  /**
   * Change le thème
   */
  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
  }
  
  /**
   * Toggle entre light et dark
   */
  toggleTheme(): void {
    const current = this.effectiveTheme();
    const newTheme = current === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }
}