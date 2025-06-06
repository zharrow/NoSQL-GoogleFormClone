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

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  color: 'primary' | 'secondary' | 'tertiary' | 'quaternary';
  badge?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  protected readonly formService = inject(FormService);
  private readonly authService = inject(AuthService);

  // État réactif
  readonly isLoading = signal(false);
  
  readonly username = computed(() => 
    this.authService.currentUser()?.username || 'Utilisateur'
  );

  readonly fullName = computed(() => 
    this.authService.currentUser()?.full_name || this.username()
  );

  readonly stats = computed<DashboardStats>(() => {
    const forms = this.formService.forms();
    
    return {
      totalForms: forms.length,
      activeForms: forms.filter(f => f.is_active && f.accepts_responses).length,
      totalResponses: forms.reduce((sum, f) => sum + f.response_count, 0),
      recentResponses: this.calculateRecentResponses(forms)
    };
  });

  readonly recentForms = computed(() => {
    const forms = [...this.formService.forms()];
    return forms
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 6);
  });

  readonly quickActions: QuickAction[] = [
    {
      id: 'create-form',
      title: 'Créer un formulaire',
      description: 'Commencez rapidement avec un nouveau formulaire',
      icon: 'add_circle_outline',
      route: '/forms/new',
      color: 'primary'
    },
    {
      id: 'browse-forms',
      title: 'Mes formulaires',
      description: 'Gérez tous vos formulaires existants',
      icon: 'folder_open',
      route: '/forms',
      color: 'secondary'
    },
    {
      id: 'templates',
      title: 'Modèles',
      description: 'Utilisez des modèles prêts à l\'emploi',
      icon: 'library_books',
      route: '/templates',
      color: 'tertiary',
      badge: 'Nouveau'
    },
    {
      id: 'analytics',
      title: 'Analytiques',
      description: 'Analysez les performances de vos formulaires',
      icon: 'analytics',
      route: '/analytics',
      color: 'quaternary'
    }
  ];

  ngOnInit(): void {
    this.loadDashboardData();
  }

  public async loadDashboardData(): Promise<void> {
    this.isLoading.set(true);
    
    try {
      await this.formService.getUserForms().toPromise();
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private calculateRecentResponses(forms: Form[]): number {
    // Simulation - en réalité, cela viendrait de l'API
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return forms
      .filter(f => new Date(f.updated_at) >= sevenDaysAgo)
      .reduce((sum, f) => sum + Math.floor(f.response_count * 0.3), 0);
  }

  // Méthodes d'affichage
  getFormStatus(form: Form): string {
    return FormUtils.getStatus(form).toLowerCase();
  }

  getFormStatusLabel(form: Form): string {
    const statusLabels = {
      [FormStatus.ACTIVE]: 'Actif',
      [FormStatus.CLOSED]: 'Fermé', 
      [FormStatus.DRAFT]: 'Brouillon',
      [FormStatus.ARCHIVED]: 'Archivé'
    };
    
    return statusLabels[FormUtils.getStatus(form)] || 'Inconnu';
  }

  formatDate(date: Date): string {
    return FormUtils.formatCreatedDate(date);
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  getStatPercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  trackByFormId(_: number, form: Form): string {
    return form._id;
  }

  trackByActionId(_: number, action: QuickAction): string {
    return action.id;
  }
}