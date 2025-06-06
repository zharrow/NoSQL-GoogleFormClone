// src/app/features/auth/login/login.component.ts

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card animate-fadeInUp">
        <div class="auth-header">
          <h1 class="auth-title">Connexion</h1>
          <p class="auth-subtitle">Connectez-vous à votre compte</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form">
          <!-- Email ou Username -->
          <div class="form-group">
            <label for="username" class="form-label">Email ou nom d'utilisateur</label>
            <div class="input-wrapper">
              <i class="material-icons input-icon">person</i>
              <input
                type="text"
                id="username"
                formControlName="username"
                class="form-input"
                placeholder="john.doe@example.com"
                [class.error]="isFieldInvalid('username')"
              />
            </div>
            <div *ngIf="isFieldInvalid('username')" class="error-message">
              Ce champ est requis
            </div>
          </div>

          <!-- Mot de passe -->
          <div class="form-group">
            <label for="password" class="form-label">Mot de passe</label>
            <div class="input-wrapper">
              <i class="material-icons input-icon">lock</i>
              <input
                [type]="showPassword() ? 'text' : 'password'"
                id="password"
                formControlName="password"
                class="form-input"
                placeholder="••••••••"
                [class.error]="isFieldInvalid('password')"
              />
              <button
                type="button"
                class="input-action"
                (click)="togglePassword()"
                tabindex="-1"
              >
                <i class="material-icons">
                  {{ showPassword() ? 'visibility_off' : 'visibility' }}
                </i>
              </button>
            </div>
            <div *ngIf="isFieldInvalid('password')" class="error-message">
              Ce champ est requis
            </div>
          </div>

          <!-- Options -->
          <div class="form-options">
            <label class="checkbox-wrapper">
              <input type="checkbox" formControlName="rememberMe" />
              <span class="checkbox-label">Se souvenir de moi</span>
            </label>
            <a href="#" class="link">Mot de passe oublié ?</a>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            class="btn btn-primary btn-block"
            [disabled]="loginForm.invalid || authService.isLoading()"
          >
            <span *ngIf="!authService.isLoading()">Se connecter</span>
            <span *ngIf="authService.isLoading()" class="loading">
              <i class="material-icons animate-spin">refresh</i>
              Connexion...
            </span>
          </button>

          <!-- Divider -->
          <div class="divider">
            <span>ou</span>
          </div>

          <!-- Social login -->
          <button type="button" class="btn btn-outline btn-block">
            <img src="/assets/icons/google.svg" alt="Google" class="social-icon" />
            Continuer avec Google
          </button>
        </form>

        <!-- Footer -->
        <div class="auth-footer">
          <p>
            Pas encore de compte ?
            <a routerLink="/auth/register" class="link">S'inscrire</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-secondary);
      padding: 1rem;
    }

    .auth-card {
      width: 100%;
      max-width: 400px;
      background: var(--bg-primary);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
      padding: 2rem;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .auth-title {
      font-size: var(--text-3xl);
      font-weight: var(--font-bold);
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
    }

    .auth-subtitle {
      font-size: var(--text-base);
      color: var(--text-secondary);
      margin: 0;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-label {
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      color: var(--text-primary);
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 1rem;
      color: var(--text-tertiary);
      font-size: 20px;
      pointer-events: none;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 3rem;
      font-size: var(--text-base);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-primary);
      color: var(--text-primary);
      transition: all var(--transition-fast);
    }

    .form-input:focus {
      outline: none;
      border-color: var(--primary-500);
      box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
    }

    .form-input.error {
      border-color: var(--danger-500);
    }

    .form-input.error:focus {
      box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.1);
    }

    .input-action {
      position: absolute;
      right: 0.5rem;
      padding: 0.5rem;
      background: transparent;
      border: none;
      border-radius: var(--radius-md);
      color: var(--text-tertiary);
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .input-action:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }

    .error-message {
      font-size: var(--text-xs);
      color: var(--danger-500);
      margin-top: 0.25rem;
    }

    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .checkbox-wrapper {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .checkbox-label {
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .link {
      font-size: var(--text-sm);
      color: var(--primary-600);
      text-decoration: none;
      transition: color var(--transition-fast);
    }

    .link:hover {
      color: var(--primary-700);
      text-decoration: underline;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      font-size: var(--text-base);
      font-weight: var(--font-medium);
      border-radius: var(--radius-md);
      border: none;
      cursor: pointer;
      transition: all var(--transition-fast);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: var(--primary-600);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--primary-700);
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }

    .btn-outline {
      background: transparent;
      color: var(--text-primary);
      border: 1px solid var(--border-color);
    }

    .btn-outline:hover:not(:disabled) {
      background: var(--bg-secondary);
      border-color: var(--border-color-hover);
    }

    .btn-block {
      width: 100%;
    }

    .loading {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .divider {
      position: relative;
      text-align: center;
      margin: 1.5rem 0;
    }

    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: var(--border-color);
    }

    .divider span {
      position: relative;
      background: var(--bg-primary);
      padding: 0 1rem;
      font-size: var(--text-sm);
      color: var(--text-tertiary);
    }

    .social-icon {
      width: 20px;
      height: 20px;
    }

    .auth-footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border-color);
    }

    .auth-footer p {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      margin: 0;
    }

    @media (max-width: 640px) {
      .auth-card {
        padding: 1.5rem;
      }
    }
  `]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  // État local
  readonly showPassword = signal(false);
  private returnUrl = '/dashboard';

  // Formulaire
  loginForm = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
    rememberMe: [false]
  });

  constructor() {
    // Récupérer l'URL de retour
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  /**
   * Toggle la visibilité du mot de passe
   */
  togglePassword(): void {
    this.showPassword.update(show => !show);
  }

  /**
   * Vérifie si un champ est invalide et touché
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Soumet le formulaire de connexion
   */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    const { username, password } = this.loginForm.value;

    this.authService.login({ username: username!, password: password! }).subscribe({
      next: () => {
        this.toastService.success('Connexion réussie !');
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        this.toastService.error(
          error.error?.detail || 'Identifiants incorrects',
          'Erreur de connexion'
        );
      }
    });
  }
}