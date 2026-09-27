/**
 * Contrôleur des tableaux de bord (HTTP uniquement).
 *
 * Tier : métier (couche contrôleur).
 */
import * as service from './tableauDeBord.service.js';

/**
 * GET /dashboard/user
 * @type {import('express').RequestHandler}
 */
export async function lireUtilisateur(req, res) {
  res.json(await service.lireStatsUtilisateur(req.utilisateur.id));
}

/**
 * GET /admin/dashboard
 * @type {import('express').RequestHandler}
 */
export async function lireAdmin(_req, res) {
  res.json(await service.lireStatsAdmin());
}
