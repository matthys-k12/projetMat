/**
 * Contrôleur des catégories (HTTP uniquement : lit la requête validée, appelle le service).
 *
 * Tier : métier (couche contrôleur).
 */
import * as service from './categories.service.js';

/**
 * GET /categories — catégories actives (filtres du catalogue).
 * @type {import('express').RequestHandler}
 */
export async function listerActives(_req, res) {
  res.json(await service.listerCategories(false));
}

/**
 * GET /admin/categories — toutes, avec le nombre de matériels.
 * @type {import('express').RequestHandler}
 */
export async function listerToutes(_req, res) {
  res.json(await service.listerCategories(true));
}

/**
 * POST /admin/categories
 * @type {import('express').RequestHandler}
 */
export async function creer(req, res) {
  const categorie = await service.creerCategorie(req.utilisateur.id, req.donnees.body);
  res.status(201).json(categorie);
}

/**
 * PUT /admin/categories/:id
 * @type {import('express').RequestHandler}
 */
export async function modifier(req, res) {
  const { id } = req.donnees.params;
  res.json(await service.modifierCategorie(req.utilisateur.id, id, req.donnees.body));
}

/**
 * PATCH /admin/categories/:id/status
 * @type {import('express').RequestHandler}
 */
export async function changerStatut(req, res) {
  const { id } = req.donnees.params;
  res.json(await service.changerStatutCategorie(req.utilisateur.id, id, req.donnees.body.actif));
}
