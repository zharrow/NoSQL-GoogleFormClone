// src/app/features/dashboard/dashboard.component.ts

import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormService } from '../../core/services/form.service';
import { AuthService } from '../../core/services/auth.service';
import { Form, FormUtils } from '../../core/models/form.model';

interface DashboardStats {
  totalForms: number;
  activeForms: number;
  totalResponses: number;
  recentResponses: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-container">
      <!-- Welcome section -->
      <section class="welcome-section">
        <h1 class="welcome-title">
          Bonjour {{ username() }} 👋
        </h1>
        <p class="welcome-subtitle">
          Voici un aperçu de vos formulaires et de leur activité
        </p>
      </section>

      <!-- Stats grid -->
      <section class="stats-section">
        <div class="stats-grid">
          <div class="stat-card primary animate-fadeIn">
            <div class="stat-icon">
              <i class="material-icons">description</i>
            </div>
            <div class="stat-content">
              <h3 class="stat-value">{{ stats().totalForms }}</h3>
              <p class="stat-label">Formulaires créés</p>
            </div>
          </div>

          <div class="stat-card success animate-fadeIn" style="animation-delay: 0.1s">
            <div class="stat-icon">
              <i class="material-icons">check_circle</i>
            </div>
            <div class="stat-content">
              <h3 class="stat-value">{{ stats().activeForms }}</h3>
              <p class="stat-label">Formulaires actifs</p>
            </div>
          </div>

          <div class="stat-card info animate-fadeIn" style="animation-delay: 0.2s">
            <div class="stat-icon">
              <i class="material-icons">inbox</i>
            </div>
            <div class="stat-content">
              <h3 class="stat-value">{{ stats().totalResponses }}</h3>
              <p class="stat-label">Réponses totales</p>
            </div>
          </div>

          <div class="stat-card warning animate-fadeIn" style="animation-delay: 0.3s">
            <div class="stat-icon">
              <i class="material-icons">schedule</i>
            </div>
            <div class="stat-content">
              <h3 class="stat-value">{{ stats().recentResponses }}</h3>
              <p class="stat-label">Réponses (7 derniers jours)</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Quick actions -->
      <section class="actions-section">
        <h2 class="section-title">Actions rapides</h2>
        <div class="actions-grid">
          <a routerLink="/forms/new" class="action-card primary">
            <i class="material-icons">add_circle</i>
            <span>Créer un formulaire</span>
          </a>
          <a routerLink="/forms" class="action-card secondary">
            <i class="material-icons">folder_open</i>
            <span>Voir tous les formulaires</span>
          </a>
          <a routerLink="/templates" class="action-card tertiary">
            <i class="material-icons">library_books</i>
            <span>Explorer les modèles</span>
          </a>
          <a routerLink="/help" class="action-card quaternary">
            <i class="material-icons">help_outline</i>
            <span>Centre d'aide</span>
          </a>
        </div>
      </section>

      <!-- Recent forms -->
      <section class="recent-section" *ngIf="recentForms().length > 0">
        <div class="section-header">
          <h2 class="section-title">Formulaires récents</h2>
          <a routerLink="/forms" class="view-all-link">
            Voir tout
            <i class="material-icons">arrow_forward</i>
          </a>
        </div>

        <div class="forms-grid">
          <div 
            *ngFor="let form of recentForms(); trackBy: trackByFormId"
            class="form-card animate-fadeInUp"
          >
            <div class="form-status" [class]="'status-' + getFormStatus(form)">
              {{ getFormStatusLabel(form) }}
            </div>

            <h3 class="form-title">
              <a [routerLink]="['/forms', form._id]">{{ form.title }}</a>
            </h3>
            
            <p class="form-description" *ngIf="form.description">
              {{ form.description }}
            </p>

            <div class="form-stats">
              <div class="form-stat">
                <i class="material-icons">inbox</i>
                <span>{{ form.response_count }} réponses</span>
              </div>
              <div class="form-stat">
                <i class="material-icons">event</i>
                <span>{{ formatDate(form.created_at) }}</span>
              </div>
            </div>

