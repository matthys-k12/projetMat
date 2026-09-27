/**
 * Contrôleur du journal d'audit (HTTP uniquement).
 *
 * Tier : métier (couche contrôleur).
 */
import * as service from './audit.service.js';

/**
 * GET /admin/audit
 * @type {import('express').RequestHandler}
 */
export async function lister(req, res) {
  res.json(await service.listerAudit(req.donnees.query));
}
