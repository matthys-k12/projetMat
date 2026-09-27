/**
 * Gestion centralisée des erreurs : un seul format de réponse pour toute l'API.
 *
 * Tier : métier (dernier middleware de la chaîne, déclaré dans app.js).
 * Format : { statusCode, code, message, details? } — message en français lisible.
 *
 * Les RPC PostgreSQL lèvent des exceptions dont le MESSAGE est un code métier
 * stable (INSUFFICIENT_STOCK…) et le DETAIL un contexte. On les traduit ici en
 * statut HTTP + message français, pour que le front n'ait qu'à afficher `message`.
 */
import { ErreurApi } from '../utils/ErreurApi.js';
import { estEnDeveloppement } from '../config/env.js';

/**
 * Table de traduction des codes métier levés par les RPC.
 * `avecDetails` : le détail SQL est assez parlant pour être ajouté au message
 * (ex. « Écran LG 27" 4K : demandé 2, disponible 0. »).
 * @type {Record<string, { statut: number, message: string, avecDetails?: boolean }>}
 */
export const CODES_METIER = {
  REQUEST_NOT_FOUND: { statut: 404, message: 'Demande introuvable.' },
  FORBIDDEN: { statut: 403, message: 'Action réservée aux administrateurs actifs.' },
  USER_NOT_ALLOWED: { statut: 403, message: 'Votre compte ne permet pas cette action.' },
  INVALID_TRANSITION: {
    statut: 409,
    message: "Cette action n'est plus possible : le statut de la demande a déjà changé.",
  },
  INSUFFICIENT_STOCK: { statut: 409, message: 'Stock insuffisant.', avecDetails: true },
  EMPTY_REQUEST: { statut: 422, message: 'La demande doit contenir au moins un matériel.' },
  INVALID_REASON: { statut: 422, message: 'Le motif doit contenir entre 10 et 1000 caractères.' },
  INVALID_QUANTITY: { statut: 422, message: 'Chaque quantité doit être au moins égale à 1.' },
  DUPLICATE_MATERIAL: {
    statut: 422,
    message: 'Un même matériel ne peut apparaître qu’une fois dans la demande.',
  },
  MATERIAL_UNAVAILABLE: { statut: 422, message: 'Matériel indisponible.', avecDetails: true },
  INVALID_COMMENT: { statut: 422, message: 'Le motif du refus est obligatoire.' },
};

/**
 * Codes d'erreur PostgreSQL / PostgREST gérés explicitement.
 * @type {Record<string, { statut: number, code: string, message: string }>}
 */
const CODES_POSTGRES = {
  23514: {
    statut: 422,
    code: 'CHECK_VIOLATION',
    message: 'Donnée refusée par une règle de la base.',
  },
  23505: { statut: 409, code: 'ALREADY_EXISTS', message: 'Cet élément existe déjà.' },
  23503: {
    statut: 409,
    code: 'FOREIGN_KEY_VIOLATION',
    message: 'Cet élément est utilisé ailleurs et ne peut pas être modifié ainsi.',
  },
  '22P02': { statut: 422, code: 'INVALID_INPUT', message: 'Identifiant ou valeur invalide.' },
  PGRST116: { statut: 404, code: 'NOT_FOUND', message: 'Ressource introuvable.' },
};

/**
 * Indique si l'objet ressemble à une erreur renvoyée par supabase-js / PostgREST.
 * @param {unknown} erreur
 * @returns {boolean}
 */
function estErreurSupabase(erreur) {
  return (
    typeof erreur === 'object' &&
    erreur !== null &&
    'message' in erreur &&
    'code' in erreur &&
    !(erreur instanceof ErreurApi)
  );
}

/**
 * Lit le DETAIL d'une exception RPC. Selon la version de la fonction, c'est soit
 * une phrase (« X : demandé 2, disponible 0. »), soit un tableau JSON
 * [{ name, requested, available, materialId }]. On renvoie une phrase lisible
 * et, si possible, les données structurées (utiles au front).
 * @param {string|null|undefined} details
 * @returns {{ texte: string|null, donnees: unknown }}
 */
export function lireDetailsRpc(details) {
  if (!details) return { texte: null, donnees: undefined };
  try {
    const lignes = JSON.parse(details);
    if (Array.isArray(lignes)) {
      const texte = lignes
        .map((l) => `${l.name} : demandé ${l.requested}, disponible ${l.available}.`)
        .join(' ');
      return { texte, donnees: lignes };
    }
  } catch {
    // Pas du JSON : le détail est déjà une phrase
  }
  return { texte: details, donnees: details };
}

/**
 * Traduit une erreur Supabase (RPC ou requête) en ErreurApi.
 * @param {{ message: string, code?: string, details?: string|null }} erreur
 * @returns {ErreurApi}
 */
export function traduireErreurSupabase(erreur) {
  const metier = CODES_METIER[erreur.message];
  if (metier) {
    const { texte, donnees } = lireDetailsRpc(erreur.details);
    let message = metier.message;
    if (metier.avecDetails && texte) {
      message = `${metier.message} ${texte}`;
    }
    return new ErreurApi(metier.statut, erreur.message, message, donnees);
  }

  const postgres = CODES_POSTGRES[erreur.code ?? ''];
  if (postgres) {
    return new ErreurApi(
      postgres.statut,
      postgres.code,
      postgres.message,
      erreur.details ?? undefined,
    );
  }

  return new ErreurApi(500, 'DATABASE_ERROR', 'Erreur inattendue de la base de données.');
}

/**
 * Convertit n'importe quelle erreur en ErreurApi.
 * @param {unknown} erreur
 * @returns {ErreurApi}
 */
export function normaliserErreur(erreur) {
  if (erreur instanceof ErreurApi) return erreur;
  if (estErreurSupabase(erreur)) return traduireErreurSupabase(erreur);

  // JSON mal formé ou trop volumineux (levés par express.json)
  if (erreur?.type === 'entity.parse.failed') {
    return new ErreurApi(400, 'INVALID_JSON', 'Le corps de la requête n’est pas un JSON valide.');
  }
  if (erreur?.type === 'entity.too.large') {
    return new ErreurApi(413, 'PAYLOAD_TOO_LARGE', 'Le corps de la requête est trop volumineux.');
  }
  return new ErreurApi(500, 'INTERNAL_ERROR', 'Une erreur interne est survenue.');
}

/**
 * Routes inconnues → 404 au format standard.
 * @type {import('express').RequestHandler}
 */
export function routeIntrouvable(req, _res, next) {
  next(new ErreurApi(404, 'ROUTE_NOT_FOUND', `Route introuvable : ${req.method} ${req.path}`));
}

/**
 * Middleware d'erreur Express (4 paramètres obligatoires).
 * Pas de stack trace hors développement : elle révélerait l'organisation du code.
 * @type {import('express').ErrorRequestHandler}
 */
export function gestionErreurs(erreur, _req, res, _next) {
  const erreurApi = normaliserErreur(erreur);

  if (erreurApi.statutHttp >= 500) {
    console.error('[erreur]', erreur);
  }

  const corps = {
    statusCode: erreurApi.statutHttp,
    code: erreurApi.code,
    message: erreurApi.message,
  };
  if (erreurApi.details !== undefined) corps.details = erreurApi.details;
  if (estEnDeveloppement && erreurApi.statutHttp >= 500 && erreur instanceof Error) {
    corps.stack = erreur.stack;
  }

  res.status(erreurApi.statutHttp).json(corps);
}
