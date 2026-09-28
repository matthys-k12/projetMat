/**
 * Appels HTTP de la gestion des demandes (ADMIN).
 * Tier : présentation → métier. L'API refuse (403) ces routes à un USER.
 */
import { appelerApi } from '@/lib/clientApi';

/** @param {{ page?: number, limit?: number, status?: string, search?: string, from?: string, to?: string }} parametres */
export function listerDemandesAdmin(parametres) {
  return appelerApi('/admin/requests', { parametres });
}

/** @param {string} id @returns {Promise<import('@/fonctionnalites/demandes/api').Demande>} */
export function lireDemandeAdmin(id) {
  return appelerApi(`/admin/requests/${id}`);
}

/** @param {{ id: string, commentaire?: string }} entree */
export function approuverDemande({ id, commentaire }) {
  return appelerApi(`/admin/requests/${id}/approve`, {
    methode: 'PATCH',
    corps: commentaire ? { commentaire } : {},
  });
}

/** @param {{ id: string, commentaire: string }} entree */
export function refuserDemande({ id, commentaire }) {
  return appelerApi(`/admin/requests/${id}/reject`, { methode: 'PATCH', corps: { commentaire } });
}

/** @param {{ id: string }} entree */
export function remettreDemande({ id }) {
  return appelerApi(`/admin/requests/${id}/fulfill`, { methode: 'PATCH' });
}
