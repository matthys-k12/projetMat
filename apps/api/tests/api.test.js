// Tests HTTP de bout en bout de l'app Express (Supertest), avec Supabase mocké :
// santé, authentification, autorisation par rôle, et approbation avec stock insuffisant.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { connecter, fauxSupabase, etatFaux, reinitialiserFaux } from './fauxSupabase.js';

vi.mock('../src/config/supabase.js', () => ({ supabase: fauxSupabase }));

const { creerApp } = await import('../src/app.js');
const app = creerApp();

const ID_DEMANDE = '0b6f7a1e-2c3d-4e5f-8a9b-0c1d2e3f4a5b';
const ID_USER = '11111111-1111-4111-8111-111111111111';
const ID_ADMIN = '22222222-2222-4222-8222-222222222222';

beforeEach(() => {
  reinitialiserFaux();
  vi.clearAllMocks();
});

describe('GET /api/v1/health', () => {
  it('répond 200 sans authentification', async () => {
    const reponse = await request(app).get('/api/v1/health');
    expect(reponse.status).toBe(200);
    expect(reponse.body.statut).toBe('ok');
  });
});

describe('middleware d’authentification', () => {
  it('sans token → 401', async () => {
    const reponse = await request(app).get('/api/v1/auth/me');
    expect(reponse.status).toBe(401);
    expect(reponse.body).toMatchObject({ statusCode: 401, code: 'UNAUTHORIZED' });
  });

  it('token invalide → 401', async () => {
    const reponse = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer token-invalide');
    expect(reponse.status).toBe(401);
    expect(reponse.body.message).toMatch(/Session invalide/);
  });

  it('compte désactivé → 403', async () => {
    connecter('token-inactif', { id: ID_USER, role: 'USER', active: false });
    const reponse = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer token-inactif');
    expect(reponse.status).toBe(403);
  });

  it('token valide → profil en camelCase français', async () => {
    connecter('token-user', { id: ID_USER, role: 'USER' });
    const reponse = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer token-user');
    expect(reponse.status).toBe(200);
    expect(reponse.body).toMatchObject({ id: ID_USER, role: 'USER', prenom: 'Test' });
  });
});

describe('autorisation par rôle', () => {
  it('un USER sur /admin/* reçoit 403', async () => {
    connecter('token-user', { id: ID_USER, role: 'USER' });
    const reponse = await request(app)
      .get('/api/v1/admin/requests')
      .set('Authorization', 'Bearer token-user');
    expect(reponse.status).toBe(403);
    expect(reponse.body.code).toBe('FORBIDDEN');
  });

  it('un USER ne peut pas approuver une demande', async () => {
    connecter('token-user', { id: ID_USER, role: 'USER' });
    const reponse = await request(app)
      .patch(`/api/v1/admin/requests/${ID_DEMANDE}/approve`)
      .set('Authorization', 'Bearer token-user');
    expect(reponse.status).toBe(403);
    expect(fauxSupabase.rpc).not.toHaveBeenCalled();
  });
});

describe('PATCH /admin/requests/:id/approve', () => {
  beforeEach(() => {
    connecter('token-admin', { id: ID_ADMIN, role: 'ADMIN' });
  });

  it('stock insuffisant → 409 INSUFFICIENT_STOCK avec message français', async () => {
    etatFaux.tables.requests = { data: { id: ID_DEMANDE, user_id: ID_USER, status: 'PENDING' } };
    etatFaux.rpc.approve_request = {
      data: null,
      error: {
        message: 'INSUFFICIENT_STOCK',
        code: 'P0001',
        details: 'MacBook Air 13" M3 : demandé 1, disponible 0.',
      },
    };

    const reponse = await request(app)
      .patch(`/api/v1/admin/requests/${ID_DEMANDE}/approve`)
      .set('Authorization', 'Bearer token-admin')
      .send({});

    expect(reponse.status).toBe(409);
    expect(reponse.body).toMatchObject({
      statusCode: 409,
      code: 'INSUFFICIENT_STOCK',
      message: 'Stock insuffisant. MacBook Air 13" M3 : demandé 1, disponible 0.',
    });
    // L'identité de l'admin vient du token, jamais du corps de la requête
    expect(fauxSupabase.rpc).toHaveBeenCalledWith('approve_request', {
      p_request_id: ID_DEMANDE,
      p_admin_id: ID_ADMIN,
      p_comment: null,
    });
  });

  it('demande déjà approuvée → 409 sans appeler la RPC (contrôle précoce)', async () => {
    etatFaux.tables.requests = { data: { id: ID_DEMANDE, user_id: ID_USER, status: 'APPROVED' } };

    const reponse = await request(app)
      .patch(`/api/v1/admin/requests/${ID_DEMANDE}/approve`)
      .set('Authorization', 'Bearer token-admin');

    expect(reponse.status).toBe(409);
    expect(reponse.body.code).toBe('INVALID_TRANSITION');
    expect(fauxSupabase.rpc).not.toHaveBeenCalled();
  });

  it('identifiant mal formé → 422', async () => {
    const reponse = await request(app)
      .patch('/api/v1/admin/requests/pas-un-uuid/approve')
      .set('Authorization', 'Bearer token-admin');
    expect(reponse.status).toBe(422);
    expect(reponse.body.message).toBe('Identifiant invalide.');
  });
});

describe('POST /requests', () => {
  it('une quantité à 0 est rejetée avant tout appel à la base', async () => {
    connecter('token-user', { id: ID_USER, role: 'USER' });
    const reponse = await request(app)
      .post('/api/v1/requests')
      .set('Authorization', 'Bearer token-user')
      .send({
        motif: 'Besoin pour le télétravail.',
        articles: [{ materielId: ID_DEMANDE, quantite: 0 }],
      });
    expect(reponse.status).toBe(422);
    expect(fauxSupabase.rpc).not.toHaveBeenCalled();
  });
});

describe('routes inconnues', () => {
  it('renvoie 404 au format standard', async () => {
    const reponse = await request(app).get('/api/v1/inexistant');
    // Toute route non publique exige d'abord un token
    expect(reponse.status).toBe(401);
    const hors = await request(app).get('/nulle-part');
    expect(hors.status).toBe(404);
    expect(hors.body.code).toBe('ROUTE_NOT_FOUND');
  });
});
