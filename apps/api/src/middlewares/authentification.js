/**
 * Middleware d'authentification : vérifie le token Bearer et charge le profil.
 *
 * Tier : métier (couche « middlewares » : route → middlewares → contrôleur → service).
 * Utilisé par : app.js, sur toutes les routes /api/v1 sauf /health.
 *
 * Résultat : req.utilisateur = { id, email, role, prenom, nom }.
 */
import { supabase } from '../config/supabase.js';
import { ErreurApi } from '../utils/ErreurApi.js';

/**
 * @typedef {Object} UtilisateurConnecte
 * @property {string} id
 * @property {string} email
 * @property {'USER'|'ADMIN'} role
 * @property {string} prenom
 * @property {string} nom
 */

/**
 * Extrait le token de l'en-tête « Authorization: Bearer <token> ».
 * @param {string|undefined} entete
 * @returns {string|null}
 */
export function extraireToken(entete) {
  if (!entete) return null;
  const [schema, token] = entete.split(' ');
  if (schema !== 'Bearer' || !token) return null;
  return token;
}

/**
 * Vérifie le token auprès de Supabase Auth, puis charge le profil.
 *
 * Sécurité :
 * - getUser(token) interroge Supabase Auth : un token expiré, révoqué ou
 *   falsifié est refusé (on ne se contente pas de décoder le JWT).
 * - Le rôle est lu dans public.profiles, JAMAIS dans user_metadata, que
 *   l'utilisateur peut modifier lui-même depuis le navigateur.
 * - Un compte désactivé (active = false) est refusé même si son token est valide.
 *
 * @type {import('express').RequestHandler}
 * @throws {ErreurApi} 401 si token absent/invalide, 403 si compte inactif
 */
export async function authentifier(req, _res, next) {
  const token = extraireToken(req.headers.authorization);
  if (!token) {
    throw ErreurApi.nonAuthentifie('Authentification requise : token manquant.');
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    throw ErreurApi.nonAuthentifie('Session invalide ou expirée. Veuillez vous reconnecter.');
  }

  const { data: profil } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, role, active')
    .eq('id', data.user.id)
    .maybeSingle();

  if (!profil) {
    throw ErreurApi.nonAuthentifie('Profil introuvable pour ce compte.');
  }
  if (!profil.active) {
    throw new ErreurApi(403, 'USER_NOT_ALLOWED', 'Votre compte est désactivé.');
  }

  /** @type {UtilisateurConnecte} */
  req.utilisateur = {
    id: profil.id,
    email: profil.email,
    role: profil.role,
    prenom: profil.first_name,
    nom: profil.last_name,
  };
  next();
}
