/**
 * Appels HTTP de la gestion des catégories (ADMIN).
 * Tier : présentation → métier.
 */
import { appelerApi } from '@/lib/clientApi';

export function listerCategoriesAdmin() {
  return appelerApi('/admin/categories');
}

/** @param {{ nom: string, description: string|null }} corps */
export function creerCategorie(corps) {
  return appelerApi('/admin/categories', { methode: 'POST', corps });
}

/** @param {{ id: string, corps: { nom: string, description: string|null } }} entree */
export function modifierCategorie({ id, corps }) {
  return appelerApi(`/admin/categories/${id}`, { methode: 'PUT', corps });
}

/** @param {{ id: string, actif: boolean }} entree */
export function changerStatutCategorie({ id, actif }) {
  return appelerApi(`/admin/categories/${id}/status`, { methode: 'PATCH', corps: { actif } });
}
