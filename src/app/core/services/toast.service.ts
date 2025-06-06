// src/app/shared/services/toast.service.ts

import { Injectable, signal, computed } from '@angular/core';

/**
 * Types de toast disponibles
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Interface pour un message toast
 */
export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  closable?: boolean;
  timestamp: Date;
}

/**
 * Configuration par défaut des toasts
 */
const DEFAULT_TOAST_CONFIG = {
  duration: 5000, // 5 secondes
  closable: true,
  maxToasts: 5
};

/**
 * Service pour gérer les notifications toast
 * Utilise les signals Angular pour la réactivité
 */
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  // Signal contenant tous les toasts actifs
  private readonly toastsSignal = signal<Toast[]>([]);
  
  // Computed pour exposer les toasts en lecture seule
  readonly toasts = computed(() => this.toastsSignal());
  
  // Compteur pour générer des IDs uniques
  private idCounter = 0;
  
  /**
   * Affiche un toast de succès
   */
  success(message: string, title?: string, duration?: number): string {
    return this.show({
      type: 'success',
      message,
      title: title || 'Succès',
      duration
    });
  }
  
  /**
   * Affiche un toast d'erreur
   */
  error(message: string, title?: string, duration?: number): string {
    return this.show({
      type: 'error',
      message,
      title: title || 'Erreur',
      duration: duration || 8000 // Plus long pour les erreurs
    });
  }
  
  /**
   * Affiche un toast d'avertissement
   */
  warning(message: string, title?: string, duration?: number): string {
    return this.show({
      type: 'warning',
      message,
      title: title || 'Attention',
      duration
    });
  }
  
  /**
   * Affiche un toast d'information
   */
  info(message: string, title?: string, duration?: number): string {
    return this.show({
      type: 'info',
      message,
      title: title || 'Information',
      duration
    });
  }
  
  /**
   * Affiche un toast avec configuration personnalisée
   */
  show(config: Partial<Toast> & { type: ToastType; message: string }): string {
    const toast: Toast = {
      id: this.generateId(),
      type: config.type,
      message: config.message,
      title: config.title,
      duration: config.duration ?? DEFAULT_TOAST_CONFIG.duration,
      closable: config.closable ?? DEFAULT_TOAST_CONFIG.closable,
      timestamp: new Date()
    };
    
    // Ajouter le nouveau toast
    this.addToast(toast);
    
    // Programmer la suppression automatique si une durée est définie
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        this.remove(toast.id);
      }, toast.duration);
    }
    
    return toast.id;
  }
  
  /**
   * Supprime un toast spécifique
   */
  remove(id: string): void {
    this.toastsSignal.update(toasts => 
      toasts.filter(toast => toast.id !== id)
    );
  }
  
  /**
   * Supprime tous les toasts
   */
  clear(): void {
    this.toastsSignal.set([]);
  }
  
  /**
   * Supprime tous les toasts d'un type spécifique
   */
  clearByType(type: ToastType): void {
    this.toastsSignal.update(toasts => 
      toasts.filter(toast => toast.type !== type)
    );
  }
  
  /**
   * Ajoute un toast en respectant la limite maximale
   */
  private addToast(toast: Toast): void {
    this.toastsSignal.update(toasts => {
      const newToasts = [...toasts, toast];
      
      // Limiter le nombre de toasts affichés
      if (newToasts.length > DEFAULT_TOAST_CONFIG.maxToasts) {
        return newToasts.slice(-DEFAULT_TOAST_CONFIG.maxToasts);
      }
      
      return newToasts;
    });
  }
  
  /**
   * Génère un ID unique pour un toast
   */
  private generateId(): string {
    return `toast-${Date.now()}-${this.idCounter++}`;
  }
  
  /**
   * Obtient l'icône appropriée pour un type de toast
   */
  static getIcon(type: ToastType): string {
    const icons: Record<ToastType, string> = {
      success: 'check_circle',
      error: 'error',
      warning: 'warning',
      info: 'info'
    };
    return icons[type];
  }
  
  /**
   * Obtient la classe CSS pour un type de toast
   */
  static getClass(type: ToastType): string {
    return `toast-${type}`;
  }
}