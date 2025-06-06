// src/app/core/models/form.model.ts

import { Question } from './question.model';

/**
 * Interface représentant un formulaire
 */
export interface Form {
  _id: string;
  title: string;
  description?: string;
  owner_id: string;
  is_active: boolean;
  accepts_responses: boolean;
  requires_auth: boolean;
  response_count: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Interface pour la création d'un formulaire
 */
export interface FormCreate {
  title: string;
  description?: string;
  is_active?: boolean;
  accepts_responses?: boolean;
  requires_auth?: boolean;
}

/**
 * Interface pour la mise à jour d'un formulaire
 */
export interface FormUpdate {
  title?: string;
  description?: string;
  is_active?: boolean;
  accepts_responses?: boolean;
  requires_auth?: boolean;
}

/**
 * Interface pour un formulaire avec ses questions
 */
export interface FormWithQuestions extends Form {
  questions: Question[];
}

/**
 * Interface pour les statistiques d'un formulaire
 */
export interface FormStats {
  total_responses: number;
  recent_responses: number; // 7 derniers jours
  completion_rate: number;
  average_completion_time?: number; // en secondes
}

/**
 * Statut d'un formulaire
 */
export enum FormStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  CLOSED = 'closed',
  ARCHIVED = 'archived'
}

/**
 * Classe utilitaire pour les opérations sur les formulaires
 */
export class FormUtils {
  /**
   * Détermine le statut d'un formulaire
   */
  static getStatus(form: Form): FormStatus {
    if (!form.is_active) {
      return FormStatus.ARCHIVED;
    }
    if (!form.accepts_responses) {
      return FormStatus.CLOSED;
    }
    if (form.response_count === 0) {
      return FormStatus.DRAFT;
    }
    return FormStatus.ACTIVE;
  }

  /**
   * Vérifie si un formulaire peut recevoir des réponses
   */
  static canAcceptResponses(form: Form): boolean {
    return form.is_active && form.accepts_responses;
  }

  /**
   * Formate la date de création pour l'affichage
   */
  static formatCreatedDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Aujourd\'hui';
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else {
      return new Date(date).toLocaleDateString('fr-FR');
    }
  }
}

/**
 * Type guard pour vérifier si un objet est un Form
 */
export function isForm(obj: any): obj is Form {
  return obj &&
    typeof obj._id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.owner_id === 'string' &&
    typeof obj.is_active === 'boolean';
}