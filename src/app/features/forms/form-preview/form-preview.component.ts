// src/app/features/forms/form-preview/form-preview.component.ts

import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Form } from '../../../core/models/form.model';
import { Question, QuestionType, QuestionUtils } from '../../../core/models/question.model';
import { AnswerDraft } from '../../../core/models/answer.model';

@Component({
  selector: 'app-form-preview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="preview-container">
      <!-- Form header -->
      <div class="form-header">
        <h1 class="form-title">{{ form?.title || 'Formulaire sans titre' }}</h1>
        <p class="form-description" *ngIf="form?.description">
          {{ form?.description }}
        </p>
        <div class="form-meta">
          <span class="required-notice">* Questions obligatoires</span>
        </div>
      </div>

      <!-- Questions -->
      <div class="questions-container" *ngIf="questions.length > 0">
        <div 
          *ngFor="let question of questions; let i = index"
          class="question-card animate-fadeIn"
        >
          <div class="question-header">
            <h3 class="question-title">
              {{ question.title || 'Question sans titre' }}
              <span class="required-mark" *ngIf="question.is_required">*</span>
            </h3>
            <p class="question-description" *ngIf="question.description">
              {{ question.description }}
            </p>
          </div>

          <div class="question-content">
            <!-- Short text -->
            <div *ngIf="question.question_type === QuestionType.SHORT_TEXT">
              <input
                type="text"
                [(ngModel)]="answers()[question._id]"
                (ngModelChange)="updateAnswer(question, $event)"
                placeholder="Votre réponse"
                class="text-input"
                [class.error]="hasError(question._id)"
              />
            </div>

            <!-- Long text -->
            <div *ngIf="question.question_type === QuestionType.LONG_TEXT">
              <textarea
                [(ngModel)]="answers()[question._id]"
                (ngModelChange)="updateAnswer(question, $event)"
                placeholder="Votre réponse"
                class="textarea-input"
                [class.error]="hasError(question._id)"
                rows="4"
              ></textarea>
            </div>

            <!-- Multiple choice -->
            <div 
              *ngIf="question.question_type === QuestionType.MULTIPLE_CHOICE"
              class="options-list"
            >
              <label 
                *ngFor="let option of question.options"
                class="radio-option"
              >
                <input
                  type="radio"
                  [name]="'question-' + question._id"
                  [value]="option"
                  [(ngModel)]="answers()[question._id]"
                  (ngModelChange)="updateAnswer(question, $event)"
                />
                <span class="radio-custom"></span>
                <span class="option-text">{{ option }}</span>
              </label>
            </div>

            <!-- Checkbox -->
            <div 
              *ngIf="question.question_type === QuestionType.CHECKBOX"
              class="options-list"
            >
              <label 
                *ngFor="let option of question.options"
                class="checkbox-option"
              >
                <input
                  type="checkbox"
                  [value]="option"
                  [checked]="isChecked(question._id, option)"
                  (change)="toggleCheckbox(question, option)"
                />
                <span class="checkbox-custom"></span>
                <span class="option-text">{{ option }}</span>
              </label>
            </div>

            <!-- Dropdown -->
            <div *ngIf="question.question_type === QuestionType.DROPDOWN">
              <select
                [(ngModel)]="answers()[question._id]"
                (ngModelChange)="updateAnswer(question, $event)"
                class="select-input"
                [class.error]="hasError(question._id)"
              >
                <option value="" disabled>Choisir une option</option>
                <option 
                  *ngFor="let option of question.options"
                  [value]="option"
                >
                  {{ option }}
                </option>
              </select>
            </div>

            <!-- Number -->
            <div *ngIf="question.question_type === QuestionType.NUMBER">
              <input
                type="number"
                [(ngModel)]="answers()[question._id]"
                (ngModelChange)="updateAnswer(question, $event)"
                placeholder="Votre réponse"
                class="number-input"
                [class.error]="hasError(question._id)"
                [min]="question.min_value ?? null"
                [max]="question.max_value ?? null"
              />
            </div>

            <!-- Date -->
            <div *ngIf="question.question_type === QuestionType.DATE">
              <input
                type="date"
                [(ngModel)]="answers()[question._id]"
                (ngModelChange)="updateAnswer(question, $event)"
                class="date-input"
                [class.error]="hasError(question._id)"
              />
            </div>

            <!-- Email -->
            <div *ngIf="question.question_type === QuestionType.EMAIL">
              <input
                type="email"
                [(ngModel)]="answers()[question._id]"
                (ngModelChange)="updateAnswer(question, $event)"
                placeholder="votre.email@example.com"
                class="text-input"
                [class.error]="hasError(question._id)"
              />
            </div>

            <!-- Error message -->
            <div 
              class="error-message" 
              *ngIf="errors()[question._id]"
            >
              {{ errors()[question._id] }}
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div class="empty-state" *ngIf="questions.length === 0">
        <i class="material-icons empty-icon">quiz</i>
        <p>Aucune question n'a été ajoutée</p>
      </div>

      <!-- Form actions -->
      <div class="form-actions" *ngIf="questions.length > 0">
        <button class="btn btn-outline" (click)="clearForm()">
          Effacer le formulaire
        </button>
        <button 
          class="btn btn-primary" 
          (click)="submitForm()"
          [disabled]="!isFormValid()"
        >
          Soumettre
        </button>
      </div>
    </div>
  `,
  styles: [`
    /* Styles restent identiques - voir fichier précédent */
    .preview-container {
      max-width: 640px;
      margin: 0 auto;
    }

    .form-header {
      background: var(--bg-primary);
      border-radius: var(--radius-lg);
      padding: 2rem;
      margin-bottom: 1.5rem;
      border-top: 8px solid var(--primary-500);
    }

    .form-title {
      font-size: var(--text-2xl);
      font-weight: var(--font-bold);
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
    }

    .form-description {
      font-size: var(--text-base);
      color: var(--text-secondary);
      margin: 0 0 1rem 0;
      line-height: 1.6;
    }

    .required-notice {
      color: var(--danger-500);
    }

    .questions-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .question-card {
      background: var(--bg-primary);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      border: 1px solid var(--border-color);
    }

    .question-title {
      font-size: var(--text-base);
      font-weight: var(--font-medium);
      color: var(--text-primary);
      margin: 0 0 0.25rem 0;
    }

    .required-mark {
      color: var(--danger-500);
      margin-left: 0.25rem;
    }

    .text-input,
    .textarea-input,
    .select-input,
    .number-input,
    .date-input {
      width: 100%;
      padding: 0.75rem;
      font-size: var(--text-base);
      border: none;
      border-bottom: 1px solid var(--border-color);
      background: transparent;
      color: var(--text-primary);
      transition: border-color var(--transition-fast);
    }

    .text-input:focus,
    .textarea-input:focus,
    .select-input:focus,
    .number-input:focus,
    .date-input:focus {
      outline: none;
      border-bottom-color: var(--primary-500);
    }

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
    }

    .btn-primary {
      background: var(--primary-600);
      color: white;
    }

    .btn-outline {
      background: transparent;
      color: var(--text-primary);
      border: 1px solid var(--border-color);
    }
  `]
})
export class FormPreviewComponent {
  @Input() form: Form | null = null;
  @Input() questions: Question[] = [];

  // État local
  readonly answers = signal<Record<string, any>>({});
  readonly errors = signal<Record<string, string>>({});

  QuestionType = QuestionType; // Pour utiliser dans le template

  /**
   * Met à jour une réponse et valide
   */
  updateAnswer(question: Question, value: any): void {
    this.answers.update(answers => ({
      ...answers,
      [question._id]: value
    }));

    // Valider la réponse
    const error = QuestionUtils.validateAnswer(question, value);
    this.errors.update(errors => {
      if (error) {
        return { ...errors, [question._id]: error };
      } else {
        const { [question._id]: _, ...rest } = errors;
        return rest;
      }
    });
  }

  /**
   * Gère les checkbox (multiple values)
   */
  toggleCheckbox(question: Question, option: string): void {
    const current = this.answers()[question._id] || [];
    const updated = current.includes(option)
      ? current.filter((o: string) => o !== option)
      : [...current, option];
    
    this.updateAnswer(question, updated);
  }

  /**
   * Vérifie si une option est cochée
   */
  isChecked(questionId: string, option: string): boolean {
    const values = this.answers()[questionId];
    return Array.isArray(values) && values.includes(option);
  }

  /**
   * Vérifie si une question a une erreur
   */
  hasError(questionId: string): boolean {
    return !!this.errors()[questionId];
  }

  /**
   * Vérifie si le formulaire est valide
   */
  isFormValid(): boolean {
    // Vérifier que toutes les questions obligatoires ont une réponse
    for (const question of this.questions) {
      if (question.is_required) {
        const answer = this.answers()[question._id];
        const error = QuestionUtils.validateAnswer(question, answer);
        if (error) return false;
      }
    }

    // Vérifier qu'il n'y a pas d'erreurs
    return Object.keys(this.errors()).length === 0;
  }

  /**
   * Efface le formulaire
   */
  clearForm(): void {
    if (confirm('Êtes-vous sûr de vouloir effacer toutes vos réponses ?')) {
      this.answers.set({});
      this.errors.set({});
    }
  }

  /**
   * Soumet le formulaire (pour la preview)
   */
  submitForm(): void {
    // Valider toutes les questions
    let hasErrors = false;
    const errors: Record<string, string> = {};

    for (const question of this.questions) {
      const answer = this.answers()[question._id];
      const error = QuestionUtils.validateAnswer(question, answer);
      if (error) {
        errors[question._id] = error;
        hasErrors = true;
      }
    }

    if (hasErrors) {
      this.errors.set(errors);
      alert('Veuillez corriger les erreurs avant de soumettre');
      return;
    }

    alert('Formulaire valide ! (Mode preview - pas de soumission réelle)');
  }
}