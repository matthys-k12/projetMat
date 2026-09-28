/**
 * Appels HTTP de la gestion des matériels (ADMIN).
 * Tier : présentation → métier.
 */
import { appelerApi } from '@/lib/clientApi';

/** @param {Record<string, unknown>} parametres */
export function listerMaterielsAdmin(parametres) {
  return appelerApi('/admin/materials', { parametres });
}

/** @param {string} id */
export function lireMaterielAdmin(id) {
  return appelerApi(`/admin/materials/${id}`);
}

/**
 * @typedef {Object} CorpsMateriel
 * @property {string} nom
 * @property {string|null} description
 * @property {string} categorieId
 * @property {number} quantiteTotale
 * @property {number} quantiteDisponible
 * @property {number} stockMinimum
 * @property {boolean} actif
 */

/** @param {CorpsMateriel} corps */
export function creerMateriel(corps) {
  return appelerApi('/admin/materials', { methode: 'POST', corps });
}

/** @param {{ id: string, corps: CorpsMateriel }} entree */
export function modifierMateriel({ id, corps }) {
  return appelerApi(`/admin/materials/${id}`, { methode: 'PUT', corps });
}

/** @param {{ id: string, actif: boolean }} entree */
export function changerStatutMateriel({ id, actif }) {
  return appelerApi(`/admin/materials/${id}/status`, { methode: 'PATCH', corps: { actif } });
}

/** @param {{ id: string, fichier: File }} entree */
export function televerserImage({ id, fichier }) {
  const formulaire = new FormData();
  formulaire.append('image', fichier);
  return appelerApi(`/admin/materials/${id}/image`, { methode: 'POST', formulaire });
}
