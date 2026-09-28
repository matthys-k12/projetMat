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

/**
 * POST /auth/password — remplace le mot de passe (temporaire) de l'utilisateur connecté.
 * @param {string} nouveauMotDePasse
 */
export function changerMotDePasse(nouveauMotDePasse) {
  return appelerApi('/auth/password', { methode: 'POST', corps: { nouveauMotDePasse } });
}

/**
 * POST /auth/password/forgot — route publique : l'API fait envoyer un lien de réinitialisation.
 * La réponse est la même que l'adresse ait un compte ou non.
 * @param {string} email
 */
export function demanderReinitialisation(email) {
  return appelerApi('/auth/password/forgot', { methode: 'POST', corps: { email } });
}
