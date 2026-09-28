/**
 * Appels HTTP de la gestion des comptes (ADMIN).
 * Tier : présentation → métier.
 */
import { appelerApi } from '@/lib/clientApi';

/**
 * @typedef {Object} Utilisateur
 * @property {string} id
 * @property {string} email
 * @property {string} prenom
 * @property {string} nom
 * @property {string} nomComplet
 * @property {'USER'|'ADMIN'} role
 * @property {boolean} actif
 * @property {boolean} doitChangerMotDePasse
 * @property {string} dateCreation
 */

/** @param {{ page?: number, limit?: number, search?: string, role?: string, active?: string }} parametres */
export function listerUtilisateurs(parametres) {
  return appelerApi('/admin/users', { parametres });
}

/**
 * @param {{ prenom: string, nom: string, email: string, role: 'USER'|'ADMIN' }} corps
 * @returns {Promise<{ utilisateur: Utilisateur, motDePasseTemporaire: string }>}
 */
export function creerUtilisateur(corps) {
  return appelerApi('/admin/users', { methode: 'POST', corps });
}

/** @param {{ id: string, actif: boolean }} entree */
export function changerStatutUtilisateur({ id, actif }) {
  return appelerApi(`/admin/users/${id}/status`, { methode: 'PATCH', corps: { actif } });
}

/** @param {{ id: string, role: 'USER'|'ADMIN' }} entree */
export function changerRoleUtilisateur({ id, role }) {
  return appelerApi(`/admin/users/${id}/role`, { methode: 'PATCH', corps: { role } });
}

/**
 * Nouveau mot de passe temporaire (collaborateur qui a oublié le sien).
 * @param {string} id
 * @returns {Promise<{ utilisateur: Utilisateur, motDePasseTemporaire: string }>}
 */
export function reinitialiserMotDePasse(id) {
  return appelerApi(`/admin/users/${id}/password-reset`, { methode: 'POST' });
}
