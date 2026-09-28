/**
 * Appels HTTP des notifications.
 * Tier : présentation → métier.
 */
import { appelerApi } from '@/lib/clientApi';

/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {string} titre
 * @property {string} message
 * @property {'REQUEST_APPROVED'|'REQUEST_REJECTED'|'REQUEST_FULFILLED'} type
 * @property {string|null} demandeId
 * @property {boolean} lue
 * @property {string} dateCreation
 */

/** @param {{ page?: number, limit?: number, unread?: boolean }} parametres */
export function listerNotifications(parametres) {
  return appelerApi('/notifications', { parametres });
}

/** @returns {Promise<{ nombre: number }>} */
export function compterNonLues() {
  return appelerApi('/notifications/unread-count');
}

/** @param {string} id */
export function marquerCommeLue(id) {
  return appelerApi(`/notifications/${id}/read`, { methode: 'PATCH' });
}

export function marquerToutesCommeLues() {
  return appelerApi('/notifications/read-all', { methode: 'PATCH' });
}
