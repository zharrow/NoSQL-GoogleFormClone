// src/app/core/services/resource-preloader.service.ts

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ResourcePreloaderService {
  private preloadedResources = new Set<string>();

  /**
   * Précharge les icônes Material Icons critiques
   */
  preloadCriticalIcons(): void {
    const criticalIcons = [
      'add_circle_outline', 'text_fields', 'subject', 'radio_button_checked',
      'check_box', 'arrow_drop_down_circle', 'pin', 'event', 'email',
      'edit', 'delete', 'content_copy', 'drag_indicator'
    ];

    // Créer un élément caché pour forcer le chargement
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
    
    criticalIcons.forEach(icon => {
      const el = document.createElement('i');
      el.className = 'material-icons';
      el.textContent = icon;
      container.appendChild(el);
    });

    document.body.appendChild(container);
    
    // Nettoyer après chargement
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.body.removeChild(container);
      }, 1000);
    });
  }

  /**
   * Précharge les images
   */
  preloadImages(urls: string[]): void {
    urls.forEach(url => {
      if (!this.preloadedResources.has(url)) {
        const img = new Image();
        img.src = url;
        this.preloadedResources.add(url);
      }
    });
  }

  /**
   * Précharge les composants lazy
   */
  async preloadComponent(loadFn: () => Promise<any>): Promise<void> {
    try {
      await loadFn();
    } catch (error) {
      console.error('Failed to preload component:', error);
    }
  }
}