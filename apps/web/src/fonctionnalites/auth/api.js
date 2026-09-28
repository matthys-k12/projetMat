/**
 * Appels HTTP de l'authentification.
 * Tier : présentation → métier.
 */
import { appelerApi } from '@/lib/clientApi';

/** GET /auth/me — profil et rôle (lus en base par l'API, jamais dans le token). */
export function lireMonProfil() {
  return appelerApi('/auth/me');
}

/** POST /auth/logout — révocation de la session côté serveur. */
export function revoquerSession() {
  return appelerApi('/auth/logout', { methode: 'POST' });
}
