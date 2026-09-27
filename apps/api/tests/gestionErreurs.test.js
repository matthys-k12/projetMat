// Tests de la traduction des erreurs RPC / PostgreSQL en réponses HTTP.
import { describe, expect, it, vi } from 'vitest';
import {
  gestionErreurs,
  normaliserErreur,
  traduireErreurSupabase,
} from '../src/middlewares/gestionErreurs.js';
import { ErreurApi } from '../src/utils/ErreurApi.js';

/** Erreur telle que renvoyée par supabase.rpc() quand la fonction SQL lève une exception. */
function erreurRpc(code, details = null) {
  return { message: code, code: 'P0001', details, hint: null };
}

/** Faux objet réponse Express qui mémorise statut et corps. */
function fausseReponse() {
  const res = { statut: 0, corps: null };
  res.status = vi.fn((statut) => {
    res.statut = statut;
    return res;
  });
  res.json = vi.fn((corps) => {
    res.corps = corps;
    return res;
  });
  return res;
}

describe('traduction des codes métier des RPC', () => {
  it('INSUFFICIENT_STOCK → 409 avec un message français incluant le détail', () => {
    const erreur = traduireErreurSupabase(
      erreurRpc('INSUFFICIENT_STOCK', 'Écran LG 27" 4K : demandé 2, disponible 0.'),
    );
    expect(erreur.statutHttp).toBe(409);
    expect(erreur.code).toBe('INSUFFICIENT_STOCK');
    expect(erreur.message).toBe('Stock insuffisant. Écran LG 27" 4K : demandé 2, disponible 0.');
  });

  it.each([
    ['REQUEST_NOT_FOUND', 404],
    ['FORBIDDEN', 403],
    ['USER_NOT_ALLOWED', 403],
    ['INVALID_TRANSITION', 409],
    ['EMPTY_REQUEST', 422],
    ['INVALID_REASON', 422],
    ['INVALID_QUANTITY', 422],
    ['DUPLICATE_MATERIAL', 422],
    ['MATERIAL_UNAVAILABLE', 422],
    ['INVALID_COMMENT', 422],
  ])('%s → %i', (code, statut) => {
    const erreur = traduireErreurSupabase(erreurRpc(code));
    expect(erreur.statutHttp).toBe(statut);
    expect(erreur.code).toBe(code);
    expect(erreur.message).not.toBe(code);
  });

  it('INSUFFICIENT_STOCK avec un détail JSON (base déployée) → phrase lisible', () => {
    const details = JSON.stringify([
      { name: 'Casque Jabra Evolve2 55', requested: 1, available: 0, materialId: 'x' },
    ]);
    const erreur = traduireErreurSupabase(erreurRpc('INSUFFICIENT_STOCK', details));
    expect(erreur.statutHttp).toBe(409);
    expect(erreur.message).toBe(
      'Stock insuffisant. Casque Jabra Evolve2 55 : demandé 1, disponible 0.',
    );
    expect(erreur.details[0].available).toBe(0);
  });

  it('violation de contrainte CHECK (23514) → 422', () => {
    const erreur = traduireErreurSupabase({ message: 'violates check', code: '23514' });
    expect(erreur.statutHttp).toBe(422);
  });

  it('violation d’unicité (23505) → 409', () => {
    const erreur = traduireErreurSupabase({ message: 'duplicate key', code: '23505' });
    expect(erreur.statutHttp).toBe(409);
  });

  it('erreur inconnue de la base → 500 sans fuite du message technique', () => {
    const erreur = traduireErreurSupabase({
      message: 'relation "x" does not exist',
      code: '42P01',
    });
    expect(erreur.statutHttp).toBe(500);
    expect(erreur.message).not.toMatch(/relation/);
  });
});

describe('middleware gestionErreurs', () => {
  it('renvoie le format { statusCode, code, message, details }', () => {
    const res = fausseReponse();
    gestionErreurs(
      new ErreurApi(422, 'VALIDATION_ERROR', 'Motif trop court.', [{ champ: 'motif' }]),
      {},
      res,
      () => {},
    );
    expect(res.statut).toBe(422);
    expect(res.corps).toEqual({
      statusCode: 422,
      code: 'VALIDATION_ERROR',
      message: 'Motif trop court.',
      details: [{ champ: 'motif' }],
    });
  });

  it('ne renvoie pas de stack trace hors développement', () => {
    const res = fausseReponse();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    gestionErreurs(new Error('boum'), {}, res, () => {});
    expect(res.statut).toBe(500);
    expect(res.corps.stack).toBeUndefined();
    expect(res.corps.message).toBe('Une erreur interne est survenue.');
  });

  it('traduit une erreur RPC reçue telle quelle', () => {
    expect(normaliserErreur(erreurRpc('REQUEST_NOT_FOUND')).statutHttp).toBe(404);
  });
});
