// src/app/core/models/answer.model.ts

/**
 * Interface représentant une réponse individuelle
 */
export interface Answer {
  _id: string;
  question_id: string;
  form_response_id?: string;
  value: string | string[] | number | Date | null;
  created_at: Date;
}

/**
 * Interface pour créer une réponse
 */
export interface AnswerCreate {
  question_id: string;
  value: string | string[] | number | Date | null;
}

/**
 * Interface représentant une soumission complète
 */
export interface FormResponse {
  _id: string;
  form_id: string;
  respondent_id?: string;
  submitted_at: Date;
  is_complete: boolean;
  is_valid: boolean;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Interface pour créer une soumission
 */
export interface FormResponseCreate {
  answers: AnswerCreate[];
}

/**
 * Interface pour une soumission détaillée avec réponses
 */
export interface FormResponseDetail extends FormResponse {
  answers: Answer[];
}

/**
 * Interface pour la progression d'un formulaire
 */
export interface FormProgress {
  currentQuestionIndex: number;
  totalQuestions: number;
  answeredQuestions: number;
  percentComplete: number;
  isComplete: boolean;
}

/**
 * Interface pour stocker temporairement les réponses
 */
export interface AnswerDraft {
  questionId: string;
  value: any;
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Classe utilitaire pour gérer les réponses
 */
export class AnswerUtils {
  /**
   * Calcule la progression d'un formulaire
   */
  static calculateProgress(
    totalQuestions: number,
    answers: Map<string, AnswerDraft>
  ): FormProgress {
    const answeredQuestions = Array.from(answers.values())
      .filter(answer => answer.value !== null && answer.value !== '')
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
   * Convertit les brouillons en format de soumission
   */
  static draftsToSubmission(
    drafts: Map<string, AnswerDraft>
  ): FormResponseCreate {
    const answers: AnswerCreate[] = [];

    drafts.forEach((draft, questionId) => {
      if (draft.value !== null && draft.value !== '') {
        answers.push({
          question_id: questionId,
          value: draft.value
        });
      }
    });

    return { answers };
  }

  /**
   * Groupe les réponses par question pour l'analyse
   */
  static groupAnswersByQuestion(
    responses: FormResponseDetail[]
  ): Map<string, Answer[]> {
    const grouped = new Map<string, Answer[]>();

    responses.forEach(response => {
      response.answers.forEach(answer => {
        if (!grouped.has(answer.question_id)) {
          grouped.set(answer.question_id, []);
        }
        grouped.get(answer.question_id)!.push(answer);
      });
    });

    return grouped;
  }

  /**
   * Calcule des statistiques basiques pour une question
   */
  static calculateQuestionStats(
    questionType: string,
    answers: Answer[]
  ): QuestionStats {
    const stats: QuestionStats = {
      totalResponses: answers.length,
      uniqueValues: new Set(),
      distribution: new Map()
    };

    answers.forEach(answer => {
      const value = answer.value;
      
      if (value === null || value === undefined) return;

      // Pour les checkbox, traiter chaque option
      if (Array.isArray(value)) {
        value.forEach(v => {
          stats.uniqueValues.add(v);
          stats.distribution.set(
            v,
            (stats.distribution.get(v) || 0) + 1
          );
        });
      } else {
        stats.uniqueValues.add(value);
        stats.distribution.set(
          value,
          (stats.distribution.get(value) || 0) + 1
        );
      }
    });

    return stats;
  }
}

/**
 * Interface pour les statistiques d'une question
 */
export interface QuestionStats {
  totalResponses: number;
  uniqueValues: Set<any>;
  distribution: Map<any, number>;
}

/**
 * Type guard pour vérifier si un objet est un FormResponse
 */
export function isFormResponse(obj: any): obj is FormResponse {
  return obj &&
    typeof obj._id === 'string' &&
    typeof obj.form_id === 'string' &&
    obj.submitted_at instanceof Date;
}