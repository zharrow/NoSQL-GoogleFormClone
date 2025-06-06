// src/app/features/forms/form-responses/form-responses.component.ts

import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormService } from '../../../core/services/form.service';
import { AnswerService } from '../../../core/services/answer.service';
import { ToastService } from '../../../core/services/toast.service';
import { FormWithQuestions } from '../../../core/models/form.model';
import { FormResponseDetail, QuestionStats } from '../../../core/models/answer.model';
import { Question, QuestionType, QUESTION_TYPE_CONFIG } from '../../../core/models/question.model';

type ViewMode = 'summary' | 'individual' | 'table';

@Component({
  selector: 'app-form-responses',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: `form-responses.component.html`,
  styleUrls: ['./form-responses.component.css'],
})
export class FormResponsesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly formService = inject(FormService);
  private readonly answerService = inject(AnswerService);
  private readonly toastService = inject(ToastService);

  // État
  formId = '';
  readonly form = signal<FormWithQuestions | null>(null);
  readonly questions = signal<Question[]>([]);
  readonly responses = signal<FormResponseDetail[]>([]);
  readonly isLoading = signal(true);
  readonly viewMode = signal<ViewMode>('summary');
  readonly currentResponseIndex = signal(0);
  
  // Computed
  readonly currentResponse = computed(() => 
    this.responses()[this.currentResponseIndex()]
  );

  QuestionType = QuestionType;

  ngOnInit(): void {
    this.formId = this.route.snapshot.params['id'];
    this.loadData();
  }

  /**
   * Charge les données
   */
  private loadData(): void {
    this.formService.getFormById(this.formId).subscribe({
      next: (form) => {
        this.form.set(form);
        this.questions.set(form.questions || []);
        this.loadResponses();
      },
      error: () => {
        this.toastService.error('Erreur lors du chargement du formulaire');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Charge les réponses
   */
  private loadResponses(): void {
    this.answerService.getFormResponses(this.formId).subscribe({
      next: (responses) => {
        this.responses.set(responses);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Erreur lors du chargement des réponses');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Change le mode de vue
   */
  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  /**
   * Navigation des réponses individuelles
   */
  previousResponse(): void {
    this.currentResponseIndex.update(i => Math.max(0, i - 1));
  }

  nextResponse(): void {
    this.currentResponseIndex.update(i => 
      Math.min(this.responses().length - 1, i + 1)
    );
  }

  /**
   * Statistiques
   */
  getResponseRate(): number {
    const form = this.form();
    if (!form || form.response_count === 0) return 0;
    // TODO: Implémenter avec le nombre de vues
    return 100;
  }

  getAverageTime(): string {
    // TODO: Implémenter avec le temps de complétion
    return '3 min';
  }

  getQuestionResponseCount(questionId: string): number {
    return this.responses().filter(r => 
      r.answers.some(a => a.question_id === questionId)
    ).length;
  }

  /**
   * Réponses texte
   */
  isTextQuestion(type: QuestionType): boolean {
    return [
      QuestionType.SHORT_TEXT,
      QuestionType.LONG_TEXT,
      QuestionType.EMAIL
    ].includes(type);
  }

  getTextResponses(questionId: string): string[] {
    return this.responses()
      .map(r => r.answers.find(a => a.question_id === questionId)?.value)
      .filter(v => v !== null && v !== undefined && v !== '')
      .map(v => String(v));
  }

  showAllTextResponses(questionId: string): void {
    // TODO: Implémenter un modal ou une vue étendue
    console.log('Show all responses for', questionId);
  }

  /**
   * Options
   */
  hasOptions(type: QuestionType): boolean {
    return QUESTION_TYPE_CONFIG[type].hasOptions;
  }

  getOptionCount(questionId: string, option: string): number {
    let count = 0;
    this.responses().forEach(response => {
      const answer = response.answers.find(a => a.question_id === questionId);
      if (!answer) return;
      
      if (Array.isArray(answer.value)) {
        if (answer.value.includes(option)) count++;
      } else if (answer.value === option) {
        count++;
      }
    });
    return count;
  }

  getOptionPercentage(questionId: string, option: string): number {
    const total = this.getQuestionResponseCount(questionId);
    if (total === 0) return 0;
    return Math.round((this.getOptionCount(questionId, option) / total) * 100);
  }

  /**
   * Statistiques numériques
   */
  getNumberStats(questionId: string): { min: number; avg: number; max: number } {
    const values = this.responses()
      .map(r => r.answers.find(a => a.question_id === questionId)?.value)
      .filter(v => typeof v === 'number') as number[];
    
    if (values.length === 0) {
      return { min: 0, avg: 0, max: 0 };
    }
    
    return {
      min: Math.min(...values),
      avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      max: Math.max(...values)
    };
  }

  /**
   * Affichage des réponses
   */
  getAnswerDisplay(response: FormResponseDetail, question: Question): string {
    const answer = response.answers.find(a => a.question_id === question._id);
    if (!answer || answer.value === null || answer.value === undefined) {
      return '-';
    }
    
    if (Array.isArray(answer.value)) {
      return answer.value.join(', ');
    }
    
    if (answer.value instanceof Date) {
      return new Date(answer.value).toLocaleDateString('fr-FR');
    }
    
    return String(answer.value);
  }

  /**
   * Actions
   */
  shareForm(): void {
    const url = `${window.location.origin}/forms/${this.formId}/view`;
    navigator.clipboard.writeText(url).then(() => {
      this.toastService.success('Lien copié dans le presse-papier !');
    });
  }

  exportResponses(): void {
    if (this.responses().length === 0) {
      this.toastService.warning('Aucune réponse à exporter');
      return;
    }
    
    const csv = this.answerService.exportResponsesAsCSV(this.responses());
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${this.form()?.title || 'responses'}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.toastService.success('Export réussi !');
  }

  /**
   * Helpers
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleString('fr-FR');
  }

  trackByQuestionId(index: number, question: Question): string {
    return question._id;
  }
}