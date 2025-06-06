// src/app/features/forms/question-editor/question-editor.component.ts

import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { 
  Question, 
  QuestionType, 
  QuestionUpdate,
  QUESTION_TYPE_CONFIG 
} from '../../../core/models/question.model';
import { QuestionService } from '../../../core/services/question.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-question-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="editor-container" @slideDown>
      <form [formGroup]="questionForm" (ngSubmit)="saveQuestion()">
        <!-- Question title -->
        <div class="form-field">
          <input
            type="text"
            formControlName="title"
            placeholder="Titre de la question"
            class="question-input"
            [class.error]="isFieldInvalid('title')"
            autofocus
          />
          <div *ngIf="isFieldInvalid('title')" class="error-message">
            Le titre est requis
          </div>
        </div>

        <!-- Question description -->
        <div class="form-field">
          <textarea
            formControlName="description"
            placeholder="Description (optionnelle)"
            class="description-input"
            rows="2"
          ></textarea>
        </div>

        <!-- Options for choice questions -->
        <div 
          class="options-section" 
          *ngIf="hasOptions()"
          formArrayName="options"
        >
          <label class="section-label">Options</label>
          
          <div 
            *ngFor="let option of optionsArray.controls; let i = index"
            class="option-row"
          >
            <span class="option-icon">
              <i class="material-icons">{{ getOptionIcon() }}</i>
            </span>
            <input
              type="text"
              [formControlName]="i"
              [placeholder]="'Option ' + (i + 1)"
              class="option-input"
              [class.error]="isOptionInvalid(i)"
            />
            <button
              type="button"
              class="btn-icon"
              (click)="removeOption(i)"
              [disabled]="optionsArray.length <= 1"
              title="Supprimer l'option"
            >
              <i class="material-icons">close</i>
            </button>
          </div>
          
          <button
            type="button"
            class="add-option-btn"
            (click)="addOption()"
          >
            <i class="material-icons">add</i>
            <span>Ajouter une option</span>
          </button>
        </div>

        <!-- Validation settings -->
        <div class="validation-section" *ngIf="hasValidation()">
          <label class="section-label">Validation</label>
          
          <!-- Text validation -->
          <div 
            class="validation-row" 
            *ngIf="isTextQuestion()"
          >
            <div class="validation-field">
              <label>Longueur minimale</label>
              <input
                type="number"
                formControlName="min_length"
                min="0"
                class="validation-input"
              />
            </div>
            <div class="validation-field">
              <label>Longueur maximale</label>
              <input
                type="number"
                formControlName="max_length"
                min="1"
                class="validation-input"
              />
            </div>
          </div>

          <!-- Number validation -->
          <div 
            class="validation-row" 
            *ngIf="question.question_type === QuestionType.NUMBER"
          >
            <div class="validation-field">
              <label>Valeur minimale</label>
              <input
                type="number"
                formControlName="min_value"
                class="validation-input"
              />
            </div>
            <div class="validation-field">
              <label>Valeur maximale</label>
              <input
                type="number"
                formControlName="max_value"
                class="validation-input"
              />
            </div>
          </div>
        </div>

        <!-- Question settings -->
        <div class="settings-section">
          <label class="toggle-setting">
            <input type="checkbox" formControlName="is_required" />
            <span class="toggle-label">Question obligatoire</span>
          </label>
        </div>

        <!-- Actions -->
        <div class="editor-actions">
          <button
            type="button"
            class="btn btn-outline"
            (click)="cancel.emit()"
          >
            Annuler
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="questionForm.invalid || isSaving"
          >
            {{ isSaving ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .editor-container {
      background: var(--bg-primary);
      border: 2px solid var(--primary-500);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      box-shadow: var(--shadow-lg);
    }

    .form-field {
      margin-bottom: 1rem;
    }

    .question-input,
    .description-input,
    .option-input,
    .validation-input {
      width: 100%;
      padding: 0.75rem;
      font-size: var(--text-base);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-primary);
      color: var(--text-primary);
      transition: all var(--transition-fast);
    }

    .question-input {
      font-weight: var(--font-medium);
    }

    .description-input {
      resize: vertical;
      min-height: 60px;
    }

    .question-input:focus,
    .description-input:focus,
    .option-input:focus,
    .validation-input:focus {
      outline: none;
      border-color: var(--primary-500);
      box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
    }

    .question-input.error,
    .option-input.error {
      border-color: var(--danger-500);
    }

    .error-message {
      font-size: var(--text-xs);
      color: var(--danger-500);
      margin-top: 0.25rem;
    }

    /* Options section */
    .options-section,
    .validation-section,
    .settings-section {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
    }

    .section-label {
      display: block;
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      color: var(--text-secondary);
      margin-bottom: 0.75rem;
    }

    .option-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .option-icon {
      color: var(--text-tertiary);
      display: flex;
      align-items: center;
    }

    .option-icon i {
      font-size: 20px;
    }

    .option-input {
      flex: 1;
    }

    .add-option-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: transparent;
      border: 1px dashed var(--border-color);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-size: var(--text-sm);
      cursor: pointer;
      transition: all var(--transition-fast);
      margin-top: 0.5rem;
    }

    .add-option-btn:hover {
      border-color: var(--primary-500);
      color: var(--primary-500);
      background: var(--primary-50);
    }

    /* Validation section */
    .validation-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .validation-field {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .validation-field label {
      font-size: var(--text-xs);
      color: var(--text-secondary);
    }

    .validation-input {
      padding: 0.5rem;
      font-size: var(--text-sm);
    }

    /* Settings section */
    .toggle-setting {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .toggle-label {
      font-size: var(--text-sm);
      color: var(--text-primary);
    }

    /* Actions */
    .editor-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
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

    .btn-icon {
      width: 32px;
      height: 32px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      border-radius: var(--radius-md);
      color: var(--text-tertiary);
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .btn-icon:hover:not(:disabled) {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }

    .btn-icon:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    /* Responsive */
    @media (max-width: 640px) {
      .editor-container {
        padding: 1rem;
      }

      .validation-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class QuestionEditorComponent implements OnInit {
  @Input({ required: true }) question!: Question;
  @Input({ required: true }) formId!: string;
  @Output() save = new EventEmitter<Question>();
  @Output() cancel = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly questionService = inject(QuestionService);
  private readonly toastService = inject(ToastService);

  isSaving = false;
  QuestionType = QuestionType; // Pour utiliser dans le template

  // Form group
  questionForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    is_required: [false],
    options: this.fb.array([]),
    min_length: [null],
    max_length: [null],
    min_value: [null],
    max_value: [null]
  });

  get optionsArray() {
    return this.questionForm.get('options') as FormArray;
  }

  ngOnInit(): void {
    // Initialiser le formulaire avec les données de la question
    this.initializeForm();
  }

  /**
   * Initialise le formulaire avec les données existantes
   */
  initializeForm(): void {
    this.questionForm.patchValue({
      title: this.question.title,
      description: this.question.description,
      is_required: this.question.is_required,
      min_length: this.question.min_length,
      max_length: this.question.max_length,
      min_value: this.question.min_value,
      max_value: this.question.max_value
    });

    // Initialiser les options si nécessaire
    if (this.hasOptions() && this.question.options) {
      this.question.options.forEach(option => {
        this.optionsArray.push(
          this.fb.control(option, Validators.required)
        );
      });
    } else if (this.hasOptions() && !this.question.options) {
      // Ajouter une option par défaut
      this.addOption();
    }
  }

  /**
   * Vérifie si la question a des options
   */
  hasOptions(): boolean {
    return QUESTION_TYPE_CONFIG[this.question.question_type].hasOptions;
  }

  /**
   * Vérifie si la question a des validations
   */
  hasValidation(): boolean {
    return QUESTION_TYPE_CONFIG[this.question.question_type].hasValidation;
  }

  /**
   * Vérifie si c'est une question de type texte
   */
  isTextQuestion(): boolean {
    return [QuestionType.SHORT_TEXT, QuestionType.LONG_TEXT].includes(
      this.question.question_type
    );
  }

  /**
   * Gestion des options
   */
  addOption(): void {
    this.optionsArray.push(
      this.fb.control('', Validators.required)
    );
  }

  removeOption(index: number): void {
    if (this.optionsArray.length > 1) {
      this.optionsArray.removeAt(index);
    }
  }

  /**
   * Obtient l'icône pour les options
   */
  getOptionIcon(): string {
    switch (this.question.question_type) {
      case QuestionType.MULTIPLE_CHOICE:
        return 'radio_button_unchecked';
      case QuestionType.CHECKBOX:
        return 'check_box_outline_blank';
      case QuestionType.DROPDOWN:
        return 'arrow_drop_down';
      default:
        return '';
    }
  }

  /**
   * Validation
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.questionForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isOptionInvalid(index: number): boolean {
    const option = this.optionsArray.at(index);
    return !!(option && option.invalid && (option.dirty || option.touched));
  }

  /**
   * Sauvegarde la question
   */
  saveQuestion(): void {
    if (this.questionForm.invalid) {
      this.questionForm.markAllAsTouched();
      return;
    }

    const formValue = this.questionForm.value;
    
    // Préparer les données de mise à jour
    const updateData: QuestionUpdate = {
      title: formValue.title!,
      description: formValue.description || undefined,
      is_required: formValue.is_required!
    };

    // Ajouter les options si nécessaire
    if (this.hasOptions()) {
      updateData.options = formValue.options!.filter(o => o.trim() !== '');
    }

    // Ajouter les validations si nécessaire
    if (this.hasValidation()) {
      if (this.isTextQuestion()) {
        updateData.min_length = formValue.min_length || undefined;
        updateData.max_length = formValue.max_length || undefined;
      } else if (this.question.question_type === QuestionType.NUMBER) {
        updateData.min_value = formValue.min_value !== null ? formValue.min_value : undefined;
        updateData.max_value = formValue.max_value !== null ? formValue.max_value : undefined;
      }
    }

    // Si c'est une nouvelle question (ID temporaire)
    if (this.question._id.startsWith('temp-')) {
      const updatedQuestion = { ...this.question, ...updateData };
      this.save.emit(updatedQuestion);
      return;
    }

    // Sinon, sauvegarder via l'API
    this.isSaving = true;
    this.questionService.updateQuestion(
      this.formId,
      this.question._id,
      updateData
    ).subscribe({
      next: (updatedQuestion) => {
        this.save.emit(updatedQuestion);
        this.toastService.success('Question mise à jour');
        this.isSaving = false;
      },
      error: () => {
        this.toastService.error('Erreur lors de la sauvegarde');
        this.isSaving = false;
      }
    });
  }
}