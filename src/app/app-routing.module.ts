import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { publicGuard } from './core/guards/public.guard';

export const routes: Routes = [
  // Auth routes
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
        canActivate: [publicGuard]
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
        canActivate: [publicGuard]
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  },
  
  // Protected routes with main layout
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'forms',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/forms/form-list/form-list.component').then(m => m.FormListComponent)
          },
          {
            path: 'new',
            loadComponent: () => import('./features/forms/form-builder/form-builder.component').then(m => m.FormBuilderComponent)
          },
          {
            path: ':id/edit',
            loadComponent: () => import('./features/forms/form-builder/form-builder.component').then(m => m.FormBuilderComponent)
          },
          {
            path: ':id/responses',
            loadComponent: () => import('./features/forms/form-responses/form-responses.component').then(m => m.FormResponsesComponent)
          },
          {
            path: ':id',
            redirectTo: ':id/edit',
            pathMatch: 'full'
          }
        ]
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  
  // Public form view route
  {
    path: 'forms/:id/view',
    loadComponent: () => import('./features/forms/form-viewer/form-viewer.component').then(m => m.FormViewerComponent)
  },
  
  // Catch all
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];