            <div class="form-actions">
              <a 
                [routerLink]="['/forms', form._id, 'edit']" 
                class="btn btn-sm btn-outline"
              >
                <i class="material-icons">edit</i>
                Modifier
              </a>
              <a 
                [routerLink]="['/forms', form._id, 'responses']" 
                class="btn btn-sm btn-primary"
              >
                <i class="material-icons">assessment</i>
                Réponses
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Empty state -->
      <section class="empty-section" *ngIf="recentForms().length === 0 && !formService.loading()">
        <div class="empty-state">
          <img src="/assets/images/empty-dashboard.svg" alt="Aucun formulaire" />
          <h2>Créez votre premier formulaire</h2>
          <p>Commencez à collecter des réponses en quelques minutes</p>
          <a routerLink="/forms/new" class="btn btn-primary btn-lg">
            <i class="material-icons">add</i>
            <span>Créer un formulaire</span>
          </a>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    /* Welcome section */
    .welcome-section {
      margin-bottom: 3rem;
    }

    .welcome-title {
      font-size: var(--text-3xl);
      font-weight: var(--font-bold);
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
    }

    .welcome-subtitle {
      font-size: var(--text-lg);
      color: var(--text-secondary);
      margin: 0;
    }

    /* Stats section */
    .stats-section {
      margin-bottom: 3rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .stat-card {
      background: var(--bg-primary);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: all var(--transition-fast);
      box-shadow: var(--shadow-sm);
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .stat-card.primary {
      border-top: 4px solid var(--primary-500);
    }

    .stat-card.success {
      border-top: 4px solid var(--success-500);
    }

    .stat-card.info {
      border-top: 4px solid var(--primary-400);
    }

    .stat-card.warning {
      border-top: 4px solid var(--warning-500);
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-secondary);
    }

    .stat-card.primary .stat-icon {
      background: var(--primary-50);
      color: var(--primary-600);
    }

    .stat-card.success .stat-icon {
      background: var(--success-50);
      color: var(--success-600);
    }

    .stat-card.info .stat-icon {
      background: rgba(66, 165, 245, 0.1);
      color: var(--primary-400);
    }

    .stat-card.warning .stat-icon {
      background: var(--warning-50);
      color: var(--warning-600);
    }

    .stat-icon i {
      font-size: 32px;
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: var(--text-3xl);
      font-weight: var(--font-bold);
      color: var(--text-primary);
      margin: 0;
    }

    .stat-label {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      margin: 0;
    }

    /* Actions section */
    .actions-section {
      margin-bottom: 3rem;
    }

    .section-title {
      font-size: var(--text-xl);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
      margin: 0 0 1.5rem 0;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .action-card {
      background: var(--bg-primary);
      border: 2px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      text-align: center;
      text-decoration: none;
      color: var(--text-primary);
      transition: all var(--transition-fast);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }

    .action-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .action-card.primary:hover {
      border-color: var(--primary-500);
      background: var(--primary-50);
    }

    .action-card.secondary:hover {
      border-color: var(--success-500);
      background: var(--success-50);
    }

    .action-card.tertiary:hover {
      border-color: var(--warning-500);
      background: var(--warning-50);
    }

    .action-card.quaternary:hover {
      border-color: var(--gray-500);
      background: var(--gray-50);
    }

    .action-card i {
      font-size: 48px;
      color: var(--text-tertiary);
    }

    .action-card.primary i {
      color: var(--primary-500);
    }

    .action-card.secondary i {
      color: var(--success-500);
    }

    .action-card.tertiary i {
      color: var(--warning-500);
    }

    .action-card span {
      font-size: var(--text-base);
      font-weight: var(--font-medium);
    }

    /* Recent section */
    .recent-section {
      margin-bottom: 3rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .view-all-link {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: var(--primary-600);
      text-decoration: none;
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      transition: color var(--transition-fast);
    }

    .view-all-link:hover {
      color: var(--primary-700);
    }

    .view-all-link i {
      font-size: 18px;
    }

    .forms-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .form-card {
      position: relative;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      transition: all var(--transition-fast);
    }

    .form-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .form-status {
      position: absolute;
      top: 1rem;
      right: 1rem;
      padding: 0.25rem 0.75rem;
      font-size: var(--text-xs);
      font-weight: var(--font-medium);
      border-radius: var(--radius-full);
      text-transform: uppercase;
    }

    .status-active {
      background: var(--success-50);
      color: var(--success-700);
    }

    .status-closed {
      background: var(--warning-50);
      color: var(--warning-700);
    }

    .status-draft {
      background: var(--gray-100);
      color: var(--gray-600);
    }

    .form-title {
      font-size: var(--text-lg);
      font-weight: var(--font-semibold);
      margin: 0 0 0.5rem 0;
    }

    .form-title a {
      color: var(--text-primary);
      text-decoration: none;
      transition: color var(--transition-fast);
    }

    .form-title a:hover {
      color: var(--primary-600);
    }

    .form-description {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      margin: 0 0 1rem 0;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .form-stats {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 1rem;
    }

    .form-stat {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: var(--text-sm);
      color: var(--text-tertiary);
    }

    .form-stat i {
      font-size: 16px;
    }

    .form-actions {
      display: flex;
      gap: 0.5rem;
    }

    /* Empty state */
    .empty-section {
      text-align: center;
      padding: 4rem 2rem;
    }

    .empty-state img {
      width: 240px;
      height: 240px;
      margin-bottom: 2rem;
      opacity: 0.6;
    }

    .empty-state h2 {
      font-size: var(--text-2xl);
      font-weight: var(--font-bold);
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
    }

    .empty-state p {
      font-size: var(--text-base);
      color: var(--text-secondary);
      margin: 0 0 2rem 0;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      border-radius: var(--radius-md);
      border: none;
      cursor: pointer;
      transition: all var(--transition-fast);
      text-decoration: none;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: var(--text-xs);
    }

    .btn-lg {
      padding: 0.75rem 1.5rem;
      font-size: var(--text-base);
    }

    .btn-primary {
      background: var(--primary-600);
      color: white;
    }

    .btn-primary:hover {
      background: var(--primary-700);
    }

    .btn-outline {
      background: transparent;
      color: var(--text-primary);
      border: 1px solid var(--border-color);
    }

    .btn-outline:hover {
      background: var(--bg-secondary);
      border-color: var(--border-color-hover);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .dashboard-container {
        padding: 1rem;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .actions-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .forms-grid {
        grid-template-columns: 1fr;
      }

      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
    }

    @media (max-width: 480px) {
      .actions-grid {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
      }

      .btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  protected readonly formService = inject(FormService);
  private readonly authService = inject(AuthService);

  // État
  readonly username = computed(() => 
    this.authService.currentUser()?.username || 'Utilisateur'
  );

  readonly stats = computed<DashboardStats>(() => {
    const forms = this.formService.forms();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      totalForms: forms.length,
      activeForms: forms.filter(f => f.is_active && f.accepts_responses).length,
      totalResponses: forms.reduce((sum, f) => sum + f.response_count, 0),
      recentResponses: 0 // TODO: Implémenter avec une API qui retourne les stats récentes
    };
  });

  readonly recentForms = computed(() => {
    const forms = [...this.formService.forms()];
    return forms
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 6);
  });

  ngOnInit(): void {
    // Charger les formulaires
    this.formService.getUserForms().subscribe();
  }

  /**
   * Helpers pour l'affichage
   */
  getFormStatus(form: Form): string {
    return FormUtils.getStatus(form).toLowerCase();
  }

  getFormStatusLabel(form: Form): string {
    const status = FormUtils.getStatus(form);
    switch (status) {
      case 'ACTIVE': return 'Actif';
      case 'CLOSED': return 'Fermé';
      case 'DRAFT': return 'Brouillon';
      default: return status;
    }
  }

  formatDate(date: Date): string {
    return FormUtils.formatCreatedDate(date);
  }

  trackByFormId(index: number, form: Form): string {
    return form._id;
  }
}