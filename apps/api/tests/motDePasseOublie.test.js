// Mot de passe oublié : lien par e-mail (route publique, sans énumération des comptes),
// révocation des autres sessions, réinitialisation par l'administrateur.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { connecter, etatFaux, fauxSupabase, reinitialiserFaux } from './fauxSupabase.js';

vi.mock('../src/config/supabase.js', () => ({ supabase: fauxSupabase }));
vi.mock('../src/utils/journalAudit.js', () => ({ enregistrerAudit: vi.fn(async () => {}) }));
// Client jetable qui vérifie « nouveau mot de passe ≠ actuel » : ici, jamais identique
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { signInWithPassword: async () => ({ data: { session: null }, error: {} }) },
  }),
}));

const { creerApp } = await import('../src/app.js');
const { enregistrerAudit } = await import('../src/utils/journalAudit.js');
const app = creerApp();

const ID_ADMIN = '22222222-2222-4222-8222-222222222222';
const ID_AUTRE = '33333333-3333-4333-8333-333333333333';

beforeEach(() => {
  reinitialiserFaux();
  vi.clearAllMocks();
});

/** Déclare le profil trouvé (ou non) pour l'adresse demandée. */
function profilTrouve(profil) {
  etatFaux.tables.profiles = { data: profil, error: null };
}

describe('POST /auth/password/forgot (public)', () => {
  it('fonctionne sans token et envoie le lien pour un compte actif', async () => {
    profilTrouve({ id: ID_AUTRE, active: true });
    const reponse = await request(app)
      .post('/api/v1/auth/password/forgot')
      .send({ email: '  Awa.Kone@itrm.demo ' });

    expect(reponse.status).toBe(202);
    expect(fauxSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('awa.kone@itrm.demo', {
      redirectTo: 'http://localhost:5173/reset-password',
    });
    expect(enregistrerAudit.mock.calls[0][1]).toBe('PASSWORD_RESET_REQUESTED');
  });

  it('répond exactement pareil pour une adresse inconnue, sans rien envoyer', async () => {
    profilTrouve({ id: ID_AUTRE, active: true });
    const connu = await request(app)
      .post('/api/v1/auth/password/forgot')
      .send({ email: 'connu@itrm.demo' });
    profilTrouve(null);
    const inconnu = await request(app)
      .post('/api/v1/auth/password/forgot')
      .send({ email: 'inconnu@itrm.demo' });

    expect(inconnu.status).toBe(connu.status);
    expect(inconnu.body).toEqual(connu.body);
    expect(fauxSupabase.auth.resetPasswordForEmail).toHaveBeenCalledTimes(1);
  });

  it("n'envoie rien à un compte désactivé", async () => {
    profilTrouve({ id: ID_AUTRE, active: false });
    const reponse = await request(app)
      .post('/api/v1/auth/password/forgot')
      .send({ email: 'desactive@itrm.demo' });
    expect(reponse.status).toBe(202);
    expect(fauxSupabase.auth.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("limite à un e-mail par minute et par adresse", async () => {
    profilTrouve({ id: ID_AUTRE, active: true });
    for (let essai = 0; essai < 3; essai += 1) {
      await request(app).post('/api/v1/auth/password/forgot').send({ email: 'presse@itrm.demo' });
    }
    expect(fauxSupabase.auth.resetPasswordForEmail).toHaveBeenCalledTimes(1);
  });

  it('refuse une adresse invalide (422)', async () => {
    const reponse = await request(app)
      .post('/api/v1/auth/password/forgot')
      .send({ email: 'pas-une-adresse' });
    expect(reponse.status).toBe(422);
  });

  it("les autres routes /auth restent protégées", async () => {
    const reponse = await request(app).get('/api/v1/auth/me');
    expect(reponse.status).toBe(401);
  });
});

describe('POST /auth/password', () => {
  it('révoque les autres sessions après le changement', async () => {
    connecter('token-recuperation', { id: ID_AUTRE, role: 'USER' });
    const reponse = await request(app)
      .post('/api/v1/auth/password')
      .set('Authorization', 'Bearer token-recuperation')
      .send({ nouveauMotDePasse: 'Materiel2026' });

    expect(reponse.status).toBe(200);
    expect(fauxSupabase.auth.admin.updateUserById).toHaveBeenCalledWith(ID_AUTRE, {
      password: 'Materiel2026',
    });
    expect(fauxSupabase.auth.admin.signOut).toHaveBeenCalledWith('token-recuperation', 'others');
  });
});

describe('POST /admin/users/:id/password-reset', () => {
  it('attribue un nouveau mot de passe temporaire, absent de l’audit', async () => {
    connecter('token-admin', { id: ID_ADMIN, role: 'ADMIN' });
    const reponse = await request(app)
      .post(`/api/v1/admin/users/${ID_AUTRE}/password-reset`)
      .set('Authorization', 'Bearer token-admin');

    expect(reponse.status).toBe(200);
    expect(reponse.headers['cache-control']).toBe('no-store');
    const { motDePasseTemporaire } = reponse.body;
    expect(motDePasseTemporaire).toHaveLength(16);
    expect(fauxSupabase.auth.admin.updateUserById).toHaveBeenCalledWith(ID_AUTRE, {
      password: motDePasseTemporaire,
    });

    const [, action, , , metadonnees] = enregistrerAudit.mock.calls[0];
    expect(action).toBe('USER_PASSWORD_RESET');
    expect(JSON.stringify(metadonnees)).not.toContain(motDePasseTemporaire);
  });

  it("refuse sur son propre compte (409)", async () => {
    connecter('token-admin', { id: ID_ADMIN, role: 'ADMIN' });
    const reponse = await request(app)
      .post(`/api/v1/admin/users/${ID_ADMIN}/password-reset`)
      .set('Authorization', 'Bearer token-admin');
    expect(reponse.status).toBe(409);
    expect(reponse.body.code).toBe('SELF_PASSWORD_RESET');
  });

  it('est interdit à un USER (403)', async () => {
    connecter('token-user', { id: ID_AUTRE, role: 'USER' });
    const reponse = await request(app)
      .post(`/api/v1/admin/users/${ID_ADMIN}/password-reset`)
      .set('Authorization', 'Bearer token-user');
    expect(reponse.status).toBe(403);
    expect(fauxSupabase.auth.admin.updateUserById).not.toHaveBeenCalled();
  });
});
