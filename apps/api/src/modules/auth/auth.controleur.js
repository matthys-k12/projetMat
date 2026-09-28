/**
 * Contrôleur d'authentification.
 *
 * Tier : métier (couche contrôleur : lit la requête, appelle le service, renvoie la réponse).
 */
import { extraireToken } from '../../middlewares/authentification.js';
import * as serviceAuth from './auth.service.js';

/**
 * GET /auth/me — profil de l'utilisateur connecté (rôle et drapeau lus dans profiles).
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

/**
 * POST /auth/password — remplace le mot de passe (temporaire ou non) de l'utilisateur connecté.
 * @type {import('express').RequestHandler}
 */
export async function changerMotDePasse(req, res) {
  const profil = await serviceAuth.changerMotDePasse(
    req.utilisateur,
    req.donnees.body.nouveauMotDePasse,
  );
  res.json(profil);
}
