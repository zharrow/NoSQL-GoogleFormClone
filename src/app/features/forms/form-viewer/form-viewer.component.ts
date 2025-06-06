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
import { AnswerDraft, AnswerUtils } from '../../../core/models/answer.model';
import e from 'express';

@Component({
  selector: 'app-form-viewer',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="viewer-container">
      <!-- Loading state -->
      <div class="loading-state" *ngIf="isLoading()">
        <div class="loading-spinner">
          <i class="material-icons animate-spin">refresh</i>
        </div>
        <p>Chargement du formulaire...</p>
      </div>

      <!-- Error state -->
      <div class="error-state" *ngIf="error() && !isLoading()">
        <i class="material-icons error-icon">error_outline</i>
        <h2>{{ error() }}</h2>
        <a routerLink="/" class="btn btn-primary">
          Retour à l'accueil
        </a>
      </div>

      <!-- Form not accepting responses -->
      <div 
        class="closed-state" 
        *ngIf="form() && !form()!.accepts_responses && !isLoading()"
      >
        <i class="material-icons closed-icon">lock</i>
        <h2>Ce formulaire n'accepte plus de réponses</h2>
        <p>Le créateur a fermé ce formulaire aux nouvelles réponses.</p>
      </div>

      <!-- Success state -->
      <div class="success-state" *ngIf="isSubmitted()">
        <div class="success-content animate-fadeInUp">
          <i class="material-icons success-icon">check_circle</i>
          <h2>Réponse envoyée !</h2>
          <p>Votre réponse a été enregistrée avec succès.</p>
          
          <div class="success-actions">
            <button class="btn btn-outline" (click)="submitAnother()">
              Envoyer une autre réponse
            </button>
            <a routerLink="/" class="btn btn-primary">
              Retour à l'accueil
            </a>
          </div>
        </div>
      </div>

      <!-- Form content -->
      <div 
        class="form-wrapper" 
        *ngIf="form() && form()!.accepts_responses && !isLoading() && !isSubmitted()"
      >
        <!-- Progress bar -->
        <div class="progress-container">
          <div class="progress-bar">
            <div 
              class="progress-fill"
              [style.width.%]="progress().percentComplete"
            ></div>
          </div>
          <span class="progress-text">
            {{ progress().answeredQuestions }} / {{ progress().totalQuestions }} questions
          </span>
        </div>

        <!-- Form header -->
        <div class="form-header">
          <h1 class="form-title">{{ form()!.title }}</h1>
          <p class="form-description" *ngIf="form()!.description">
            {{ form()!.description }}
          </p>
          <div class="form-meta">
            <span class="required-notice">* Questions obligatoires</span>
          </div>
        </div>

        <!-- Questions -->
        <form (ngSubmit)="submitForm()" class="questions-container">
          <div 
            *ngFor="let question of questions(); let i = index"
            class="question-card animate-fadeIn"
            [class.has-error]="currentErrors()[question._id]"
          >
            <div class="question-header">
              <h3 class="question-title">
                {{ question.title }}
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
                  [(ngModel)]="currentAnswers[question._id]"
                  [name]="'question-' + question._id"
                  (ngModelChange)="updateAnswer(question, $event)"
                  placeholder="Votre réponse"
                  class="text-input"
                  [class.error]="currentErrors()[question._id]"
                />
              </div>

              <!-- Long text -->
              <div *ngIf="question.question_type === QuestionType.LONG_TEXT">
                <textarea
                  [(ngModel)]="currentAnswers[question._id]"
                  [name]="'question-' + question._id"
                  (ngModelChange)="updateAnswer(question, $event)"
                  placeholder="Votre réponse"
                  class="textarea-input"
                  [class.error]="currentErrors()[question._id]"
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
                    [(ngModel)]="currentAnswers[question._id]"
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
                    [name]="'question-' + question._id + '-' + option"
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
                  [(ngModel)]="currentAnswers[question._id]"
                  [name]="'question-' + question._id"
                  (ngModelChange)="updateAnswer(question, $event)"
                  class="select-input"
                  [class.error]="currentErrors()[question._id]"
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
                  [(ngModel)]="currentAnswers[question._id]"
                  [name]="'question-' + question._id"
                  (ngModelChange)="updateAnswer(question, $event)"
                  placeholder="Votre réponse"
                  class="number-input"
                  [class.error]="currentErrors()[question._id]"
                  [min]="question.min_value"
                  [max]="question.max_value"
                />
              </div>

              <!-- Date -->
              <div *ngIf="question.question_type === QuestionType.DATE">
                <input
                  type="date"
                  [(ngModel)]="currentAnswers[question._id]"
                  [name]="'question-' + question._id"
                  (ngModelChange)="updateAnswer(question, $event)"
                  class="date-input"
                  [class.error]="currentErrors()[question._id]"
                />
              </div>

              <!-- Email -->
              <div *ngIf="question.question_type === QuestionType.EMAIL">
                <input
                  type="email"
                  [(ngModel)]="currentAnswers[question._id]"
                  [name]="'question-' + question._id"
                  (ngModelChange)="updateAnswer(question, $event)"
                  placeholder="votre.email@example.com"
                  class="text-input"
                  [class.error]="currentErrors()[question._id]"
                />
              </div>

              <!-- Error message -->
              <div 
                class="error-message" 
                *ngIf="currentErrors()[question._id]"
              >
                {{ currentErrors()[question._id] }}
              </div>
            </div>
          </div>

          <!-- Form actions -->
          <div class="form-actions">
            <button 
              type="button" 
              class="btn btn-outline"
              (click)="clearForm()"
            >
              Effacer le formulaire
            </button>
            <button 
              type="submit" 
              class="btn btn-primary"
              [disabled]="isSubmitting()"
            >
              <span *ngIf="!isSubmitting()">Envoyer</span>
              <span *ngIf="isSubmitting()" class="loading">
                <i class="material-icons animate-spin">refresh</i>
                Envoi en cours...
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrls: ['./form-viewer.component.scss']
})

export class FormViewerComponent implements OnInit {
  ngOnInit(): void {
    this.formId = this.route.snapshot.params['id'];
    this.loadForm();
  }
}