// src/app/core/services/keyboard-shortcuts.service.ts

import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { fromEvent } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface KeyboardShortcut {
  keys: string[];
  description: string;
  action: () => void;
  global?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class KeyboardShortcutsService {
  private readonly router = inject(Router);
  private shortcuts = new Map<string, KeyboardShortcut>();
  
  constructor() {
    this.initializeGlobalShortcuts();
    this.listenToKeyboard();
  }
  
  /**
   * Initialise les raccourcis globaux
   */
  private initializeGlobalShortcuts(): void {
    this.registerShortcut({
      keys: ['cmd+k', 'ctrl+k'],
      description: 'Recherche rapide',
      action: () => this.openQuickSearch(),
      global: true
    });
    
    this.registerShortcut({
      keys: ['cmd+n', 'ctrl+n'],
      description: 'Nouveau formulaire',
      action: () => this.router.navigate(['/forms/new']),
      global: true
    });
    
    this.registerShortcut({
      keys: ['cmd+/', 'ctrl+/'],
      description: 'Afficher les raccourcis',
      action: () => this.showShortcutsHelp(),
      global: true
    });
  }
  
  /**
   * Enregistre un raccourci
   */
  registerShortcut(shortcut: KeyboardShortcut): void {
    shortcut.keys.forEach(key => {
      this.shortcuts.set(this.normalizeKey(key), shortcut);
    });
  }
  
  /**
   * Écoute les événements clavier
   */
  private listenToKeyboard(): void {
    fromEvent<KeyboardEvent>(document, 'keydown').pipe(
      filter(event => !this.isInputElement(event.target as Element)),
      map(event => this.getKeyCombo(event)),
      filter(combo => this.shortcuts.has(combo))
    ).subscribe(combo => {
      const shortcut = this.shortcuts.get(combo);
      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    });
  }
  
  /**
   * Génère la combinaison de touches
   */
  private getKeyCombo(event: KeyboardEvent): string {
    const parts = [];
    
    if (event.metaKey || event.ctrlKey) parts.push('cmd');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    
    const key = event.key.toLowerCase();
    if (key !== 'control' && key !== 'meta' && key !== 'alt' && key !== 'shift') {
      parts.push(key);
    }
    
    return parts.join('+');
  }
  
  /**
   * Normalise une clé
   */
  private normalizeKey(key: string): string {
    return key
      .toLowerCase()
      .replace('ctrl', 'cmd')
      .replace('command', 'cmd');
  }
  
  /**
   * Vérifie si l'élément est un input
   */
  private isInputElement(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();
    return tagName === 'input' || 
           tagName === 'textarea' || 
           element.hasAttribute('contenteditable');
  }
  
  /**
   * Actions
   */
  private openQuickSearch(): void {
    // Implémenter la recherche rapide
    console.log('Opening quick search...');
  }
  
  private showShortcutsHelp(): void {
    // Afficher l'aide des raccourcis
    console.log('Showing shortcuts help...');
  }
}