// src/app/core/services/form.service.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { 
  Form, 
  FormCreate, 
  FormUpdate, 
  FormWithQuestions, 
  FormStats 
} from '../models/form.model';

/**
 * Service pour gérer les formulaires
 * Gère le CRUD et les opérations métier sur les formulaires
 */
@Injectable({
  providedIn: 'root'
})
export class FormService {
  private readonly api = inject(ApiService);
  
  // État réactif des formulaires
  private readonly formsSignal = signal<Form[]>([]);
  private readonly selectedFormSignal = signal<FormWithQuestions | null>(null);
  private readonly loadingSignal = signal(false);
  
  // Computed values
  readonly forms = computed(() => this.formsSignal());
  readonly selectedForm = computed(() => this.selectedFormSignal());
  readonly loading = computed(() => this.loadingSignal());
  readonly formCount = computed(() => this.formsSignal().length);
  
  /**
   * Récupère tous les formulaires de l'utilisateur
   */
  getUserForms(skip = 0, limit = 100): Observable<Form[]> {
    this.loadingSignal.set(true);
    
    return this.api.get<Form[]>('/forms', {
      params: { skip: skip.toString(), limit: limit.toString() }
    }).pipe(
      tap(forms => {
        this.formsSignal.set(forms);
        this.loadingSignal.set(false);
      })
    );
  }
  
  /**
   * Récupère un formulaire avec ses questions
   */
  getFormById(id: string): Observable<FormWithQuestions> {
    this.loadingSignal.set(true);
    
    return this.api.get<FormWithQuestions>(`/forms/${id}`).pipe(
      tap(form => {
        this.selectedFormSignal.set(form);
        this.loadingSignal.set(false);
      })
    );
  }
  
  /**
   * Crée un nouveau formulaire
   */
  createForm(formData: FormCreate): Observable<Form> {
    return this.api.post<Form>('/forms', formData).pipe(
      tap(newForm => {
        this.formsSignal.update(forms => [...forms, newForm]);
      })
    );
  }
  
  /**
   * Met à jour un formulaire
   */
  updateForm(id: string, formData: FormUpdate): Observable<Form> {
    return this.api.patch<Form>(`/forms/${id}`, formData).pipe(
      tap(updatedForm => {
        // Mettre à jour dans la liste
        this.formsSignal.update(forms => 
          forms.map(form => form._id === id ? updatedForm : form)
        );
        
        // Mettre à jour le formulaire sélectionné si c'est le même
        if (this.selectedFormSignal()?._id === id) {
          this.selectedFormSignal.update(form => 
            form ? { ...form, ...updatedForm } : null
          );
        }
      })
    );
  }
  
  /**
   * Supprime un formulaire
   */
  deleteForm(id: string): Observable<any> {
    return this.api.delete(`/forms/${id}`).pipe(
      tap(() => {
        // Retirer de la liste
        this.formsSignal.update(forms => 
          forms.filter(form => form._id !== id)
        );
        
        // Réinitialiser si c'est le formulaire sélectionné
        if (this.selectedFormSignal()?._id === id) {
          this.selectedFormSignal.set(null);
        }
      })
    );
  }
  
  /**
   * Récupère les statistiques d'un formulaire
   */
  getFormStats(id: string): Observable<FormStats> {
    return this.api.get<FormStats>(`/forms/${id}/stats`);
  }
  
  /**
   * Duplique un formulaire
   */
  duplicateForm(id: string): Observable<Form> {
    return this.getFormById(id).pipe(
      tap(form => {
        const duplicate: FormCreate = {
          title: `${form.title} (copie)`,
          description: form.description,
          is_active: false, // Inactif par défaut
          accepts_responses: false,
          requires_auth: form.requires_auth
        };
        
        return this.createForm(duplicate);
      })
    );
  }
  
  /**
   * Recherche des formulaires par titre
   */
  searchForms(query: string): Form[] {
    if (!query) return this.forms();
    
    const lowerQuery = query.toLowerCase();
    return this.forms().filter(form => 
      form.title.toLowerCase().includes(lowerQuery) ||
      form.description?.toLowerCase().includes(lowerQuery)
    );
  }
  
  /**
   * Filtre les formulaires par statut
   */
  filterFormsByStatus(isActive?: boolean, acceptsResponses?: boolean): Form[] {
    return this.forms().filter(form => {
      if (isActive !== undefined && form.is_active !== isActive) {
        return false;
      }
      if (acceptsResponses !== undefined && form.accepts_responses !== acceptsResponses) {
        return false;
      }
      return true;
    });
  }
  
  /**
   * Trie les formulaires
   */
  sortForms(sortBy: 'created' | 'updated' | 'title' | 'responses', order: 'asc' | 'desc' = 'desc'): Form[] {
    const forms = [...this.forms()];
    
    forms.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'created':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'updated':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'responses':
          comparison = a.response_count - b.response_count;
          break;
      }
      
      return order === 'asc' ? comparison : -comparison;
    });
    
    return forms;
  }
  
  /**
   * Réinitialise l'état du service
   */
  resetState(): void {
    this.formsSignal.set([]);
    this.selectedFormSignal.set(null);
    this.loadingSignal.set(false);
  }
}