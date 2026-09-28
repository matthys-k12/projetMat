/**
 * Appels HTTP du catalogue.
 * Tier : présentation → métier.
 */
import { appelerApi } from '@/lib/clientApi';

/**
 * @typedef {Object} Materiel
 * @property {string} id
 * @property {string} nom
 * @property {string|null} description
 * @property {{ id: string, nom: string }|null} categorie
 * @property {string|null} imageUrl
 * @property {number} quantiteTotale
 * @property {number} quantiteDisponible
 * @property {number} stockMinimum
 * @property {'disponible'|'stock_faible'|'indisponible'} disponibilite
 * @property {boolean} actif
 */

/** @param {{ page?: number, limit?: number, search?: string, category?: string, availability?: string, sort?: string }} parametres */
export function listerMateriels(parametres) {
  return appelerApi('/materials', { parametres });
}

/** @param {string} id @returns {Promise<Materiel>} */
export function lireMateriel(id) {
  return appelerApi(`/materials/${id}`);
}

/** Catégories actives (filtres). */
export function listerCategories() {
  return appelerApi('/categories');
}
