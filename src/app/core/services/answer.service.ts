// src/app/core/services/answer.service.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { 
  FormResponse,
  FormResponseCreate,
  FormResponseDetail,
  AnswerDraft,
  FormProgress
} from '../models/answer.model';

/**
 * Service pour gérer les réponses aux formulaires
 * Gère la soumission et la consultation des réponses
 */
@Injectable({
  providedIn: 'root'
})
export class AnswerService {
  private readonly api = inject(ApiService);
  
  // État réactif pour les réponses en cours
  private readonly currentAnswersSignal = signal<Map<string, AnswerDraft>>(new Map());
  private readonly formResponsesSignal = signal<FormResponseDetail[]>([]);
  private readonly loadingSignal = signal(false);
  
  // Computed values
  readonly currentAnswers = computed(() => this.currentAnswersSignal());
  readonly formResponses = computed(() => this.formResponsesSignal());
  readonly loading = computed(() => this.loadingSignal());
  
  /**
   * Soumet les réponses d'un formulaire
   */
  submitFormResponse(
    formId: string, 
    responseData: FormResponseCreate
  ): Observable<FormResponseDetail> {
    this.loadingSignal.set(true);
    
    return this.api.post<FormResponseDetail>(
      `/forms/${formId}/submit`, 
      responseData
    ).pipe(
      tap(() => {
        this.loadingSignal.set(false);
        this.clearCurrentAnswers();
      })
    );
  }
  
  /**
   * Récupère toutes les réponses d'un formulaire
   */
  getFormResponses(
    formId: string, 
    skip = 0, 
    limit = 100
  ): Observable<FormResponseDetail[]> {
    this.loadingSignal.set(true);
    
    return this.api.get<FormResponseDetail[]>(
      `/forms/${formId}/responses`,
      { params: { skip: skip.toString(), limit: limit.toString() } }
    ).pipe(
      tap(responses => {
        this.formResponsesSignal.set(responses);
        this.loadingSignal.set(false);
      })
    );
  }
  
  /**
   * Récupère une réponse spécifique
   */
  getResponseById(responseId: string): Observable<FormResponseDetail> {
    return this.api.get<FormResponseDetail>(`/responses/${responseId}`);
  }
  
  /**
   * Sauvegarde une réponse en cours (brouillon)
   */
  saveAnswerDraft(questionId: string, answer: AnswerDraft): void {
    this.currentAnswersSignal.update(answers => {
      const newAnswers = new Map(answers);
      newAnswers.set(questionId, answer);
      return newAnswers;
    });
  }
  
  /**
   * Récupère une réponse en cours
   */
  getAnswerDraft(questionId: string): AnswerDraft | undefined {
    return this.currentAnswersSignal().get(questionId);
  }
  
  /**
   * Supprime une réponse en cours
   */
  removeAnswerDraft(questionId: string): void {
    this.currentAnswersSignal.update(answers => {
      const newAnswers = new Map(answers);
      newAnswers.delete(questionId);
      return newAnswers;
    });
  }
  
  /**
   * Efface toutes les réponses en cours
   */
  clearCurrentAnswers(): void {
    this.currentAnswersSignal.set(new Map());
  }
  
  /**
   * Calcule la progression du formulaire
   */
  calculateProgress(totalQuestions: number): FormProgress {
    const answers = this.currentAnswersSignal();
    const answeredQuestions = Array.from(answers.values())
      .filter(answer => answer.value !== null && answer.value !== '' && answer.isValid)
      .length;
    
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
  }
  
  /**
   * Prépare les réponses pour la soumission
   */
  prepareSubmission(): FormResponseCreate {
    const answers = this.currentAnswersSignal();
    const answersList = Array.from(answers.entries())
      .filter(([_, draft]) => draft.value !== null && draft.value !== '')
      .map(([questionId, draft]) => ({
        question_id: questionId,
        value: draft.value
      }));
    
    return { answers: answersList };
  }
  
  /**
   * Valide toutes les réponses
   */
  validateAllAnswers(): boolean {
    const answers = this.currentAnswersSignal();
    return Array.from(answers.values()).every(answer => answer.isValid);
  }
  
  /**
   * Exporte les réponses en CSV
   */
  exportResponsesAsCSV(responses: FormResponseDetail[]): string {
    if (responses.length === 0) return '';
    
    // En-têtes
    const headers = ['Date de soumission', 'Répondant'];
    const questionIds = new Set<string>();
    
    // Collecter tous les IDs de questions
    responses.forEach(response => {
      response.answers.forEach(answer => {
        questionIds.add(answer.question_id);
      });
    });
    
    // TODO: Ajouter les titres des questions comme en-têtes
    
    // Lignes de données
    const rows = responses.map(response => {
      const row = [
        new Date(response.submitted_at).toLocaleString('fr-FR'),
        response.respondent_id || 'Anonyme'
      ];
      
      // Ajouter les réponses dans l'ordre des questions
      questionIds.forEach(questionId => {
        const answer = response.answers.find(a => a.question_id === questionId);
        row.push(answer ? this.formatAnswerValue(answer.value) : '');
      });
      
      return row;
    });
    
    // Convertir en CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    return csvContent;
  }
  
  /**
   * Formate une valeur de réponse pour l'export
   */
  private formatAnswerValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return value.join('; ');
    if (value instanceof Date) return value.toLocaleDateString('fr-FR');
    return value.toString();
  }
  
  /**
   * Réinitialise l'état du service
   */
  resetState(): void {
    this.currentAnswersSignal.set(new Map());
    this.formResponsesSignal.set([]);
    this.loadingSignal.set(false);
  }
}