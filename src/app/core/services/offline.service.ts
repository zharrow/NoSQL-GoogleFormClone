// src/app/core/services/offline.service.ts

import { Injectable, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { fromEvent, merge } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  readonly isOnline = signal(navigator.onLine);
  readonly hasUpdate = signal(false);
  
  constructor(private swUpdate: SwUpdate) {
    this.monitorConnectivity();
    this.checkForUpdates();
  }
  
  /**
   * Surveille la connectivité
   */
  private monitorConnectivity(): void {
    merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).subscribe(online => {
      this.isOnline.set(online);
      
      if (online) {
        this.syncOfflineData();
      }
    });
  }
  
  /**
   * Vérifie les mises à jour
   */
  private checkForUpdates(): void {
    if (!this.swUpdate.isEnabled) return;
    
    // Vérifier toutes les heures
    setInterval(() => {
      this.swUpdate.checkForUpdate();
    }, 60 * 60 * 1000);
    
    // Écouter les mises à jour disponibles
    this.swUpdate.versionUpdates.subscribe(event => {
      if (event.type === 'VERSION_READY') {
        this.hasUpdate.set(true);
      }
    });
  }
  
  /**
   * Applique la mise à jour
   */
  async applyUpdate(): Promise<void> {
    await this.swUpdate.activateUpdate();
    document.location.reload();
  }
  
  /**
   * Synchronise les données offline
   */
  private async syncOfflineData(): Promise<void> {
    // Récupérer les données en attente depuis IndexedDB
    const pendingRequests = await this.getPendingRequests();
    
    // Les envoyer au serveur
    for (const request of pendingRequests) {
      try {
        await this.replayRequest(request);
        await this.removePendingRequest(request.id);
      } catch (error) {
        console.error('Failed to sync request:', error);
      }
    }
  }
  
  private async getPendingRequests(): Promise<any[]> {
    // Implémenter avec IndexedDB
    return [];
  }
  
  private async replayRequest(request: any): Promise<void> {
    // Rejouer la requête
  }
  
  private async removePendingRequest(id: string): Promise<void> {
    // Supprimer de IndexedDB
  }
}