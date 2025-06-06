// src/app/features/forms/components/question-type-selector/question-type-selector.component.ts

import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayModule } from '@angular/cdk/overlay';
import { trigger, transition, style, animate } from '@angular/animations';
import { QuestionType, QUESTION_TYPE_CONFIG } from '../../../../core/models/question.model';

@Component({
  selector: 'app-question-type-selector',
  standalone: true,
  imports: [CommonModule, OverlayModule],
  animations: [
    trigger('dropIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('120ms ease-out', 
          style({ opacity: 1, transform: 'translateY(0)' })
        )
      ]),
      transition(':leave', [
        animate('100ms ease-in', 
          style({ opacity: 0, transform: 'translateY(-10px)' })
        )
      ])
    ])
  ],
  template: `
    <button 
      class="trigger-button"
      (click)="isOpen = !isOpen"
      cdkOverlayOrigin
      #trigger="cdkOverlayOrigin"
    >
      <i class="material-icons">add_circle_outline</i>
      <span>Ajouter une question</span>
    </button>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="trigger"
      [cdkConnectedOverlayOpen]="isOpen"
      [cdkConnectedOverlayPositions]="positions"
      [cdkConnectedOverlayHasBackdrop]="true"
      [cdkConnectedOverlayBackdropClass]="'cdk-overlay-transparent-backdrop'"
      (backdropClick)="close()"
      (detach)="close()"
    >
      <div class="question-types-panel" @dropIn>
        <div class="panel-header">
          <h3>Choisir un type de question</h3>
          <button class="close-btn" (click)="close()">
            <i class="material-icons">close</i>
          </button>
        </div>
        
        <div class="types-grid">
          <button
            *ngFor="let type of questionTypes"
            class="type-card"
            (click)="selectType(type.type)"
            [class.popular]="isPopular(type.type)"
          >
            <div class="type-icon">
              <i class="material-icons">{{ type.icon }}</i>
            </div>
            <div class="type-info">
              <h4>{{ type.label }}</h4>
              <p>{{ type.description }}</p>
            </div>
            <span class="popular-badge" *ngIf="isPopular(type.type)">
              Populaire
            </span>
          </button>
        </div>

        <!-- Raccourcis clavier -->
        <div class="shortcuts-hint">
          <span>Astuce: Utilisez les touches 1-8 pour sélectionner rapidement</span>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    .trigger-button {
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
      transition: all 150ms ease;
    }

    .trigger-button:hover {
      border-color: var(--primary-500);
      color: var(--primary-500);
      background: var(--primary-50);
      transform: translateY(-1px);
    }

    .question-types-panel {
      background: var(--bg-primary);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-2xl);
      width: 600px;
      max-width: 90vw;
      max-height: 80vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .panel-header h3 {
      margin: 0;
      font-size: var(--text-lg);
      font-weight: var(--font-semibold);
    }

    .close-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      border-radius: var(--radius-md);
      color: var(--text-tertiary);
      cursor: pointer;
      transition: all 150ms;
    }

    .close-btn:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }

    .types-grid {
      padding: 1.5rem;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      overflow-y: auto;
      flex: 1;
    }

    .type-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--bg-secondary);
      border: 2px solid transparent;
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all 150ms;
      position: relative;
      text-align: left;
    }

    .type-card:hover {
      background: var(--bg-primary);
      border-color: var(--primary-500);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .type-card.popular {
      border-color: var(--success-200);
      background: var(--success-50);
    }

    .type-icon {
      width: 48px;
      height: 48px;
      background: var(--bg-primary);
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .type-icon i {
      font-size: 24px;
      color: var(--primary-600);
    }

    .type-info {
      flex: 1;
    }

    .type-info h4 {
      margin: 0 0 0.25rem 0;
      font-size: var(--text-base);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
    }

    .type-info p {
      margin: 0;
      font-size: var(--text-xs);
      color: var(--text-secondary);
      line-height: 1.4;
    }

    .popular-badge {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      padding: 0.125rem 0.5rem;
      background: var(--success-500);
      color: white;
      font-size: var(--text-xs);
      font-weight: var(--font-medium);
      border-radius: var(--radius-full);
    }

    .shortcuts-hint {
      padding: 1rem 1.5rem;
      background: var(--bg-secondary);
      border-top: 1px solid var(--border-color);
      text-align: center;
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    @media (max-width: 640px) {
      .types-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
  host: {
    '(document:keydown)': 'handleKeyboard($event)'
  }
})
export class QuestionTypeSelectorComponent {
  @Output() typeSelected = new EventEmitter<QuestionType>();
  
  isOpen = false;
  questionTypes: any = Object.values(QUESTION_TYPE_CONFIG) ?? null;
  
  positions = [
    {
      originX: 'center',
      originY: 'bottom',
      overlayX: 'center',
      overlayY: 'top',
      offsetY: 8
    }
  ];

  private popularTypes = [
    QuestionType.SHORT_TEXT,
    QuestionType.MULTIPLE_CHOICE,
    QuestionType.CHECKBOX
  ];

  selectType(type: QuestionType): void {
    this.typeSelected.emit(type);
    this.close();
  }

  close(): void {
    this.isOpen = false;
  }

  isPopular(type: QuestionType): boolean {
    return this.popularTypes.includes(type);
  }

  handleKeyboard(event: KeyboardEvent): void {
    if (!this.isOpen) return;
    
    const key = parseInt(event.key);
    if (key >= 1 && key <= this.questionTypes.length) {
      event.preventDefault();
      this.selectType(this.questionTypes[key - 1].type);
    } else if (event.key === 'Escape') {
      this.close();
    }
  }
}