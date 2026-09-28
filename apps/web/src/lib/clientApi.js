/**
 * Client HTTP vers l'API (tier métier).
 *
 * Tier : présentation. Utilisé par : tous les fichiers api.js des fonctionnalités.
 *
 * - Ajoute « Authorization: Bearer <token> » à chaque requête (token de la session Supabase).
 * - Lit le format d'erreur de l'API { statusCode, code, message, details } et lève une ErreurClientApi.
 * - Sur 401 (session expirée ou révoquée) : déconnexion puis redirection vers /login.
 */
import { supabase } from './supabase';

const URL_API = import.meta.env.VITE_API_URL;

/** Erreur lisible renvoyée par l'API (message déjà en français). */
export class ErreurClientApi extends Error {
  /**
   * @param {number} statut statut HTTP (0 si le serveur est injoignable)
   * @param {string} code code stable (ex. INSUFFICIENT_STOCK)
   * @param {string} message message en français
   * @param {unknown} [details]
   */
  constructor(statut, code, message, details) {
    super(message);
    this.name = 'ErreurClientApi';
    this.statut = statut;
    this.code = code;
    this.details = details;
  }
}

/**
 * Déconnecte et renvoie vers la page de connexion (session invalide).
 * Rechargement complet volontaire : vide le cache TanStack Query et l'état en mémoire.
 */
async function deconnecterEtRediriger() {
  await supabase.auth.signOut();
  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

/**
 * Construit la query string en ignorant les valeurs vides.
 * @param {Record<string, unknown>} [parametres]
 * @returns {string} ex. « ?page=2&search=dell » ou chaîne vide
 */
export function construireQuery(parametres) {
  if (!parametres) return '';
  const recherche = new URLSearchParams();
  for (const [cle, valeur] of Object.entries(parametres)) {
    if (valeur !== undefined && valeur !== null && valeur !== '') {
      recherche.set(cle, String(valeur));
    }
  }
  const texte = recherche.toString();
  return texte ? `?${texte}` : '';
}

/**
 * Appelle l'API et renvoie le JSON de la réponse.
 * @param {string} chemin ex. « /requests/me »
 * @param {{ methode?: string, corps?: unknown, parametres?: Record<string, unknown>, formulaire?: FormData }} [options]
 * @returns {Promise<any>}
 * @throws {ErreurClientApi}
 */
export async function appelerApi(chemin, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  /** @type {Record<string, string>} */
  const entetes = {};
  if (token) entetes.Authorization = `Bearer ${token}`;

  let corps;
  if (options.formulaire) {
    corps = options.formulaire; // le navigateur fixe lui-même le Content-Type multipart
  } else if (options.corps !== undefined) {
    entetes['Content-Type'] = 'application/json';
    corps = JSON.stringify(options.corps);
  }

  let reponse;
  try {
    reponse = await fetch(`${URL_API}${chemin}${construireQuery(options.parametres)}`, {
      method: options.methode ?? 'GET',
      headers: entetes,
      body: corps,
    });
  } catch {
    throw new ErreurClientApi(
      0,
      'NETWORK_ERROR',
      "Le serveur n'a pas répondu. Vérifiez votre connexion puis réessayez.",
    );
  }

  if (reponse.status === 401) {
    await deconnecterEtRediriger();
  }
  if (reponse.status === 204) return null;

  const json = await reponse.json().catch(() => null);
  if (!reponse.ok) {
    throw new ErreurClientApi(
      reponse.status,
      json?.code ?? 'UNKNOWN_ERROR',
      json?.message ?? 'Une erreur inattendue est survenue.',
      json?.details,
    );
  }
  return json;
}
