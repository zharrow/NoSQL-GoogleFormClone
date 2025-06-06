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
          {{ form.description }}
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
                [min]="question.min_value"
                [max]="question.max_value"
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
    .preview-container {
      max-width: 640px;
      margin: 0 auto;
    }

    /* Form header */
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

    .form-meta {
      font-size: var(--text-sm);
      color: var(--text-tertiary);
    }

    .required-notice {
      color: var(--danger-500);
    }

    /* Questions */
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

    .question-header {
      margin-bottom: 1rem;
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

    .question-description {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.5;
    }

    /* Inputs */
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

    .text-input.error,
    .textarea-input.error,
    .select-input.error,
    .number-input.error,
    .date-input.error {
      border-bottom-color: var(--danger-500);
    }

    .textarea-input {
      resize: vertical;
      min-height: 100px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-secondary);
    }

    .number-input {
      max-width: 200px;
    }

    .date-input {
      max-width: 200px;
    }

    /* Options */
    .options-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .radio-option,
    .checkbox-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: var(--radius-md);
      transition: background var(--transition-fast);
    }

    .radio-option:hover,
    .checkbox-option:hover {
      background: var(--bg-secondary);
    }

    .radio-option input[type="radio"],
    .checkbox-option input[type="checkbox"] {
      position: absolute;
      opacity: 0;
      cursor: pointer;
    }

    .radio-custom,
    .checkbox-custom {
      width: 20px;
      height: 20px;
      border: 2px solid var(--border-color);
      border-radius: 50%;
      position: relative;
      transition: all var(--transition-fast);
    }

    .checkbox-custom {
      border-radius: var(--radius-sm);
    }

    .radio-option input:checked ~ .radio-custom {
      border-color: var(--primary-500);
      background: var(--primary-500);
    }

    .radio-option input:checked ~ .radio-custom::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 8px;
      height: 8px;
      background: white;
      border-radius: 50%;
    }

    .checkbox-option input:checked ~ .checkbox-custom {
      border-color: var(--primary-500);
      background: var(--primary-500);
    }

    .checkbox-option input:checked ~ .checkbox-custom::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 6px;
      width: 4px;
      height: 8px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }

    .option-text {
      font-size: var(--text-base);
      color: var(--text-primary);
    }

    /* Error message */
    .error-message {
      font-size: var(--text-xs);
      color: var(--danger-500);
      margin-top: 0.5rem;
    }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: var(--bg-primary);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
    }

    .empty-icon {
      font-size: 48px;
      color: var(--text-tertiary);
      margin-bottom: 1rem;
    }

    .empty-state p {
      font-size: var(--text-base);
      color: var(--text-secondary);
      margin: 0;
    }

    /* Form actions */
    .form-actions {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border-color);
    }

    /* Buttons */
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

    /* Responsive */
    @media (max-width: 640px) {
      .form-header {
        padding: 1.5rem;
      }

      .question-card {
        padding: 1rem;
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