/**
 * Appels HTTP des demandes (côté collaborateur).
 * Tier : présentation → métier.
 */
import { appelerApi } from '@/lib/clientApi';

/**
 * @typedef {Object} Demande
 * @property {string} id
 * @property {string} reference ex. REQ-2026-000013
 * @property {'PENDING'|'APPROVED'|'REJECTED'|'CANCELLED'|'FULFILLED'} statut
 * @property {string} motif
 * @property {string|null} commentaireAdmin
 * @property {number} [nombreArticles]
 * @property {{ id: string, nomComplet: string, email: string }} [demandeur]
 * @property {{ id: string, quantite: number, materiel: { id: string, nom: string, categorie: string|null, imageUrl: string|null, quantiteDisponible?: number } }[]} [articles]
 * @property {{ id: string, ancienStatut: string|null, nouveauStatut: string, commentaire: string|null, auteur: { nomComplet: string, role: string }|null, date: string }[]} [historique]
 * @property {number} [nombreDemandesDemandeur]
 * @property {string} dateCreation
 * @property {string} dateMiseAJour
 */

/**
 * @param {{ motif: string, articles: { materielId: string, quantite: number }[] }} corps
 * @returns {Promise<Demande>}
 */
export function creerDemande(corps) {
  return appelerApi('/requests', { methode: 'POST', corps });
}

/** @param {{ page?: number, limit?: number, status?: string, search?: string }} parametres */
export function listerMesDemandes(parametres) {
  return appelerApi('/requests/me', { parametres });
}

/** @param {string} id @returns {Promise<Demande>} */
export function lireDemande(id) {
  return appelerApi(`/requests/${id}`);
}

/** @param {string} id @returns {Promise<Demande>} */
export function annulerDemande(id) {
  return appelerApi(`/requests/${id}/cancel`, { methode: 'PATCH' });
}

/** Compteurs par statut du collaborateur (tableau de bord, onglets). */
export function lireMesStatistiques() {
  return appelerApi('/dashboard/user');
}
