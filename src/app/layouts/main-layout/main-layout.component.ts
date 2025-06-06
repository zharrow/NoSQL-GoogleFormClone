// src/app/layouts/main-layout/main-layout.component.ts

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastComponent } from '../../shared/components/toast/toast.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, ToastComponent],
  template: `
    <!-- Toast notifications -->
    <app-toast></app-toast>

    <!-- Navigation -->
    <nav class="navbar">
      <div class="navbar-container">
        <!-- Logo -->
        <a routerLink="/dashboard" class="navbar-brand">
          <img src="./FormBuilder.png" alt="FormBuilder Logo" width="64" height="64">
          <!-- <i class="material-icons">description</i>
          <span>FormBuilder</span> -->
        </a>

        <!-- Desktop menu -->
        <div class="navbar-menu" [class.active]="mobileMenuOpen()">
          <a 
            routerLink="/dashboard" 
            routerLinkActive="active"
            class="navbar-link"
            (click)="closeMobileMenu()"
          >
            <i class="material-icons">dashboard</i>
            <span>Tableau de bord</span>
          </a>
          <a 
            routerLink="/forms" 
            routerLinkActive="active"
            class="navbar-link"
            (click)="closeMobileMenu()"
          >
            <i class="material-icons">list_alt</i>
            <span>Mes formulaires</span>
          </a>
          <a 
            routerLink="/forms/new" 
            routerLinkActive="active"
            class="navbar-link"
            (click)="closeMobileMenu()"
          >
            <i class="material-icons">add_circle</i>
            <span>Créer</span>
          </a>
        </div>

        <!-- User menu -->
        <div class="navbar-user">
          <button 
            class="user-button"
            (click)="toggleUserMenu()"
            [class.active]="userMenuOpen()"
          >
            <div class="user-avatar">
              <i class="material-icons">person</i>
            </div>
            <span class="user-name">{{ currentUser()?.username }}</span>
            <i class="material-icons">arrow_drop_down</i>
          </button>

          <!-- Dropdown -->
          <div class="user-dropdown" *ngIf="userMenuOpen()">
            <div class="dropdown-header">
              <p class="dropdown-email">{{ currentUser()?.email }}</p>
            </div>
            <div class="dropdown-divider"></div>
            <a routerLink="/profile" class="dropdown-item" (click)="closeUserMenu()">
              <i class="material-icons">account_circle</i>
              <span>Mon profil</span>
            </a>
            <a routerLink="/settings" class="dropdown-item" (click)="closeUserMenu()">
              <i class="material-icons">settings</i>
              <span>Paramètres</span>
            </a>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item text-danger" (click)="logout()">
              <i class="material-icons">logout</i>
              <span>Déconnexion</span>
            </button>
          </div>
        </div>

        <!-- Mobile menu button -->
        <button 
          class="mobile-menu-button"
          (click)="toggleMobileMenu()"
          [class.active]="mobileMenuOpen()"
        >
          <i class="material-icons">{{ mobileMenuOpen() ? 'close' : 'menu' }}</i>
        </button>
      </div>
    </nav>

    <!-- Main content -->
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    /* Navigation */
    .navbar {
      position: sticky;
      top: 0;
      z-index: var(--z-sticky);
      background: var(--bg-primary);
      border-bottom: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
    }

    .navbar-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 1rem;
      height: 64px;
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: var(--text-xl);
      font-weight: var(--font-bold);
      color: var(--primary-600);
      text-decoration: none;
      transition: all var(--transition-fast);
    }

    .navbar-brand:hover {
      color: var(--primary-700);
      transform: translateY(-1px);
    }

    .navbar-brand i {
      font-size: 28px;
    }

    .navbar-menu {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
    }

    .navbar-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      text-decoration: none;
      font-size: var(--text-base);
      font-weight: var(--font-medium);
      transition: all var(--transition-fast);
    }

    .navbar-link:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }

    .navbar-link.active {
      background: var(--primary-50);
      color: var(--primary-700);
    }

    .navbar-link i {
      font-size: 20px;
    }

    /* User menu */
    .navbar-user {
      position: relative;
      margin-left: auto;
    }

    .user-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: transparent;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-full);
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .user-button:hover,
    .user-button.active {
      background: var(--bg-secondary);
      border-color: var(--border-color-hover);
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--primary-100);
      color: var(--primary-600);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-name {
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      color: var(--text-primary);
    }

    .user-dropdown {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      min-width: 200px;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      overflow: hidden;
      animation: slideInDown var(--transition-base) ease-out;
    }

    .dropdown-header {
      padding: 1rem;
    }

    .dropdown-email {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      margin: 0;
    }

    .dropdown-divider {
      height: 1px;
      background: var(--border-color);
      margin: 0;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      color: var(--text-primary);
      text-decoration: none;
      font-size: var(--text-sm);
      background: transparent;
      border: none;
      width: 100%;
      text-align: left;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .dropdown-item:hover {
      background: var(--bg-secondary);
    }

    .dropdown-item i {
      font-size: 20px;
      color: var(--text-tertiary);
    }

    .dropdown-item.text-danger {
      color: var(--danger-600);
    }

    .dropdown-item.text-danger i {
      color: var(--danger-600);
    }

    /* Mobile menu button */
    .mobile-menu-button {
      display: none;
      padding: 0.5rem;
      background: transparent;
      border: none;
      border-radius: var(--radius-md);
      color: var(--text-primary);
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .mobile-menu-button:hover {
      background: var(--bg-secondary);
    }

    /* Main content */
    .main-content {
      min-height: calc(100vh - 64px);
      background: var(--bg-secondary);
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .navbar-container {
        gap: 1rem;
      }

      .navbar-menu {
        position: fixed;
        top: 64px;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--bg-primary);
        flex-direction: column;
        gap: 0;
        padding: 1rem;
        transform: translateX(-100%);
        transition: transform var(--transition-base);
      }

      .navbar-menu.active {
        transform: translateX(0);
      }

      .navbar-link {
        width: 100%;
        padding: 1rem;
        border-radius: var(--radius-md);
      }

      .navbar-link span {
        flex: 1;
      }

      .mobile-menu-button {
        display: flex;
      }

      .user-name {
        display: none;
      }

      .user-button {
        padding: 0.5rem;
      }
    }

    @media (max-width: 640px) {
      .navbar-brand span {
        display: none;
      }
    }
  `]
})
export class MainLayoutComponent {
  protected readonly authService = inject(AuthService);
  
  // Signals pour l'état des menus
  readonly mobileMenuOpen = signal(false);
  readonly userMenuOpen = signal(false);
  
  // Computed pour l'utilisateur courant
  readonly currentUser = this.authService.currentUser;
  
  /**
   * Toggle le menu mobile
   */
  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(open => !open);
    this.userMenuOpen.set(false);
  }
  
  /**
   * Ferme le menu mobile
   */
  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
  
  /**
   * Toggle le menu utilisateur
   */
  toggleUserMenu(): void {
    this.userMenuOpen.update(open => !open);
    this.mobileMenuOpen.set(false);
  }
  
  /**
   * Ferme le menu utilisateur
   */
  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }
  
  /**
   * Déconnexion
   */
  logout(): void {
    this.closeUserMenu();
    this.authService.logout();
  }
}