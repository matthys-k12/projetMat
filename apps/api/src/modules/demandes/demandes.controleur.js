/**
 * Contrôleur des demandes (HTTP uniquement).
 *
 * Tier : métier (couche contrôleur).
 * L'identité passée au service vient TOUJOURS de req.utilisateur (le token),
 * jamais du corps ni de la query : un utilisateur ne peut pas agir au nom d'un autre.
 */
import * as service from './demandes.service.js';

/**
 * POST /requests
 * @type {import('express').RequestHandler}
 */
export async function creer(req, res) {
  const demande = await service.creerDemande(req.utilisateur, req.donnees.body);
  res.status(201).json(demande);
}

/**
 * GET /requests/me
 * @type {import('express').RequestHandler}
 */
export async function listerMiennes(req, res) {
  res.json(await service.listerMesDemandes(req.utilisateur.id, req.donnees.query));
}

/**
 * GET /requests/:id (404 si la demande n'appartient pas à l'utilisateur)
 * @type {import('express').RequestHandler}
 */
export async function lire(req, res) {
  res.json(await service.lireDemande(req.donnees.params.id, req.utilisateur, false));
}

/**
 * PATCH /requests/:id/cancel
 * @type {import('express').RequestHandler}
 */
export async function annuler(req, res) {
  res.json(await service.annulerDemande(req.donnees.params.id, req.utilisateur));
}

/**
 * GET /admin/requests
 * @type {import('express').RequestHandler}
 */
export async function listerPourAdmin(req, res) {
  res.json(await service.listerDemandesAdmin(req.donnees.query));
}

/**
 * GET /admin/requests/:id (avec le stock actuel de chaque matériel)
 * @type {import('express').RequestHandler}
 */
export async function lirePourAdmin(req, res) {
  res.json(await service.lireDemande(req.donnees.params.id, req.utilisateur, true));
}

/**
 * PATCH /admin/requests/:id/approve
 * @type {import('express').RequestHandler}
 */
export async function approuver(req, res) {
  const { id } = req.donnees.params;
  res.json(await service.approuverDemande(id, req.utilisateur, req.donnees.body.commentaire));
}

/**
 * PATCH /admin/requests/:id/reject
 * @type {import('express').RequestHandler}
 */
export async function refuser(req, res) {
  const { id } = req.donnees.params;
  res.json(await service.refuserDemande(id, req.utilisateur, req.donnees.body.commentaire));
}

/**
 * PATCH /admin/requests/:id/fulfill
 * @type {import('express').RequestHandler}
 */
export async function remettre(req, res) {
  res.json(await service.remettreDemande(req.donnees.params.id, req.utilisateur));
}
