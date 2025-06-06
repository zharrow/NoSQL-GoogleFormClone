// src/app/shared/components/toast/toast.component.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div
        *ngFor="let toast of toastService.toasts(); trackBy: trackByToastId"
        [@slideIn]
        [class]="getToastClass(toast)"
        class="toast animate-fadeInUp"
      >
        <div class="toast-icon">
          <i class="material-icons">{{ getIcon(toast.type) }}</i>
        </div>
        
        <div class="toast-content">
          <h4 *ngIf="toast.title" class="toast-title">{{ toast.title }}</h4>
          <p class="toast-message">{{ toast.message }}</p>
        </div>
        
        <button
          *ngIf="toast.closable"
          class="toast-close"
          (click)="removeToast(toast.id)"
          aria-label="Fermer"
        >
          <i class="material-icons">close</i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: var(--z-tooltip);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      min-width: 300px;
      max-width: 500px;
      padding: 1rem;
      background: var(--bg-primary);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      pointer-events: all;
      transition: all var(--transition-base);
    }

    .toast-icon {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      margin-right: 0.75rem;
    }

    .toast-icon i {
      font-size: 24px;
    }

    .toast-content {
      flex: 1;
      min-width: 0;
    }

    .toast-title {
      margin: 0 0 0.25rem 0;
      font-size: var(--text-base);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
    }

    .toast-message {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--text-secondary);
      word-wrap: break-word;
    }

    .toast-close {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      margin-left: 0.75rem;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: var(--radius-md);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-tertiary);
      transition: all var(--transition-fast);
    }

    .toast-close:hover {
      background: rgba(0, 0, 0, 0.05);
      color: var(--text-primary);
    }

    .toast-close i {
      font-size: 20px;
    }

    /* Toast types */
    .toast-success {
      border-left: 4px solid var(--success-500);
    }

    .toast-success .toast-icon {
      color: var(--success-500);
    }

    .toast-error {
      border-left: 4px solid var(--danger-500);
    }

    .toast-error .toast-icon {
      color: var(--danger-500);
    }

    .toast-warning {
      border-left: 4px solid var(--warning-500);
    }

    .toast-warning .toast-icon {
      color: var(--warning-500);
    }

    .toast-info {
      border-left: 4px solid var(--primary-500);
    }

    .toast-info .toast-icon {
      color: var(--primary-500);
    }

    /* Dark mode */
    [data-theme="dark"] .toast {
      background: var(--bg-secondary);
      border-color: var(--border-color);
    }

    [data-theme="dark"] .toast-close:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    /* Mobile responsive */
    @media (max-width: 640px) {
      .toast-container {
        left: 1rem;
        right: 1rem;
      }

      .toast {
        min-width: auto;
        width: 100%;
      }
    }
  `],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('200ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class ToastComponent {
  protected readonly toastService = inject(ToastService);

  /**
   * Track by function pour optimiser les performances
   */
  trackByToastId(index: number, toast: Toast): string {
    return toast.id;
  }

  /**
   * Obtient les classes CSS pour un toast
   */
  getToastClass(toast: Toast): string {
    return `toast toast-${toast.type}`;
  }

  /**
   * Obtient l'icône pour un type de toast
   */
  getIcon(type: string): string {
    return ToastService.getIcon(type as any);
  }

  /**
   * Supprime un toast
   */
  removeToast(id: string): void {
    this.toastService.remove(id);
  }
}