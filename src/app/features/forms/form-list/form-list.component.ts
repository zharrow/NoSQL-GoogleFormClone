// src/app/features/forms/form-list/form-list.component.ts

import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FormService } from '../../../core/services/form.service';
import { ToastService } from '../../../core/services/toast.service';
import { Form, FormStatus, FormUtils } from '../../../core/models/form.model';

type SortOption = 'created' | 'updated' | 'title' | 'responses';
type FilterOption = 'all' | 'active' | 'closed' | 'draft';

@Component({
  selector: 'app-form-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="forms-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">Mes formulaires</h1>
          <p class="page-subtitle">
            Gérez vos formulaires et consultez les réponses
          </p>
        </div>
        <a routerLink="/forms/new" class="btn btn-primary">
          <i class="material-icons">add</i>
          <span>Nouveau formulaire</span>
        </a>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <!-- Search -->
        <div class="search-box">
          <i class="material-icons search-icon">search</i>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange()"
            placeholder="Rechercher un formulaire..."
            class="search-input"
          />
        </div>

        <!-- Filters -->
        <div class="toolbar-actions">
          <!-- Filter dropdown -->
          <div class="dropdown">
            <button 
              class="btn btn-outline"
              (click)="toggleFilterDropdown()"
              [class.active]="filterDropdownOpen()"
            >
              <i class="material-icons">filter_list</i>
              <span>{{ getFilterLabel() }}</span>
              <i class="material-icons">arrow_drop_down</i>
            </button>
            <div class="dropdown-menu" *ngIf="filterDropdownOpen()">
              <button 
                *ngFor="let option of filterOptions"
                class="dropdown-item"
                [class.active]="currentFilter() === option.value"
                (click)="setFilter(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <!-- Sort dropdown -->
          <div class="dropdown">
            <button 
              class="btn btn-outline"
              (click)="toggleSortDropdown()"
              [class.active]="sortDropdownOpen()"
            >
              <i class="material-icons">sort</i>
              <span>{{ getSortLabel() }}</span>
              <i class="material-icons">arrow_drop_down</i>
            </button>
            <div class="dropdown-menu" *ngIf="sortDropdownOpen()">
              <button 
                *ngFor="let option of sortOptions"
                class="dropdown-item"
                [class.active]="currentSort() === option.value"
                (click)="setSort(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats cards -->
      <div class="stats-grid" *ngIf="!formService.loading()">
        <div class="stat-card">
          <i class="material-icons stat-icon">description</i>
          <div class="stat-content">
            <h3 class="stat-value">{{ totalForms() }}</h3>
            <p class="stat-label">Total des formulaires</p>
          </div>
        </div>
        <div class="stat-card">
          <i class="material-icons stat-icon text-success">check_circle</i>
          <div class="stat-content">
            <h3 class="stat-value">{{ activeForms() }}</h3>
            <p class="stat-label">Formulaires actifs</p>
          </div>
        </div>
        <div class="stat-card">
          <i class="material-icons stat-icon text-primary">inbox</i>
          <div class="stat-content">
            <h3 class="stat-value">{{ totalResponses() }}</h3>
            <p class="stat-label">Réponses totales</p>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div class="loading-container" *ngIf="formService.loading()">
        <div class="loading-spinner">
          <i class="material-icons animate-spin">refresh</i>
        </div>
        <p>Chargement des formulaires...</p>
      </div>

      <!-- Empty state -->
      <div 
        class="empty-state" 
        *ngIf="!formService.loading() && filteredForms().length === 0 && !searchQuery"
      >
        <img src="/assets/images/empty-forms.svg" alt="Aucun formulaire" />
        <h2>Aucun formulaire</h2>
        <p>Créez votre premier formulaire pour commencer à collecter des réponses</p>
        <a routerLink="/forms/new" class="btn btn-primary">
          <i class="material-icons">add</i>
          <span>Créer un formulaire</span>
        </a>
      </div>

      <!-- No results -->
      <div 
        class="empty-state" 
        *ngIf="!formService.loading() && filteredForms().length === 0 && searchQuery"
      >
        <i class="material-icons empty-icon">search_off</i>
        <h2>Aucun résultat</h2>
        <p>Aucun formulaire ne correspond à votre recherche</p>
        <button class="btn btn-outline" (click)="clearSearch()">
          Effacer la recherche
        </button>
      </div>

      <!-- Forms grid -->
      <div class="forms-grid" *ngIf="!formService.loading() && filteredForms().length > 0">
        <div 
          *ngFor="let form of filteredForms(); trackBy: trackByFormId"
          class="form-card animate-fadeIn"
          [class.inactive]="!form.is_active"
        >
          <!-- Status badge -->
          <div class="form-status" [class]="'status-' + getFormStatus(form)">
            {{ getFormStatusLabel(form) }}
          </div>

          <!-- Form content -->
          <div class="form-content">
            <h3 class="form-title">
              <a [routerLink]="['/forms', form._id]">{{ form.title }}</a>
            </h3>
            <p class="form-description" *ngIf="form.description">
              {{ form.description }}
            </p>
            <div class="form-meta">
              <span class="meta-item">
                <i class="material-icons">event</i>
                {{ formatDate(form.created_at) }}
              </span>
              <span class="meta-item">
                <i class="material-icons">inbox</i>
                {{ form.response_count }} réponse{{ form.response_count > 1 ? 's' : '' }}
              </span>
            </div>
          </div>

          <!-- Form actions -->
          <div class="form-actions">
            <a 
              [routerLink]="['/forms', form._id, 'edit']"
              class="action-btn"
              title="Modifier"
            >
              <i class="material-icons">edit</i>
            </a>
            <a 
              [routerLink]="['/forms', form._id, 'responses']"
              class="action-btn"
              title="Réponses"
            >
              <i class="material-icons">assessment</i>
            </a>
            <button 
              class="action-btn"
              title="Partager"
              (click)="shareForm(form)"
            >
              <i class="material-icons">share</i>
            </button>
            <button 
              class="action-btn"
              title="Plus d'options"
              (click)="openFormMenu(form)"
            >
              <i class="material-icons">more_vert</i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Context menu -->
    <div 
      class="context-menu" 
      *ngIf="contextMenuOpen()"
      [style.top.px]="contextMenuPosition().y"
      [style.left.px]="contextMenuPosition().x"
    >
      <button class="context-item" (click)="duplicateForm()">
        <i class="material-icons">content_copy</i>
        <span>Dupliquer</span>
      </button>
      <button 
        class="context-item"
        (click)="toggleFormStatus()"
      >
        <i class="material-icons">
          {{ selectedForm()?.is_active ? 'pause' : 'play_arrow' }}
        </i>
        <span>{{ selectedForm()?.is_active ? 'Désactiver' : 'Activer' }}</span>
      </button>
      <div class="context-divider"></div>
      <button class="context-item text-danger" (click)="deleteForm()">
        <i class="material-icons">delete</i>
        <span>Supprimer</span>
      </button>
    </div>
  `,
  styles: [`
    .forms-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    /* Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-content {
      flex: 1;
    }

    .page-title {
      font-size: var(--text-3xl);
      font-weight: var(--font-bold);
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
    }

    .page-subtitle {
      font-size: var(--text-lg);
      color: var(--text-secondary);
      margin: 0;
    }

    /* Toolbar */
    .toolbar {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .search-box {
      position: relative;
      flex: 1;
      min-width: 250px;
    }

    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-tertiary);
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 3rem;
      font-size: var(--text-base);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-primary);
      transition: all var(--transition-fast);
    }

    .search-input:focus {
      outline: none;
      border-color: var(--primary-500);
      box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
    }

    .toolbar-actions {
      display: flex;
      gap: 0.5rem;
    }

    /* Dropdown */
    .dropdown {
      position: relative;
    }

    .dropdown-menu {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      min-width: 200px;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      z-index: var(--z-dropdown);
      animation: fadeInDown var(--transition-fast) ease-out;
    }

    .dropdown-item {
      display: block;
      width: 100%;
      padding: 0.75rem 1rem;
      text-align: left;
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-size: var(--text-sm);
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .dropdown-item:hover {
      background: var(--bg-secondary);
    }

    .dropdown-item.active {
      color: var(--primary-600);
      background: var(--primary-50);
    }

    /* Stats */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      transition: all var(--transition-fast);
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .stat-icon {
      font-size: 48px;
      color: var(--text-tertiary);
    }

    .stat-icon.text-success {
      color: var(--success-500);
    }

    .stat-icon.text-primary {
      color: var(--primary-500);
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: var(--text-2xl);
      font-weight: var(--font-bold);
      color: var(--text-primary);
      margin: 0;
    }

    .stat-label {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      margin: 0;
    }

    /* Loading & Empty states */
    .loading-container,
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
    }

    .loading-spinner {
      font-size: 48px;
      color: var(--primary-500);
      margin-bottom: 1rem;
    }

    .empty-state img {
      width: 200px;
      height: 200px;
      margin-bottom: 2rem;
      opacity: 0.5;
    }

    .empty-icon {
      font-size: 72px;
      color: var(--text-tertiary);
      margin-bottom: 1rem;
    }

    .empty-state h2 {
      font-size: var(--text-2xl);
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
    }

    .empty-state p {
      font-size: var(--text-base);
      color: var(--text-secondary);
      margin: 0 0 2rem 0;
    }

    /* Forms grid */
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

    .form-card.inactive {
      opacity: 0.7;
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

    .form-content {
      margin-bottom: 1rem;
    }

    .form-title {
      font-size: var(--text-xl);
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

    .form-meta {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: var(--text-sm);
      color: var(--text-tertiary);
    }

    .meta-item i {
      font-size: 16px;
    }

    .form-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .action-btn {
      padding: 0.5rem;
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--radius-md);
      color: var(--text-tertiary);
      cursor: pointer;
      transition: all var(--transition-fast);
      text-decoration: none;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .action-btn:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
      border-color: var(--border-color);
    }

    /* Context menu */
    .context-menu {
      position: fixed;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      min-width: 200px;
      z-index: var(--z-popover);
      animation: scaleIn var(--transition-fast) ease-out;
    }

    .context-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.75rem 1rem;
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-size: var(--text-sm);
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .context-item:hover {
      background: var(--bg-secondary);
    }

    .context-item.text-danger {
      color: var(--danger-600);
    }

    .context-divider {
      height: 1px;
      background: var(--border-color);
      margin: 0.5rem 0;
    }

    /* Button styles */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      font-size: var(--text-base);
      font-weight: var(--font-medium);
      border-radius: var(--radius-md);
      border: none;
      cursor: pointer;
      transition: all var(--transition-fast);
      text-decoration: none;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: var(--primary-600);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--primary-700);
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }

    .btn-outline {
      background: transparent;
      color: var(--text-primary);
      border: 1px solid var(--border-color);
    }

    .btn-outline:hover:not(:disabled) {
      background: var(--bg-secondary);
      border-color: var(--border-color-hover);
    }

    .btn-outline.active {
      background: var(--bg-secondary);
      border-color: var(--primary-500);
      color: var(--primary-600);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .toolbar {
        flex-direction: column;
      }

      .search-box {
        width: 100%;
      }

      .toolbar-actions {
        width: 100%;
        justify-content: space-between;
      }

      .forms-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class FormListComponent implements OnInit {
  protected readonly formService = inject(FormService);
  private readonly toastService = inject(ToastService);

  // État local
  searchQuery = '';
  readonly currentFilter = signal<FilterOption>('all');
  readonly currentSort = signal<SortOption>('created');
  readonly filterDropdownOpen = signal(false);
  readonly sortDropdownOpen = signal(false);
  readonly contextMenuOpen = signal(false);
  readonly contextMenuPosition = signal({ x: 0, y: 0 });
  readonly selectedForm = signal<Form | null>(null);

  // Options de filtre et tri
  readonly filterOptions = [
    { value: 'all' as FilterOption, label: 'Tous' },
    { value: 'active' as FilterOption, label: 'Actifs' },
    { value: 'closed' as FilterOption, label: 'Fermés' },
    { value: 'draft' as FilterOption, label: 'Brouillons' }
  ];

  readonly sortOptions = [
    { value: 'created' as SortOption, label: 'Date de création' },
    { value: 'updated' as SortOption, label: 'Dernière modification' },
    { value: 'title' as SortOption, label: 'Titre' },
    { value: 'responses' as SortOption, label: 'Nombre de réponses' }
  ];

  // Computed values
  readonly filteredForms = computed(() => {
    let forms = this.formService.forms();

    // Recherche
    if (this.searchQuery) {
      forms = this.formService.searchForms(this.searchQuery);
    }

    // Filtre
    const filter = this.currentFilter();
    if (filter !== 'all') {
      forms = forms.filter(form => {
        const status = FormUtils.getStatus(form);
        switch (filter) {
          case 'active':
            return status === FormStatus.ACTIVE;
          case 'closed':
            return status === FormStatus.CLOSED;
          case 'draft':
            return status === FormStatus.DRAFT;
          default:
            return true;
        }
      });
    }

    // Tri
    return this.formService.sortForms(this.currentSort(), 'desc');
  });

  readonly totalForms = computed(() => this.formService.formCount());
  readonly activeForms = computed(() => 
    this.formService.forms().filter(f => f.is_active && f.accepts_responses).length
  );
  readonly totalResponses = computed(() => 
    this.formService.forms().reduce((sum, form) => sum + form.response_count, 0)
  );

  ngOnInit(): void {
    // Charger les formulaires
    this.loadForms();

    // Fermer les menus au clic dehors
    document.addEventListener('click', () => {
      this.filterDropdownOpen.set(false);
      this.sortDropdownOpen.set(false);
      this.contextMenuOpen.set(false);
    });
  }

  /**
   * Charge les formulaires
   */
  loadForms(): void {
    this.formService.getUserForms().subscribe({
      error: (error) => {
        this.toastService.error('Erreur lors du chargement des formulaires');
      }
    });
  }

  /**
   * Gestion de la recherche
   */
  onSearchChange(): void {
    // La recherche est gérée par le computed
  }

  clearSearch(): void {
    this.searchQuery = '';
  }

  /**
   * Gestion des filtres
   */
  toggleFilterDropdown(): void {
    this.filterDropdownOpen.update(open => !open);
    this.sortDropdownOpen.set(false);
    event?.stopPropagation();
  }

  setFilter(filter: FilterOption): void {
    this.currentFilter.set(filter);
    this.filterDropdownOpen.set(false);
  }

  getFilterLabel(): string {
    return this.filterOptions.find(o => o.value === this.currentFilter())?.label || 'Filtre';
  }

  /**
   * Gestion du tri
   */
  toggleSortDropdown(): void {
    this.sortDropdownOpen.update(open => !open);
    this.filterDropdownOpen.set(false);
    event?.stopPropagation();
  }

  setSort(sort: SortOption): void {
    this.currentSort.set(sort);
    this.sortDropdownOpen.set(false);
  }

  getSortLabel(): string {
    return this.sortOptions.find(o => o.value === this.currentSort())?.label || 'Trier';
  }

  /**
   * Actions sur les formulaires
   */
  shareForm(form: Form): void {
    const url = `${window.location.origin}/forms/${form._id}/view`;
    navigator.clipboard.writeText(url).then(() => {
      this.toastService.success('Lien copié dans le presse-papier !');
    });
  }

  openFormMenu(form: Form): void {
    event?.stopPropagation();
    this.selectedForm.set(form);
    
    const rect = (event?.target as HTMLElement)?.getBoundingClientRect();
    if (rect) {
      this.contextMenuPosition.set({
        x: rect.left,
        y: rect.bottom + 5
      });
    }
    
    this.contextMenuOpen.set(true);
  }

  duplicateForm(): void {
    const form = this.selectedForm();
    if (!form) return;

    this.formService.duplicateForm(form._id).subscribe({
      next: () => {
        this.toastService.success('Formulaire dupliqué avec succès');
        this.loadForms();
      },
      error: () => {
        this.toastService.error('Erreur lors de la duplication');
      }
    });
    
    this.contextMenuOpen.set(false);
  }

  toggleFormStatus(): void {
    const form = this.selectedForm();
    if (!form) return;

    const update = {
      is_active: !form.is_active,
      accepts_responses: !form.is_active
    };

    this.formService.updateForm(form._id, update).subscribe({
      next: () => {
        this.toastService.success(
          form.is_active ? 'Formulaire désactivé' : 'Formulaire activé'
        );
      },
      error: () => {
        this.toastService.error('Erreur lors de la mise à jour');
      }
    });
    
    this.contextMenuOpen.set(false);
  }

  deleteForm(): void {
    const form = this.selectedForm();
    if (!form) return;

    if (confirm(`Êtes-vous sûr de vouloir supprimer "${form.title}" ?`)) {
      this.formService.deleteForm(form._id).subscribe({
        next: () => {
          this.toastService.success('Formulaire supprimé');
        },
        error: () => {
          this.toastService.error('Erreur lors de la suppression');
        }
      });
    }
    
    this.contextMenuOpen.set(false);
  }

  /**
   * Helpers
   */
  getFormStatus(form: Form): string {
    const status = FormUtils.getStatus(form);
    return status.toLowerCase();
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
    }
  }

  formatDate(date: Date): string {
    return FormUtils.formatCreatedDate(date);
  }

  trackByFormId(index: number, form: Form): string {
    return form._id;
  }
}