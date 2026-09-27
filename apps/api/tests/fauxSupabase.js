/**
 * Faux client Supabase pour les tests : aucun appel réseau.
 *
 * Chaque test configure :
 * - utilisateurs : token → { user } renvoyé par auth.getUser
 * - tables       : nom de table → résultat { data, error, count } de la requête
 * - rpc          : nom de RPC → résultat { data, error }
 *
 * Le constructeur de requête imite supabase-js : toutes les méthodes (select,
 * eq, order…) renvoient le même objet, et « await » donne le résultat configuré.
 */
import { vi } from 'vitest';

export const etatFaux = {
  /** @type {Record<string, object>} */
  utilisateurs: {},
  /** @type {Record<string, { data: unknown, error?: unknown, count?: number }>} */
  tables: {},
  /** @type {Record<string, { data?: unknown, error?: unknown }>} */
  rpc: {},
};

/** Remet l'état à zéro entre deux tests. */
export function reinitialiserFaux() {
  etatFaux.utilisateurs = {};
  etatFaux.tables = {};
  etatFaux.rpc = {};
}

/**
 * Déclare un utilisateur connecté (token + profil) pour les tests d'API.
 * @param {string} token
 * @param {{ id: string, role: 'USER'|'ADMIN', active?: boolean }} profil
 */
export function connecter(token, profil) {
  etatFaux.utilisateurs[token] = { id: profil.id };
  etatFaux.tables.profiles = {
    data: {
      id: profil.id,
      email: `${profil.id}@test.local`,
      first_name: 'Test',
      last_name: 'Utilisateur',
      role: profil.role,
      active: profil.active ?? true,
    },
    error: null,
  };
}

/**
 * @param {string} table
 */
function creerRequete(table) {
  const resultat = () => etatFaux.tables[table] ?? { data: null, error: null, count: 0 };
  const requete = {
    then: (resoudre, rejeter) => Promise.resolve(resultat()).then(resoudre, rejeter),
    single: () => Promise.resolve(resultat()),
    maybeSingle: () => Promise.resolve(resultat()),
  };
  const methodes = [
    'select',
    'insert',
    'update',
    'eq',
    'in',
    'is',
    'gt',
    'gte',
    'lte',
    'ilike',
    'or',
    'order',
    'range',
    'limit',
  ];
  for (const methode of methodes) {
    requete[methode] = vi.fn(() => requete);
  }
  return requete;
}

export const fauxSupabase = {
  auth: {
    getUser: vi.fn(async (token) => {
      const user = etatFaux.utilisateurs[token];
      if (!user) return { data: { user: null }, error: { message: 'invalid JWT' } };
      return { data: { user }, error: null };
    }),
    admin: { signOut: vi.fn(async () => ({ error: null })) },
  },
  from: vi.fn((table) => creerRequete(table)),
  rpc: vi.fn(async (nom) => etatFaux.rpc[nom] ?? { data: null, error: null }),
};
