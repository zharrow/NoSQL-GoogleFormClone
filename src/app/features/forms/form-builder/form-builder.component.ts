// src/app/features/forms/form-builder/form-builder.component.ts

import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormService } from '../../../core/services/form.service';
import { QuestionService } from '../../../core/services/question.service';
import { ToastService } from '../../../core/services/toast.service';
import { 
  Form, 
  FormCreate, 
  FormUpdate,
  FormWithQuestions 
} from '../../../core/models/form.model';
import { 
  Question, 
  QuestionType, 
  QUESTION_TYPE_CONFIG,
  QuestionOrder 
} from '../../../core/models/question.model';
import { QuestionEditorComponent } from '../question-editor/question-editor.component';
import { FormPreviewComponent } from '../form-preview/form-preview.component';

@Component({
  selector: 'app-form-builder',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    DragDropModule,
    QuestionEditorComponent,
    FormPreviewComponent
  ],
  template: `
    <div class="builder-container">
      <!-- Header -->
      <div class="builder-header">
        <button class="btn-icon" (click)="goBack()">
          <i class="material-icons">arrow_back</i>
        </button>
        
        <div class="header-content">
          <h1 class="header-title">
            {{ isEditMode ? 'Modifier le formulaire' : 'Nouveau formulaire' }}
          </h1>
        </div>

        <div class="header-actions">
          <button 
            class="btn btn-outline"
            (click)="togglePreview()"
            [class.active]="showPreview()"
          >
            <i class="material-icons">{{ showPreview() ? 'edit' : 'visibility' }}</i>
            <span>{{ showPreview() ? 'Éditer' : 'Aperçu' }}</span>
          </button>
          
          <button 
            class="btn btn-primary"
            (click)="saveForm()"
            [disabled]="isSaving() || formGroup.invalid"
          >
            <i class="material-icons">{{ isSaving() ? 'refresh' : 'save' }}</i>
            <span>{{ isSaving() ? 'Enregistrement...' : 'Enregistrer' }}</span>
          </button>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="progress-bar" *ngIf="isSaving()">
        <div class="progress-fill animate-progress"></div>
      </div>

      <!-- Main content -->
      <div class="builder-content" *ngIf="!showPreview()">
        <!-- Form settings -->
        <div class="form-settings animate-fadeIn">
          <form [formGroup]="formGroup">
            <div class="form-field">
              <input
                type="text"
                formControlName="title"
                placeholder="Titre du formulaire"
                class="form-title-input"
                [class.error]="isFieldInvalid('title')"
              />
              <div *ngIf="isFieldInvalid('title')" class="error-message">
                Le titre est requis
              </div>
            </div>

            <div class="form-field">
              <textarea
                formControlName="description"
                placeholder="Description (optionnelle)"
                class="form-description-input"
                rows="2"
              ></textarea>
            </div>

            <div class="settings-row">
              <label class="toggle-setting">
                <input type="checkbox" formControlName="accepts_responses" />
                <span class="toggle-label">Accepter les réponses</span>
              </label>

              <label class="toggle-setting">
                <input type="checkbox" formControlName="requires_auth" />
                <span class="toggle-label">Authentification requise</span>
              </label>
            </div>
          </form>
        </div>

        <!-- Questions -->
        <div class="questions-section">
          <!-- Questions list -->
          <div 
            cdkDropList 
            [cdkDropListData]="questions()"
            (cdkDropListDropped)="dropQuestion($event)"
            class="questions-list"
          >
            <div 
              *ngFor="let question of questions(); let i = index; trackBy: trackByQuestionId"
              cdkDrag
              class="question-wrapper animate-fadeIn"
              [class.selected]="selectedQuestionId() === question._id"
            >
              <!-- Drag handle -->
              <div class="drag-handle" cdkDragHandle>
                <i class="material-icons">drag_indicator</i>
              </div>

              <!-- Question card -->
              <div 
                class="question-card"
                (click)="selectQuestion(question)"
              >
                <div class="question-header">
                  <div class="question-number">{{ i + 1 }}</div>
                  <div class="question-type-icon">
                    <i class="material-icons">{{ getQuestionIcon(question.question_type) }}</i>
                  </div>
                  <h3 class="question-title">
                    {{ question.title || 'Question sans titre' }}
                    <span class="required-badge" *ngIf="question.is_required">*</span>
                  </h3>
                  <div class="question-actions">
                    <button 
                      class="btn-icon"
                      (click)="duplicateQuestion(question); $event.stopPropagation()"
                      title="Dupliquer"
                    >
                      <i class="material-icons">content_copy</i>
                    </button>
                    <button 
                      class="btn-icon"
                      (click)="deleteQuestion(question); $event.stopPropagation()"
                      title="Supprimer"
                    >
                      <i class="material-icons">delete</i>
                    </button>
                  </div>
                </div>

                <!-- Question preview -->
                <div class="question-preview">
                  <p class="question-description" *ngIf="question.description">
                    {{ question.description }}
                  </p>
                  
                  <!-- Options preview for choice questions -->
                  <div 
                    class="options-preview" 
                    *ngIf="hasOptions(question.question_type) && question.options"
                  >
                    <div 
                      *ngFor="let option of question.options.slice(0, 3)" 
                      class="option-item"
                    >
                      <i class="material-icons">
                        {{ getOptionIcon(question.question_type) }}
                      </i>
                      <span>{{ option }}</span>
                    </div>
                    <div class="option-item more" *ngIf="question.options.length > 3">
                      +{{ question.options.length - 3 }} autres options
                    </div>
                  </div>
                </div>
              </div>

              <!-- Question editor (inline) -->
              <div 
                class="question-editor-wrapper" 
                *ngIf="selectedQuestionId() === question._id"
                @slideDown
              >
                <app-question-editor
                  [question]="question"
                  [formId]="formId"
                  (save)="onQuestionSaved($event)"
                  (cancel)="deselectQuestion()"
                />
              </div>
            </div>
          </div>

          <!-- Add question button -->
          <div class="add-question-section">
            <button 
              class="add-question-button"
              (click)="toggleQuestionTypes()"
              [class.active]="showQuestionTypes()"
            >
              <i class="material-icons">add_circle_outline</i>
              <span>Ajouter une question</span>
            </button>

            <!-- Question types grid -->
            <div class="question-types-grid" *ngIf="showQuestionTypes()" @scaleIn>
              <button
                *ngFor="let type of questionTypes"
                class="question-type-card"
                (click)="addQuestion(type.type)"
              >
                <i class="material-icons">{{ type.icon }}</i>
                <span class="type-label">{{ type.label }}</span>
                <span class="type-description">{{ type.description }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview mode -->
      <div class="preview-container" *ngIf="showPreview()">
        <app-form-preview
          [form]="currentForm()"
          [questions]="questions()"
        />
      </div>
    </div>
  `,
  styles: [`
    .builder-container {
      min-height: 100vh;
      background: var(--bg-secondary);
    }

    /* Header */
    .builder-header {
      position: sticky;
      top: 0;
      z-index: var(--z-sticky);
      background: var(--bg-primary);
      border-bottom: 1px solid var(--border-color);
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .btn-icon {
      width: 40px;
      height: 40px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      border-radius: var(--radius-md);
      color: var(--text-primary);
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .btn-icon:hover {
      background: var(--bg-secondary);
    }

    .header-content {
      flex: 1;
    }

    .header-title {
      font-size: var(--text-xl);
      font-weight: var(--font-semibold);
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    /* Progress bar */
    .progress-bar {
      height: 3px;
      background: var(--gray-200);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--primary-500);
      animation: progress 2s ease-in-out infinite;
    }

    /* Content */
    .builder-content,
    .preview-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    /* Form settings */
    .form-settings {
      background: var(--bg-primary);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: var(--shadow-sm);
    }

    .form-field {
      margin-bottom: 1rem;
    }

    .form-title-input {
      width: 100%;
      font-size: var(--text-2xl);
      font-weight: var(--font-semibold);
      border: none;
      border-bottom: 2px solid transparent;
      padding: 0.5rem 0;
      background: transparent;
      color: var(--text-primary);
      transition: border-color var(--transition-fast);
    }

    .form-title-input:focus {
      outline: none;
      border-bottom-color: var(--primary-500);
    }

    .form-title-input.error {
      border-bottom-color: var(--danger-500);
    }

    .form-description-input {
      width: 100%;
      font-size: var(--text-base);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.75rem;
      background: var(--bg-primary);
      color: var(--text-primary);
      resize: vertical;
      transition: border-color var(--transition-fast);
    }

    .form-description-input:focus {
      outline: none;
      border-color: var(--primary-500);
    }

    .settings-row {
      display: flex;
      gap: 2rem;
      margin-top: 1rem;
    }

    .toggle-setting {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .toggle-label {
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    /* Questions section */
    .questions-section {
      margin-bottom: 4rem;
    }

    .questions-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .question-wrapper {
      display: flex;
      gap: 0.5rem;
      position: relative;
    }

    .drag-handle {
      width: 24px;
      display: flex;
      align-items: flex-start;
      padding-top: 1rem;
      color: var(--text-tertiary);
      cursor: move;
      opacity: 0;
      transition: opacity var(--transition-fast);
    }

    .question-wrapper:hover .drag-handle {
      opacity: 1;
    }

    .cdk-drag-preview {
      box-shadow: var(--shadow-xl);
      opacity: 0.8;
    }

    .cdk-drag-placeholder {
      opacity: 0.2;
    }

    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .question-card {
      flex: 1;
      background: var(--bg-primary);
      border: 2px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1rem;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .question-wrapper.selected .question-card {
      border-color: var(--primary-500);
      box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
    }

    .question-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .question-number {
      width: 24px;
      height: 24px;
      background: var(--gray-200);
      color: var(--text-secondary);
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-xs);
      font-weight: var(--font-medium);
    }

    .question-type-icon {
      color: var(--primary-500);
    }

    .question-type-icon i {
      font-size: 20px;
    }

    .question-title {
      flex: 1;
      font-size: var(--text-base);
      font-weight: var(--font-medium);
      margin: 0;
      color: var(--text-primary);
    }

    .required-badge {
      color: var(--danger-500);
      margin-left: 0.25rem;
    }

    .question-actions {
      display: flex;
      gap: 0.25rem;
      opacity: 0;
      transition: opacity var(--transition-fast);
    }

    .question-wrapper:hover .question-actions {
      opacity: 1;
    }

    .question-preview {
      margin-left: calc(24px + 0.75rem + 20px + 0.75rem);
    }

    .question-description {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      margin: 0 0 0.5rem 0;
    }

    .options-preview {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .option-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .option-item i {
      font-size: 16px;
    }

    .option-item.more {
      font-style: italic;
      color: var(--text-tertiary);
    }

    .question-editor-wrapper {
      position: absolute;
      top: 100%;
      left: calc(24px + 0.5rem);
      right: 0;
      z-index: 10;
      margin-top: 0.5rem;
    }

    /* Add question section */
    .add-question-section {
      margin-top: 2rem;
    }

    .add-question-button {
      width: 100%;
      padding: 1rem;
      background: var(--bg-primary);
      border: 2px dashed var(--border-color);
      border-radius: var(--radius-lg);
      color: var(--text-secondary);
      font-size: var(--text-base);
      font-weight: var(--font-medium);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all var(--transition-fast);
    }

    .add-question-button:hover {
      border-color: var(--primary-500);
      color: var(--primary-500);
      background: var(--primary-50);
    }

    .add-question-button.active {
      border-style: solid;
      border-color: var(--primary-500);
      color: var(--primary-500);
      background: var(--primary-50);
    }

    .question-types-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .question-type-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem;
      cursor: pointer;
      transition: all var(--transition-fast);
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .question-type-card:hover {
      border-color: var(--primary-500);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .question-type-card i {
      font-size: 32px;
      color: var(--primary-500);
    }

    .type-label {
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      color: var(--text-primary);
    }

    .type-description {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      display: none;
    }

    /* Button styles */
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

    .btn-outline.active {
      background: var(--primary-50);
      color: var(--primary-600);
      border-color: var(--primary-500);
    }

    .error-message {
      font-size: var(--text-xs);
      color: var(--danger-500);
      margin-top: 0.25rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .builder-content {
        padding: 1rem;
      }

      .header-title {
        font-size: var(--text-lg);
      }

      .question-types-grid {
        grid-template-columns: 1fr;
      }

      .settings-row {
        flex-direction: column;
        gap: 1rem;
      }
    }
  `]
})
export class FormBuilderComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formService = inject(FormService);
  private readonly questionService = inject(QuestionService);
  private readonly toastService = inject(ToastService);

  // État local
  formId = '';
  isEditMode = false;
  readonly currentForm = signal<FormWithQuestions | null>(null);
  readonly questions = signal<Question[]>([]);
  readonly selectedQuestionId = signal<string | null>(null);
  readonly showPreview = signal(false);
  readonly showQuestionTypes = signal(false);
  readonly isSaving = signal(false);

  // Form group
  formGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    accepts_responses: [true],
    requires_auth: [false]
  });

  // Types de questions disponibles
  questionTypes = Object.values(QUESTION_TYPE_CONFIG);

  ngOnInit(): void {
    // Récupérer l'ID du formulaire depuis la route
    this.formId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.formId;

    if (this.isEditMode) {
      this.loadForm();
    }
  }

  /**
   * Charge un formulaire existant
   */
  loadForm(): void {
    this.formService.getFormById(this.formId).subscribe({
      next: (form) => {
        this.currentForm.set(form);
        this.questions.set(form.questions || []);
        
        // Mettre à jour le formulaire
        this.formGroup.patchValue({
          title: form.title,
          description: form.description,
          accepts_responses: form.accepts_responses,
          requires_auth: form.requires_auth
        });

        // Initialiser les questions dans le service
        this.questionService.setFormQuestions(this.formId, form.questions || []);
      },
      error: () => {
        this.toastService.error('Erreur lors du chargement du formulaire');
        this.router.navigate(['/forms']);
      }
    });
  }

  /**
   * Sauvegarde le formulaire
   */
  saveForm(): void {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const formData = this.formGroup.value;

    const save$ = this.isEditMode
      ? this.formService.updateForm(this.formId, formData as FormUpdate)
      : this.formService.createForm(formData as FormCreate);

    save$.subscribe({
      next: (form) => {
        this.toastService.success(
          this.isEditMode ? 'Formulaire mis à jour' : 'Formulaire créé'
        );
        
        if (!this.isEditMode) {
          this.router.navigate(['/forms', form._id, 'edit']);
        }
        
        this.isSaving.set(false);
      },
      error: () => {
        this.toastService.error('Erreur lors de la sauvegarde');
        this.isSaving.set(false);
      }
    });
  }

  /**
   * Gestion des questions
   */
  addQuestion(type: QuestionType): void {
    const newQuestion: Question = {
      _id: `temp-${Date.now()}`,
      form_id: this.formId || 'temp',
      title: '',
      question_type: type,
      is_required: false,
      order: this.questions().length,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Ajouter la question avec options par défaut si nécessaire
    if (QUESTION_TYPE_CONFIG[type].hasOptions) {
      newQuestion.options = ['Option 1'];
    }

    this.questions.update(questions => [...questions, newQuestion]);
    this.selectedQuestionId.set(newQuestion._id);
    this.showQuestionTypes.set(false);
  }

  selectQuestion(question: Question): void {
    if (this.selectedQuestionId() === question._id) {
      this.deselectQuestion();
    } else {
      this.selectedQuestionId.set(question._id);
    }
  }

  deselectQuestion(): void {
    this.selectedQuestionId.set(null);
  }

  onQuestionSaved(question: Question): void {
    this.questions.update(questions => 
      questions.map(q => q._id === question._id ? question : q)
    );
    this.deselectQuestion();
  }

  duplicateQuestion(question: Question): void {
    const duplicate: Question = {
      ...question,
      _id: `temp-${Date.now()}`,
      title: `${question.title} (copie)`,
      order: this.questions().length,
      created_at: new Date(),
      updated_at: new Date()
    };

    this.questions.update(questions => [...questions, duplicate]);
  }

  deleteQuestion(question: Question): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) {
      this.questions.update(questions => 
        questions.filter(q => q._id !== question._id)
      );
      
      if (this.selectedQuestionId() === question._id) {
        this.deselectQuestion();
      }
    }
  }

  dropQuestion(event: CdkDragDrop<Question[]>): void {
    const questions = [...this.questions()];
    moveItemInArray(questions, event.previousIndex, event.currentIndex);
    
    // Mettre à jour les ordres
    questions.forEach((q, index) => {
      q.order = index;
    });
    
    this.questions.set(questions);

    // Si on est en mode édition, sauvegarder l'ordre
    if (this.isEditMode && this.formId) {
      const orders: QuestionOrder[] = questions.map(q => ({
        question_id: q._id,
        order: q.order
      }));

      this.questionService.reorderQuestions(this.formId, orders).subscribe({
        error: () => {
          this.toastService.error('Erreur lors de la réorganisation');
        }
      });
    }
  }

  /**
   * UI Helpers
   */
  togglePreview(): void {
    this.showPreview.update(show => !show);
  }

  toggleQuestionTypes(): void {
    this.showQuestionTypes.update(show => !show);
  }

  goBack(): void {
    this.router.navigate(['/forms']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.formGroup.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getQuestionIcon(type: QuestionType): string {
    return QUESTION_TYPE_CONFIG[type].icon;
  }

  hasOptions(type: QuestionType): boolean {
    return QUESTION_TYPE_CONFIG[type].hasOptions;
  }

  getOptionIcon(type: QuestionType): string {
    switch (type) {
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

  trackByQuestionId(index: number, question: Question): string {
    return question._id;
  }
}