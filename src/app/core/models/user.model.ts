// src/app/core/models/user.model.ts

/**
 * Interface représentant un utilisateur
 */
export interface User {
  _id: string;
  email: string;
  username: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Interface pour la création d'un utilisateur
 */
export interface UserCreate {
  email: string;
  username: string;
  password: string;
  full_name?: string;
  is_active?: boolean;
}

/**
 * Interface pour la mise à jour d'un utilisateur
 */
export interface UserUpdate {
  email?: string;
  username?: string;
  full_name?: string;
  password?: string;
  is_active?: boolean;
}

/**
 * Interface pour les credentials de connexion
 */
export interface LoginCredentials {
  username: string; // Peut être email ou username
  password: string;
}

/**
 * Interface pour le token d'authentification
 */
export interface AuthToken {
  access_token: string;
  token_type: string;
}

/**
 * Interface pour les données stockées dans le token JWT
 */
export interface TokenData {
  sub: string; // username
  exp: number; // expiration timestamp
}

/**
 * Type guard pour vérifier si un objet est un User
 */
export function isUser(obj: any): obj is User {
  return obj &&
    typeof obj._id === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.username === 'string' &&
    typeof obj.is_active === 'boolean';
}