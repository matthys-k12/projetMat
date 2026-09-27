/**
 * Contrôleur d'authentification.
 *
 * Tier : métier (couche contrôleur : lit la requête, appelle le service, renvoie la réponse).
 */
import { extraireToken } from '../../middlewares/authentification.js';
import * as serviceAuth from './auth.service.js';

/**
 * GET /auth/me — profil de l'utilisateur connecté (le rôle vient de profiles).
 * @type {import('express').RequestHandler}
 */
export async function lireMoi(req, res) {
  const profil = await serviceAuth.lireProfil(req.utilisateur.id);
  res.json(profil);
}

/**
 * POST /auth/logout — révoque la session côté Supabase.
 * @type {import('express').RequestHandler}
 */
export async function deconnecter(req, res) {
  await serviceAuth.revoquerSession(extraireToken(req.headers.authorization));
  res.status(204).end();
}
