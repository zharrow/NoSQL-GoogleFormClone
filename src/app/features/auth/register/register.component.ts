// src/app/features/auth/register/register.component.ts

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Validateur personnalisé pour la confirmation du mot de passe
 */
function passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (!password || !confirmPassword) {
    return null;
  }

  if (password.value !== confirmPassword.value) {
    confirmPassword.setErrors({ passwordMismatch: true });
    return { passwordMismatch: true };
  } else {
    confirmPassword.setErrors(null);
    return null;
  }
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card animate-fadeInUp">
        <div class="auth-header">
          <h1 class="auth-title">Inscription</h1>
          <p class="auth-subtitle">Créez votre compte gratuitement</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form">
          <!-- Email -->
          <div class="form-group">
            <label for="email" class="form-label">Adresse email</label>
            <div class="input-wrapper">
              <i class="material-icons input-icon">email</i>
              <input
                type="email"
                id="email"
                formControlName="email"
                class="form-input"
                placeholder="john.doe@example.com"
                [class.error]="isFieldInvalid('email')"
              />
            </div>
            <div *ngIf="isFieldInvalid('email')" class="error-message">
              <span *ngIf="registerForm.get('email')?.errors?.['required']">
                L'email est requis
              </span>
              <span *ngIf="registerForm.get('email')?.errors?.['email']">
                Format d'email invalide
              </span>
            </div>
          </div>

          <!-- Username -->
          <div class="form-group">
            <label for="username" class="form-label">Nom d'utilisateur</label>
            <div class="input-wrapper">
              <i class="material-icons input-icon">person</i>
              <input
                type="text"
                id="username"
                formControlName="username"
                class="form-input"
                placeholder="johndoe"
                [class.error]="isFieldInvalid('username')"
              />
            </div>
            <div *ngIf="isFieldInvalid('username')" class="error-message">
              <span *ngIf="registerForm.get('username')?.errors?.['required']">
                Le nom d'utilisateur est requis
              </span>
              <span *ngIf="registerForm.get('username')?.errors?.['minlength']">
                Minimum 3 caractères
              </span>
              <span *ngIf="registerForm.get('username')?.errors?.['pattern']">
                Caractères alphanumériques uniquement
              </span>
            </div>
          </div>

          <!-- Full Name -->
          <div class="form-group">
            <label for="fullName" class="form-label">Nom complet (optionnel)</label>
            <div class="input-wrapper">
              <i class="material-icons input-icon">badge</i>
              <input
                type="text"
                id="fullName"
                formControlName="fullName"
                class="form-input"
                placeholder="John Doe"
              />
            </div>
          </div>

          <!-- Password -->
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
              <span *ngIf="registerForm.get('password')?.errors?.['required']">
                Le mot de passe est requis
              </span>
              <span *ngIf="registerForm.get('password')?.errors?.['minlength']">
                Minimum 8 caractères
              </span>
            </div>
            <div class="password-strength">
              <div class="strength-bar">
                <div 
                  class="strength-fill" 
                  [style.width.%]="passwordStrength()"
                  [class.weak]="passwordStrength() <= 33"
                  [class.medium]="passwordStrength() > 33 && passwordStrength() <= 66"
                  [class.strong]="passwordStrength() > 66"
                ></div>
              </div>
              <span class="strength-text">{{ getPasswordStrengthText() }}</span>
            </div>
          </div>

          <!-- Confirm Password -->
          <div class="form-group">
            <label for="confirmPassword" class="form-label">Confirmer le mot de passe</label>
            <div class="input-wrapper">
              <i class="material-icons input-icon">lock_outline</i>
              <input
                [type]="showPassword() ? 'text' : 'password'"
                id="confirmPassword"
                formControlName="confirmPassword"
                class="form-input"
                placeholder="••••••••"
                [class.error]="isFieldInvalid('confirmPassword')"
              />
            </div>
            <div *ngIf="isFieldInvalid('confirmPassword')" class="error-message">
              <span *ngIf="registerForm.get('confirmPassword')?.errors?.['required']">
                Veuillez confirmer le mot de passe
              </span>
              <span *ngIf="registerForm.get('confirmPassword')?.errors?.['passwordMismatch']">
                Les mots de passe ne correspondent pas
              </span>
            </div>
          </div>

          <!-- Terms -->
          <label class="checkbox-wrapper">
            <input type="checkbox" formControlName="acceptTerms" />
            <span class="checkbox-label">
              J'accepte les 
              <a href="#" class="link">conditions d'utilisation</a> et la 
              <a href="#" class="link">politique de confidentialité</a>
            </span>
          </label>
          <div *ngIf="isFieldInvalid('acceptTerms')" class="error-message">
            Vous devez accepter les conditions
          </div>

          <!-- Submit -->
          <button
            type="submit"
            class="btn btn-primary btn-block"
            [disabled]="registerForm.invalid || authService.isLoading()"
          >
            <span *ngIf="!authService.isLoading()">S'inscrire</span>
            <span *ngIf="authService.isLoading()" class="loading">
              <i class="material-icons animate-spin">refresh</i>
              Inscription...
            </span>
          </button>
        </form>

        <!-- Footer -->
        <div class="auth-footer">
          <p>
            Déjà un compte ?
            <a routerLink="/auth/login" class="link">Se connecter</a>
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
      max-width: 450px;
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
      gap: 1.25rem;
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

    .password-strength {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .strength-bar {
      flex: 1;
      height: 4px;
      background: var(--gray-300);
      border-radius: 2px;
      overflow: hidden;
    }

    .strength-fill {
      height: 100%;
      transition: all var(--transition-base);
      border-radius: 2px;
    }

    .strength-fill.weak {
      background: var(--danger-500);
    }

    .strength-fill.medium {
      background: var(--warning-500);
    }

    .strength-fill.strong {
      background: var(--success-500);
    }

    .strength-text {
      font-size: var(--text-xs);
      color: var(--text-secondary);
      min-width: 60px;
    }

    .checkbox-wrapper {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      cursor: pointer;
    }

    .checkbox-wrapper input {
      margin-top: 0.25rem;
    }

    .checkbox-label {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .link {
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
      margin-top: 0.5rem;
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

    .btn-block {
      width: 100%;
    }

    .loading {
      display: flex;
      align-items: center;
      gap: 0.5rem;
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
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  // État local
  readonly showPassword = signal(false);

  // Formulaire avec validation
  registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    username: ['', [
      Validators.required,
      Validators.minLength(3),
      Validators.pattern(/^[a-zA-Z0-9_-]+$/)
    ]],
    fullName: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
    acceptTerms: [false, [Validators.requiredTrue]]
  }, { validators: passwordMatchValidator });

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
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Calcule la force du mot de passe
   */
  passwordStrength(): number {
    const password = this.registerForm.get('password')?.value || '';
    let strength = 0;

    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;

    return Math.min(strength, 100);
  }

  /**
   * Obtient le texte de force du mot de passe
   */
  getPasswordStrengthText(): string {
    const strength = this.passwordStrength();
    if (strength <= 33) return 'Faible';
    if (strength <= 66) return 'Moyen';
    return 'Fort';
  }

  /**
   * Soumet le formulaire d'inscription
   */
  onSubmit(): void {
    if (this.registerForm.invalid) {
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
      return;
    }

    const { email, username, fullName, password } = this.registerForm.value;

    this.authService.register({
      email: email!,
      username: username!,
      password: password!,
      full_name: fullName || undefined
    }).subscribe({
      next: () => {
        this.toastService.success(
          'Inscription réussie ! Vous pouvez maintenant vous connecter.',
          'Bienvenue !'
        );
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        this.toastService.error(
          error.error?.detail || 'Une erreur est survenue lors de l\'inscription',
          'Erreur d\'inscription'
        );
      }
    });
  }
}