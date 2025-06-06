// src/app/core/services/notification.service.ts

import { Injectable, inject, signal } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { environment } from '../../../environments/environment';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'response';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  formId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly swPush = inject(SwPush);
  
  // État des notifications
  private readonly notificationsSignal = signal<Notification[]>([]);
  readonly notifications = this.notificationsSignal.asReadonly();
  readonly unreadCount = signal(0);
  
  constructor() {
    this.initializePushNotifications();
    this.connectWebSocket();
  }
  
  /**
   * Initialise les notifications push
   */
  private async initializePushNotifications(): Promise<void> {
    if (!this.swPush.isEnabled) return;
    
    try {
      const subscription = await this.swPush.requestSubscription({
        serverPublicKey: environment.vapidPublicKey
      });
      
      // Envoyer la subscription au backend
      await this.sendSubscriptionToServer(subscription);
      
      // Écouter les notifications
      this.swPush.messages.subscribe(message => {
        this.handlePushNotification(message);
      });
    } catch (err) {
      console.error('Could not subscribe to notifications', err);
    }
  }
  
  /**
   * Connexion WebSocket pour les notifications temps réel
   */
  private connectWebSocket(): void {
    const ws = new WebSocket(environment.wsUrl);
    
    ws.onmessage = (event) => {
      const notification = JSON.parse(event.data) as Notification;
      this.addNotification(notification);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Reconnexion après 5 secondes
      setTimeout(() => this.connectWebSocket(), 5000);
    };
  }
  
  /**
   * Ajoute une notification
   */
  private addNotification(notification: Notification): void {
    this.notificationsSignal.update(notifications => {
      const updated = [notification, ...notifications];
      // Garder seulement les 50 dernières
      return updated.slice(0, 50);
    });
    
    this.updateUnreadCount();
    
    // Jouer un son si activé
    this.playNotificationSound();
  }
  
  /**
   * Marque une notification comme lue
   */
  markAsRead(notificationId: string): void {
    this.notificationsSignal.update(notifications =>
      notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    
    this.updateUnreadCount();
  }
  
  /**
   * Marque toutes comme lues
   */
  markAllAsRead(): void {
    this.notificationsSignal.update(notifications =>
      notifications.map(n => ({ ...n, read: true }))
    );
    
    this.unreadCount.set(0);
  }
  
  /**
   * Met à jour le compteur non lu
   */
  private updateUnreadCount(): void {
    const count = this.notificationsSignal().filter(n => !n.read).length;
    this.unreadCount.set(count);
  }
  
  /**
   * Joue un son de notification
   */
  private playNotificationSound(): void {
    const audio = new Audio('/assets/sounds/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Ignorer les erreurs (autoplay policy)
    });
  }
  
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    // Implémenter l'envoi au backend
  }
  
  private handlePushNotification(message: any): void {
    // Traiter la notification push
  }
}