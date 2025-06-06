// src/app/core/models/question.model.ts

/**
 * Types de questions supportés
 */
export enum QuestionType {
  SHORT_TEXT = 'short_text',
  LONG_TEXT = 'long_text',
  MULTIPLE_CHOICE = 'multiple_choice',
  CHECKBOX = 'checkbox',
  DROPDOWN = 'dropdown',
  NUMBER = 'number',
  DATE = 'date',
  EMAIL = 'email'
}

/**
 * Interface représentant une question
 */
export interface Question {
  _id: string;
  form_id: string;
  title: string;
  description?: string;
  question_type: QuestionType;
  is_required: boolean;
  order: number;
  options?: string[]; // Pour multiple_choice, checkbox, dropdown
  min_length?: number; // Pour text
  max_length?: number; // Pour text
  min_value?: number; // Pour number
  max_value?: number; // Pour number
  created_at: Date;
  updated_at: Date;
}

/**
 * Interface pour la création d'une question
 */
export interface QuestionCreate {
  title: string;
  description?: string;
  question_type: QuestionType;
  is_required?: boolean;
  order?: number;
  options?: string[];
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
}

/**
 * Interface pour la mise à jour d'une question
 */
export interface QuestionUpdate {
  title?: string;
  description?: string;
  is_required?: boolean;
  order?: number;
  options?: string[];
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
}

/**
 * Interface pour réordonner les questions
 */
export interface QuestionOrder {
  question_id: string;
  order: number;
}

/**
 * Metadata pour les types de questions
 */
export interface QuestionTypeMetadata {
  type: QuestionType;
  label: string;
  icon: string;
  description: string;
  hasOptions: boolean;
  hasValidation: boolean;
}

/**
 * Configuration des types de questions
 */
export const QUESTION_TYPE_CONFIG: Record<QuestionType, QuestionTypeMetadata> = {
  [QuestionType.SHORT_TEXT]: {
    type: QuestionType.SHORT_TEXT,
    label: 'Texte court',
    icon: 'text_fields',
    description: 'Réponse courte sur une ligne',
    hasOptions: false,
    hasValidation: true
  },
  [QuestionType.LONG_TEXT]: {
    type: QuestionType.LONG_TEXT,
    label: 'Texte long',
    icon: 'subject',
    description: 'Réponse longue sur plusieurs lignes',
    hasOptions: false,
    hasValidation: true
  },
  [QuestionType.MULTIPLE_CHOICE]: {
    type: QuestionType.MULTIPLE_CHOICE,
    label: 'Choix multiple',
    icon: 'radio_button_checked',
    description: 'Une seule réponse parmi plusieurs choix',
    hasOptions: true,
    hasValidation: false
  },
  [QuestionType.CHECKBOX]: {
    type: QuestionType.CHECKBOX,
    label: 'Cases à cocher',
    icon: 'check_box',
    description: 'Plusieurs réponses possibles',
    hasOptions: true,
    hasValidation: false
  },
  [QuestionType.DROPDOWN]: {
    type: QuestionType.DROPDOWN,
    label: 'Liste déroulante',
    icon: 'arrow_drop_down_circle',
    description: 'Sélection dans une liste',
    hasOptions: true,
    hasValidation: false
  },
  [QuestionType.NUMBER]: {
    type: QuestionType.NUMBER,
    label: 'Nombre',
    icon: 'pin',
    description: 'Réponse numérique',
    hasOptions: false,
    hasValidation: true
  },
  [QuestionType.DATE]: {
    type: QuestionType.DATE,
    label: 'Date',
    icon: 'event',
    description: 'Sélection d\'une date',
    hasOptions: false,
    hasValidation: false
  },
  [QuestionType.EMAIL]: {
    type: QuestionType.EMAIL,
    label: 'Email',
    icon: 'email',
    description: 'Adresse email valide',
    hasOptions: false,
    hasValidation: false
  }
};

/**
 * Classe utilitaire pour les opérations sur les questions
 */
export class QuestionUtils {
  /**
   * Vérifie si un type de question nécessite des options
   */
  static requiresOptions(type: QuestionType): boolean {
    return QUESTION_TYPE_CONFIG[type].hasOptions;
  }

  /**
   * Obtient la valeur par défaut pour un type de question
   */
  static getDefaultValue(type: QuestionType): any {
    switch (type) {
      case QuestionType.CHECKBOX:
        return [];
      case QuestionType.NUMBER:
        return null;
      case QuestionType.DATE:
        return null;
      default:
        return '';
    }
  }

  /**
   * Valide une réponse selon le type de question
   */
  static validateAnswer(question: Question, value: any): string | null {
    // Validation requise
    if (question.is_required) {
      if (value === null || value === undefined || value === '') {
        return 'Cette question est obligatoire';
      }
      if (Array.isArray(value) && value.length === 0) {
        return 'Veuillez sélectionner au moins une option';
      }
    }

    // Validation spécifique par type
    switch (question.question_type) {
      case QuestionType.SHORT_TEXT:
      case QuestionType.LONG_TEXT:
        if (typeof value !== 'string') return 'Réponse invalide';
        if (question.min_length && value.length < question.min_length) {
          return `Minimum ${question.min_length} caractères requis`;
        }
        if (question.max_length && value.length > question.max_length) {
          return `Maximum ${question.max_length} caractères autorisés`;
        }
        break;

      case QuestionType.NUMBER:
        if (value !== null && typeof value !== 'number') {
          return 'Veuillez entrer un nombre valide';
        }
        if (question.min_value !== undefined && value < question.min_value) {
          return `La valeur minimale est ${question.min_value}`;
        }
        if (question.max_value !== undefined && value > question.max_value) {
          return `La valeur maximale est ${question.max_value}`;
        }
        break;

      case QuestionType.EMAIL:
        if (value && !this.isValidEmail(value)) {
          return 'Veuillez entrer une adresse email valide';
        }
        break;

      case QuestionType.MULTIPLE_CHOICE:
      case QuestionType.DROPDOWN:
        if (value && !question.options?.includes(value)) {
          return 'Option invalide';
        }
        break;

      case QuestionType.CHECKBOX:
        if (!Array.isArray(value)) return 'Format de réponse invalide';
        for (const option of value) {
          if (!question.options?.includes(option)) {
            return 'Une ou plusieurs options invalides';
          }
        }
        break;
    }

    return null; // Pas d'erreur
  }

  /**
   * Valide un email
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}