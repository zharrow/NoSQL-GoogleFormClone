// src/app/core/services/question.service.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { 
  Question, 
  QuestionCreate, 
  QuestionUpdate, 
  QuestionOrder 
} from '../models/question.model';

/**
 * Service pour gérer les questions
 * Gère le CRUD et les opérations sur les questions d'un formulaire
 */
@Injectable({
  providedIn: 'root'
})
export class QuestionService {
  private readonly api = inject(ApiService);
  
  // État réactif des questions par formulaire
  private readonly questionsMapSignal = signal<Map<string, Question[]>>(new Map());
  private readonly loadingSignal = signal(false);
  
  // Computed values
  readonly loading = computed(() => this.loadingSignal());
  
  /**
   * Récupère les questions d'un formulaire depuis le signal
   */
  getFormQuestions(formId: string): Question[] {
    return this.questionsMapSignal().get(formId) || [];
  }
  
  /**
   * Charge les questions d'un formulaire
   */
  loadFormQuestions(formId: string): Observable<Question[]> {
    // Les questions sont déjà chargées avec le formulaire via FormWithQuestions
    // Cette méthode pourrait être utilisée pour recharger uniquement les questions
    return this.api.get<Question[]>(`/forms/${formId}/questions`).pipe(
      tap(questions => {
        this.updateQuestionsForForm(formId, questions);
      })
    );
  }
  
  /**
   * Crée une nouvelle question
   */
  createQuestion(formId: string, questionData: QuestionCreate): Observable<Question> {
    return this.api.post<Question>(`/forms/${formId}/questions`, questionData).pipe(
      tap(newQuestion => {
        const currentQuestions = this.getFormQuestions(formId);
        this.updateQuestionsForForm(formId, [...currentQuestions, newQuestion]);
      })
    );
  }
  
  /**
   * Met à jour une question
   */
  updateQuestion(
    formId: string, 
    questionId: string, 
    questionData: QuestionUpdate
  ): Observable<Question> {
    return this.api.patch<Question>(
      `/forms/${formId}/questions/${questionId}`, 
      questionData
    ).pipe(
      tap(updatedQuestion => {
        const currentQuestions = this.getFormQuestions(formId);
        const updatedQuestions = currentQuestions.map(q => 
          q._id === questionId ? updatedQuestion : q
        );
        this.updateQuestionsForForm(formId, updatedQuestions);
      })
    );
  }
  
  /**
   * Supprime une question
   */
  deleteQuestion(formId: string, questionId: string): Observable<any> {
    return this.api.delete(`/forms/${formId}/questions/${questionId}`).pipe(
      tap(() => {
        const currentQuestions = this.getFormQuestions(formId);
        const filteredQuestions = currentQuestions.filter(q => q._id !== questionId);
        this.updateQuestionsForForm(formId, filteredQuestions);
      })
    );
  }
  
  /**
   * Réordonne les questions
   */
  reorderQuestions(formId: string, questionOrders: QuestionOrder[]): Observable<any> {
    return this.api.post(`/forms/${formId}/questions/reorder`, questionOrders).pipe(
      tap(() => {
        // Réordonner localement
        const currentQuestions = this.getFormQuestions(formId);
        const orderMap = new Map(
          questionOrders.map(o => [o.question_id, o.order])
        );
        
        const reorderedQuestions = [...currentQuestions].sort((a, b) => {
          const orderA = orderMap.get(a._id) ?? a.order;
          const orderB = orderMap.get(b._id) ?? b.order;
          return orderA - orderB;
        });
        
        this.updateQuestionsForForm(formId, reorderedQuestions);
      })
    );
  }
  
  /**
   * Duplique une question
   */
  duplicateQuestion(formId: string, questionId: string): Observable<Question> {
    const question = this.getFormQuestions(formId).find(q => q._id === questionId);
    if (!question) {
      throw new Error('Question not found');
    }
    
    const duplicate: QuestionCreate = {
      title: `${question.title} (copie)`,
      description: question.description,
      question_type: question.question_type,
      is_required: question.is_required,
      order: question.order + 1,
      options: question.options ? [...question.options] : undefined,
      min_length: question.min_length,
      max_length: question.max_length,
      min_value: question.min_value,
      max_value: question.max_value
    };
    
    return this.createQuestion(formId, duplicate);
  }
  
  /**
   * Met à jour les questions pour un formulaire dans le signal
   */
  private updateQuestionsForForm(formId: string, questions: Question[]): void {
    this.questionsMapSignal.update(map => {
      const newMap = new Map(map);
      newMap.set(formId, questions);
      return newMap;
    });
  }
  
  /**
   * Initialise les questions d'un formulaire
   */
  setFormQuestions(formId: string, questions: Question[]): void {
    this.updateQuestionsForForm(formId, questions);
  }
  
  /**
   * Efface les questions d'un formulaire
   */
  clearFormQuestions(formId: string): void {
    this.questionsMapSignal.update(map => {
      const newMap = new Map(map);
      newMap.delete(formId);
      return newMap;
    });
  }
  
  /**
   * Réinitialise l'état du service
   */
  resetState(): void {
    this.questionsMapSignal.set(new Map());
    this.loadingSignal.set(false);
  }
  
  /**
   * Déplace une question vers le haut
   */
  moveQuestionUp(formId: string, questionId: string): void {
    const questions = [...this.getFormQuestions(formId)];
    const index = questions.findIndex(q => q._id === questionId);
    
    if (index > 0) {
      [questions[index - 1], questions[index]] = [questions[index], questions[index - 1]];
      this.updateQuestionsForForm(formId, questions);
    }
  }
  
  /**
   * Déplace une question vers le bas
   */
  moveQuestionDown(formId: string, questionId: string): void {
    const questions = [...this.getFormQuestions(formId)];
    const index = questions.findIndex(q => q._id === questionId);
    
    if (index >= 0 && index < questions.length - 1) {
      [questions[index], questions[index + 1]] = [questions[index + 1], questions[index]];
      this.updateQuestionsForForm(formId, questions);
    }
  }
}