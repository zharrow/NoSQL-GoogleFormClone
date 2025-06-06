// src/app/core/guards/auth.guard.ts

import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard pour protéger les routes nécessitant une authentification
 * Utilise la nouvelle syntaxe fonctionnelle d'Angular 15+
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Vérifier si l'utilisateur est authentifié
  if (authService.checkAuthentication()) {
    return true;
  }
  
  // Rediriger vers la page de connexion avec l'URL de retour
  router.navigate(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });
  
  return false;
};

/**
 * Guard pour les routes admin (si nécessaire)
 */
export const adminGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const currentUser = authService.currentUser();
  
  if (currentUser?.is_superuser) {
    return true;
  }
  
  // Rediriger vers la page d'accès refusé ou dashboard
  router.navigate(['/dashboard']);
  return false;
};