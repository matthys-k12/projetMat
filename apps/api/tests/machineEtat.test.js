// Tests unitaires de la machine d'état des demandes (aucune dépendance externe).
import { describe, expect, it } from 'vitest';
import {
  STATUTS,
  TRANSITIONS,
  peutTransitionner,
  verifierTransition,
} from '../src/modules/demandes/machineEtat.js';

const AUTORISEES = [
  ['PENDING', 'APPROVED'],
  ['PENDING', 'REJECTED'],
  ['PENDING', 'CANCELLED'],
  ['APPROVED', 'FULFILLED'],
];

/** Toutes les paires (de, vers) qui ne sont pas dans AUTORISEES. */
const INTERDITES = STATUTS.flatMap((de) => STATUTS.map((vers) => [de, vers])).filter(
  ([de, vers]) => !AUTORISEES.some(([a, b]) => a === de && b === vers),
);

describe('machine d’état des demandes', () => {
  it.each(AUTORISEES)('autorise %s → %s', (de, vers) => {
    expect(peutTransitionner(de, vers)).toBe(true);
    expect(() => verifierTransition(de, vers)).not.toThrow();
  });

  it.each(INTERDITES)('interdit %s → %s', (de, vers) => {
    expect(peutTransitionner(de, vers)).toBe(false);
  });

  it('compte exactement 4 transitions autorisées sur 25 possibles', () => {
    expect(INTERDITES).toHaveLength(21);
  });

  it('les statuts finaux n’ont aucune sortie', () => {
    expect(TRANSITIONS.REJECTED).toEqual([]);
    expect(TRANSITIONS.CANCELLED).toEqual([]);
    expect(TRANSITIONS.FULFILLED).toEqual([]);
  });

  it('lève une erreur 409 INVALID_TRANSITION pour une double approbation', () => {
    try {
      verifierTransition('APPROVED', 'APPROVED');
      expect.unreachable();
    } catch (erreur) {
      expect(erreur.statutHttp).toBe(409);
      expect(erreur.code).toBe('INVALID_TRANSITION');
      expect(erreur.message).toMatch(/statut de la demande a déjà changé/);
    }
  });

  it('refuse un statut inconnu', () => {
    expect(peutTransitionner('INCONNU', 'APPROVED')).toBe(false);
  });
});
