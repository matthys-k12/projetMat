/**
 * Outils de pagination communs à toutes les listes.
 *
 * Tier : métier.
 * Utilisé par : les services qui renvoient des listes paginées.
 * Format de réponse : { data, meta: { page, limite, total, totalPages } }.
 */

/** Plafond de sécurité : on ne renvoie jamais plus de 50 lignes par page. */
export const LIMITE_MAX = 50;

/**
 * Calcule l'intervalle à passer à `.range(debut, fin)` de supabase-js (bornes incluses).
 * @param {number} page numéro de page (commence à 1)
 * @param {number} limite nombre d'éléments par page
 * @returns {{ debut: number, fin: number }}
 */
export function calculerIntervalle(page, limite) {
  const debut = (page - 1) * limite;
  return { debut, fin: debut + limite - 1 };
}

/**
 * @template T
 * @typedef {Object} ListePaginee
 * @property {T[]} data
 * @property {{ page: number, limite: number, total: number, totalPages: number }} meta
 */

/**
 * Construit la réponse paginée standard.
 * @template T
 * @param {T[]} donnees éléments de la page courante
 * @param {number} total nombre total d'éléments (count: 'exact')
 * @param {number} page
 * @param {number} limite
 * @returns {ListePaginee<T>}
 */
export function construireListePaginee(donnees, total, page, limite) {
  return {
    data: donnees,
    meta: { page, limite, total, totalPages: Math.max(1, Math.ceil(total / limite)) },
  };
}
