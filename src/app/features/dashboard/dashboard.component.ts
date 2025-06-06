// src/app/features/dashboard/dashboard.component.ts

import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormService } from '../../core/services/form.service';
import { AuthService } from '../../core/services/auth.service';
import { Form, FormUtils, FormStatus } from '../../core/models/form.model';

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
            [class.inactive]="!form.is_active"
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
    /* Styles restent identiques - uniquement correction du TypeScript */
    .dashboard-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

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

    /* ... autres styles identiques ... */
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
      case FormStatus.ACTIVE: 
        return 'Actif';
      case FormStatus.CLOSED: 
        return 'Fermé';
      case FormStatus.DRAFT: 
        return 'Brouillon';
      case FormStatus.ARCHIVED:
        return 'Archivé';
      default: 
        return status;
    }
  }

  formatDate(date: Date): string {
    return FormUtils.formatCreatedDate(date);
  }

  trackByFormId(index: number, form: Form): string {
    return form._id;
  }
}