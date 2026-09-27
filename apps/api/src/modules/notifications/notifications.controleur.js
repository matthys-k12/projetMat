/**
 * Contrôleur des notifications (HTTP uniquement).
 *
 * Tier : métier (couche contrôleur).
 */
import * as service from './notifications.service.js';

/**
 * GET /notifications
 * @type {import('express').RequestHandler}
 */
export async function lister(req, res) {
  res.json(await service.listerNotifications(req.utilisateur.id, req.donnees.query));
}

/**
 * GET /notifications/unread-count
 * @type {import('express').RequestHandler}
 */
export async function compterNonLues(req, res) {
  res.json(await service.compterNonLues(req.utilisateur.id));
}

/**
 * PATCH /notifications/:id/read
 * @type {import('express').RequestHandler}
 */
export async function marquerLue(req, res) {
  res.json(await service.marquerCommeLue(req.utilisateur.id, req.donnees.params.id));
}

/**
 * PATCH /notifications/read-all
 * @type {import('express').RequestHandler}
 */
export async function marquerToutesLues(req, res) {
  res.json(await service.marquerToutesCommeLues(req.utilisateur.id));
}
