// src/app/features/forms/form-viewer/form-viewer.component.ts

import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FormService } from '../../../core/services/form.service';
import { AnswerService } from '../../../core/services/answer.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { FormWithQuestions } from '../../../core/models/form.model';
import { Question, QuestionType, QuestionUtils } from '../../../core/models/question.model';
import { AnswerDraft, AnswerUtils, FormProgress } from '../../../core/models/answer.model';

@Component({
  selector: 'app-form-viewer',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './form-viewer.component.html',
  styleUrls: ['./form-viewer.component.scss']
})
export class FormViewerComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formService = inject(FormService);
  private readonly answerService = inject(AnswerService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  // État du composant
  formId = '';
  readonly form = signal<FormWithQuestions | null>(null);
  readonly questions = signal<Question[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly isSubmitted = signal(false);
  readonly isSubmitting = signal(false);

  // Réponses et erreurs
  currentAnswers: Record<string, any> = {};
  readonly currentErrors = signal<Record<string, string>>({});

  // Computed pour la progression
  readonly progress = computed<FormProgress>(() => {
    const totalQuestions = this.questions().length;
    const answeredQuestions = this.getAnsweredQuestionCount();
    const percentComplete = totalQuestions > 0 
      ? Math.round((answeredQuestions / totalQuestions) * 100)
      : 0;

    return {
      currentQuestionIndex: 0,
      totalQuestions,
      answeredQuestions,
      percentComplete,
      isComplete: answeredQuestions === totalQuestions
    };
  });

  // Exposer QuestionType pour le template
  QuestionType = QuestionType;

  ngOnInit(): void {
    this.formId = this.route.snapshot.params['id'];
    this.initializeAnswerService();
    this.loadForm();
  }

  /**
   * Initialise le service de réponses
   */
  private initializeAnswerService(): void {
    this.answerService.resetState();
  }

  /**
   * Charge le formulaire depuis l'API
   */
  private loadForm(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.formService.getFormById(this.formId).subscribe({
      next: (formData) => this.handleFormLoaded(formData),
      error: (err) => this.handleFormError(err)
    });
  }

  /**
   * Gère le succès du chargement du formulaire
   */
  private handleFormLoaded(formData: FormWithQuestions): void {
    this.form.set(formData);
    this.questions.set(formData.questions || []);
    this.initializeAnswers();
    this.isLoading.set(false);
  }

  /**
   * Gère les erreurs de chargement du formulaire
   */
  private handleFormError(err: any): void {
    const errorMessage = this.getErrorMessage(err);
    this.error.set(errorMessage);
    this.isLoading.set(false);
  }

  /**
   * Extrait le message d'erreur approprié
   */
  private getErrorMessage(err: any): string {
    switch (err.status) {
      case 404:
        return 'Formulaire introuvable';
      case 403:
        return 'Accès refusé à ce formulaire';
      case 500:
        return 'Erreur serveur - Veuillez réessayer plus tard';
      default:
        return 'Une erreur est survenue lors du chargement';
    }
  }

  /**
   * Initialise les réponses vides
   */
  private initializeAnswers(): void {
    this.questions().forEach(question => {
      this.currentAnswers[question._id] = this.getDefaultValue(question);
    });
  }

  /**
   * Obtient la valeur par défaut pour un type de question
   */
  private getDefaultValue(question: Question): any {
    return question.question_type === QuestionType.CHECKBOX ? [] : '';
  }

  /**
   * Met à jour une réponse et valide
   */
  updateAnswer(question: Question, value: any): void {
    this.currentAnswers[question._id] = value;
    this.validateAnswer(question);
    this.saveAnswerDraft(question, value);
  }

  /**
   * Valide une réponse spécifique
   */
  private validateAnswer(question: Question): void {
    const value = this.currentAnswers[question._id];
    const error = QuestionUtils.validateAnswer(question, value);
    
    this.currentErrors.update(errors => {
      if (error) {
        return { ...errors, [question._id]: error };
      } else {
        const { [question._id]: _, ...rest } = errors;
        return rest;
      }
    });
  }

  /**
   * Sauvegarde un brouillon de réponse
   */
  private saveAnswerDraft(question: Question, value: any): void {
    const draft: AnswerDraft = {
      questionId: question._id,
      value,
      isValid: !QuestionUtils.validateAnswer(question, value)
    };
    
    this.answerService.saveAnswerDraft(question._id, draft);
  }

  /**
   * Gère les checkbox (valeurs multiples)
   */
  toggleCheckbox(question: Question, option: string): void {
    const current = this.currentAnswers[question._id] || [];
    const updated = current.includes(option)
      ? current.filter((o: string) => o !== option)
      : [...current, option];
    
    this.updateAnswer(question, updated);
  }

  /**
   * Vérifie si une option est cochée
   */
  isChecked(questionId: string, option: string): boolean {
    const values = this.currentAnswers[questionId];
    return Array.isArray(values) && values.includes(option);
  }

  /**
   * Soumet le formulaire
   */
  submitForm(): void {
    if (!this.validateAllAnswers()) {
      this.scrollToFirstError();
      return;
    }

    this.performSubmission();
  }

  /**
   * Valide toutes les réponses avant soumission
   */
  private validateAllAnswers(): boolean {
    let hasErrors = false;
    const errors: Record<string, string> = {};

    this.questions().forEach(question => {
      const value = this.currentAnswers[question._id];
      const error = QuestionUtils.validateAnswer(question, value);
      
      if (error) {
        errors[question._id] = error;
        hasErrors = true;
      }
    });

    this.currentErrors.set(errors);
    return !hasErrors;
  }

  /**
   * Effectue la soumission du formulaire
   */
  private performSubmission(): void {
    this.isSubmitting.set(true);
    
    const submission = this.prepareSubmissionData();
    
    this.answerService.submitFormResponse(this.formId, submission).subscribe({
      next: () => this.handleSubmissionSuccess(),
      error: (err) => this.handleSubmissionError(err)
    });
  }

  /**
   * Prépare les données pour la soumission
   */
  private prepareSubmissionData() {
    const answers = this.questions()
      .map(question => ({
        question_id: question._id,
        value: this.currentAnswers[question._id]
      }))
      .filter(answer => this.hasValidValue(answer.value));

    return { answers };
  }

  /**
   * Vérifie si une valeur est valide pour la soumission
   */
  private hasValidValue(value: any): boolean {
    if (value === null || value === undefined || value === '') {
      return false;
    }
    if (Array.isArray(value) && value.length === 0) {
      return false;
    }
    return true;
  }

  /**
   * Gère le succès de la soumission
   */
  private handleSubmissionSuccess(): void {
    this.isSubmitted.set(true);
    this.isSubmitting.set(false);
    this.toastService.success('Votre réponse a été enregistrée !');
  }

  /**
   * Gère les erreurs de soumission
   */
  private handleSubmissionError(err: any): void {
    this.isSubmitting.set(false);
    const message = err.error?.detail || 'Erreur lors de l\'envoi';
    this.toastService.error(message);
  }

  /**
   * Fait défiler vers la première erreur
   */
  private scrollToFirstError(): void {
    const firstErrorElement = document.querySelector('.question-card.has-error');
    firstErrorElement?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
  }

  /**
   * Efface toutes les réponses
   */
  clearForm(): void {
    if (!this.confirmClearForm()) return;

    this.initializeAnswers();
    this.currentErrors.set({});
    this.answerService.clearCurrentAnswers();
    this.toastService.info('Formulaire effacé');
  }

  /**
   * Demande confirmation avant d'effacer
   */
  private confirmClearForm(): boolean {
    return confirm('Êtes-vous sûr de vouloir effacer toutes vos réponses ?');
  }

  /**
   * Permet de soumettre une nouvelle réponse
   */
  submitAnother(): void {
    this.resetComponentState();
    this.initializeAnswers();
  }

  /**
   * Remet à zéro l'état du composant
   */
  private resetComponentState(): void {
    this.isSubmitted.set(false);
    this.isSubmitting.set(false);
    this.currentErrors.set({});
    this.answerService.clearCurrentAnswers();
  }

  /**
   * Compte le nombre de questions avec réponse
   */
  private getAnsweredQuestionCount(): number {
    return this.questions().filter(question => {
      const value = this.currentAnswers[question._id];
      return this.hasValidValue(value);
    }).length;
  }
}