/**
 * Contrôleur des matériels (HTTP uniquement).
 *
 * Tier : métier (couche contrôleur). Les données arrivent validées dans req.donnees.
 */
import * as service from './materiels.service.js';
import { ErreurApi } from '../../utils/ErreurApi.js';

/**
 * GET /materials — catalogue (actifs, catégorie active).
 * @type {import('express').RequestHandler}
 */
export async function listerCatalogue(req, res) {
  res.json(await service.listerMateriels(req.donnees.query, false));
}

/**
 * GET /materials/:id
 * @type {import('express').RequestHandler}
 */
export async function lireDuCatalogue(req, res) {
  res.json(await service.lireMateriel(req.donnees.params.id, false));
}

/**
 * GET /admin/materials — inclut les inactifs.
 * @type {import('express').RequestHandler}
 */
export async function listerPourAdmin(req, res) {
  res.json(await service.listerMateriels(req.donnees.query, true));
}

/**
 * GET /admin/materials/:id
 * @type {import('express').RequestHandler}
 */
export async function lirePourAdmin(req, res) {
  res.json(await service.lireMateriel(req.donnees.params.id, true));
}

/**
 * POST /admin/materials
 * @type {import('express').RequestHandler}
 */
export async function creer(req, res) {
  const materiel = await service.creerMateriel(req.utilisateur.id, req.donnees.body);
  res.status(201).json(materiel);
}

/**
 * PUT /admin/materials/:id
 * @type {import('express').RequestHandler}
 */
export async function modifier(req, res) {
  const { id } = req.donnees.params;
  res.json(await service.modifierMateriel(req.utilisateur.id, id, req.donnees.body));
}

/**
 * PATCH /admin/materials/:id/status
 * @type {import('express').RequestHandler}
 */
export async function changerStatut(req, res) {
  const { id } = req.donnees.params;
  res.json(await service.changerStatutMateriel(req.utilisateur.id, id, req.donnees.body.actif));
}

/**
 * POST /admin/materials/:id/image (multipart, champ « image »)
 * @type {import('express').RequestHandler}
 */
export async function televerserImage(req, res) {
  if (!req.file) {
    throw new ErreurApi(422, 'VALIDATION_ERROR', 'Aucune image reçue (champ « image »).');
  }
  const { id } = req.donnees.params;
  res.json(await service.televerserImage(req.utilisateur.id, id, req.file));
}
