// Gestion des comptes : mot de passe temporaire, obligation de le changer,
// création par l'admin, protection contre l'auto-blocage.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { connecter, fauxSupabase, reinitialiserFaux } from './fauxSupabase.js';
import { genererMotDePasseTemporaire, schemaMotDePasse } from '../src/utils/motDePasse.js';

vi.mock('../src/config/supabase.js', () => ({ supabase: fauxSupabase }));
vi.mock('../src/utils/journalAudit.js', () => ({ enregistrerAudit: vi.fn(async () => {}) }));

const { creerApp } = await import('../src/app.js');
const { enregistrerAudit } = await import('../src/utils/journalAudit.js');
const app = creerApp();

const ID_ADMIN = '22222222-2222-4222-8222-222222222222';
const ID_AUTRE = '33333333-3333-4333-8333-333333333333';

beforeEach(() => {
  reinitialiserFaux();
  vi.clearAllMocks();
});

describe('mot de passe temporaire', () => {
  it('fait 16 caractères avec majuscule, minuscule, chiffre et symbole', () => {
    for (let essai = 0; essai < 50; essai += 1) {
      const motDePasse = genererMotDePasseTemporaire();
      expect(motDePasse).toHaveLength(16);
      expect(motDePasse).toMatch(/[A-Z]/);
      expect(motDePasse).toMatch(/[a-z]/);
      expect(motDePasse).toMatch(/[0-9]/);
      expect(motDePasse).toMatch(/[!@#$%&*?\-_]/);
    }
  });

  it('est différent à chaque génération', () => {
    const tirages = new Set(Array.from({ length: 100 }, () => genererMotDePasseTemporaire()));
    expect(tirages.size).toBe(100);
  });
});

describe('règles du nouveau mot de passe', () => {
  it.each([
    ['Court1', 'au moins 10 caractères'],
    ['toutenminuscule1', 'une majuscule'],
    ['SansAucunChiffre', 'un chiffre'],
  ])('refuse « %s » (%s)', (motDePasse, regle) => {
    const resultat = schemaMotDePasse.safeParse(motDePasse);
    expect(resultat.success).toBe(false);
    expect(resultat.error.issues[0].message).toContain(regle);
  });

  it('accepte un mot de passe conforme', () => {
    expect(schemaMotDePasse.safeParse('Materiel2026').success).toBe(true);
  });
});

describe('obligation de changer le mot de passe temporaire', () => {
  beforeEach(() =>
    connecter('token-nouveau', { id: ID_AUTRE, role: 'USER', mustChangePassword: true }),
  );

  it('bloque les routes métier (403 PASSWORD_CHANGE_REQUIRED)', async () => {
    const reponse = await request(app)
      .get('/api/v1/materials')
      .set('Authorization', 'Bearer token-nouveau');
    expect(reponse.status).toBe(403);
    expect(reponse.body.code).toBe('PASSWORD_CHANGE_REQUIRED');
  });

  it('laisse lire son profil, qui signale le changement à faire', async () => {
    const reponse = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer token-nouveau');
    expect(reponse.status).toBe(200);
    expect(reponse.body.doitChangerMotDePasse).toBe(true);
  });

  it('refuse un nouveau mot de passe trop faible (422)', async () => {
    const reponse = await request(app)
      .post('/api/v1/auth/password')
      .set('Authorization', 'Bearer token-nouveau')
      .send({ nouveauMotDePasse: 'faible' });
    expect(reponse.status).toBe(422);
    expect(fauxSupabase.auth.admin.updateUserById).not.toHaveBeenCalled();
  });
});

describe('gestion des comptes par l’administrateur', () => {
  it('un USER ne peut pas lister les comptes (403)', async () => {
    connecter('token-user', { id: ID_AUTRE, role: 'USER' });
    const reponse = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', 'Bearer token-user');
    expect(reponse.status).toBe(403);
  });

  it('crée un compte et renvoie le mot de passe temporaire, absent de l’audit', async () => {
    connecter('token-admin', { id: ID_ADMIN, role: 'ADMIN' });
    const reponse = await request(app)
      .post('/api/v1/admin/users')
      .set('Authorization', 'Bearer token-admin')
      .send({ prenom: 'Awa', nom: 'Koné', email: 'Awa.Kone@itrm.demo', role: 'USER' });

    expect(reponse.status).toBe(201);
    expect(reponse.headers['cache-control']).toBe('no-store');
    const { motDePasseTemporaire } = reponse.body;
    expect(motDePasseTemporaire).toHaveLength(16);

    const creation = fauxSupabase.auth.admin.createUser.mock.calls[0][0];
    expect(creation).toMatchObject({ email: 'awa.kone@itrm.demo', email_confirm: true });
    expect(creation.password).toBe(motDePasseTemporaire);

    const [, action, , , metadonnees] = enregistrerAudit.mock.calls[0];
    expect(action).toBe('USER_CREATED');
    expect(JSON.stringify(metadonnees)).not.toContain(motDePasseTemporaire);
  });

  it('un admin ne peut pas se désactiver lui-même (409)', async () => {
    connecter('token-admin', { id: ID_ADMIN, role: 'ADMIN' });
    const reponse = await request(app)
      .patch(`/api/v1/admin/users/${ID_ADMIN}/status`)
      .set('Authorization', 'Bearer token-admin')
      .send({ actif: false });
    expect(reponse.status).toBe(409);
    expect(reponse.body.code).toBe('SELF_LOCKOUT');
    expect(fauxSupabase.auth.admin.updateUserById).not.toHaveBeenCalled();
  });

  it('un admin ne peut pas se retirer son rôle ADMIN (409)', async () => {
    connecter('token-admin', { id: ID_ADMIN, role: 'ADMIN' });
    const reponse = await request(app)
      .patch(`/api/v1/admin/users/${ID_ADMIN}/role`)
      .set('Authorization', 'Bearer token-admin')
      .send({ role: 'USER' });
    expect(reponse.status).toBe(409);
  });

  it('désactiver un autre compte le bannit aussi dans Supabase Auth', async () => {
    connecter('token-admin', { id: ID_ADMIN, role: 'ADMIN' });
    const reponse = await request(app)
      .patch(`/api/v1/admin/users/${ID_AUTRE}/status`)
      .set('Authorization', 'Bearer token-admin')
      .send({ actif: false });
    expect(reponse.status).toBe(200);
    expect(fauxSupabase.auth.admin.updateUserById).toHaveBeenCalledWith(ID_AUTRE, {
      ban_duration: '876000h',
    });
  });
});
