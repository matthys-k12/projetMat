/**
 * Machine d'état des demandes : transitions de statut autorisées.
 *
 * Tier : métier. Utilisé par : demandes.service.js, avant chaque appel RPC.
 *
 * Pourquoi un double contrôle (ici ET dans la base) ?
 * - Ici : erreur rapide, claire et testable unitairement, sans aller-retour
 *   coûteux avec une transaction qui échouera.
 * - En base (_lock_request_for_transition) : garantie finale, sous verrou
 *   FOR UPDATE. Entre notre lecture et l'appel RPC, un autre admin a pu changer
 *   le statut : seule la base, sous verrou, peut trancher sans course.
 *
 *   PENDING ──► APPROVED ──► FULFILLED
 *      │
 *      ├──► REJECTED
 *      └──► CANCELLED
 */
import { ErreurApi } from '../../utils/ErreurApi.js';

/** @typedef {'PENDING'|'APPROVED'|'REJECTED'|'CANCELLED'|'FULFILLED'} StatutDemande */

/** @type {StatutDemande[]} */
export const STATUTS = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'FULFILLED'];

/**
 * Pour chaque statut, les statuts atteignables. Les statuts finaux n'ont aucune sortie.
 * @type {Record<StatutDemande, StatutDemande[]>}
 */
export const TRANSITIONS = {
  PENDING: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: ['FULFILLED'],
  REJECTED: [],
  CANCELLED: [],
  FULFILLED: [],
};

/**
 * Indique si le passage d'un statut à un autre est autorisé.
 * @param {StatutDemande} statutActuel
 * @param {StatutDemande} statutCible
 * @returns {boolean}
 */
export function peutTransitionner(statutActuel, statutCible) {
  const cibles = TRANSITIONS[statutActuel] ?? [];
  return cibles.includes(statutCible);
}

/**
 * Lève une erreur 409 si la transition est interdite.
 * @param {StatutDemande} statutActuel
 * @param {StatutDemande} statutCible
 * @throws {ErreurApi} 409 INVALID_TRANSITION
 */
export function verifierTransition(statutActuel, statutCible) {
  if (!peutTransitionner(statutActuel, statutCible)) {
    throw new ErreurApi(
      409,
      'INVALID_TRANSITION',
      "Cette action n'est plus possible : le statut de la demande a déjà changé.",
      { statutActuel, statutCible },
    );
  }
}
