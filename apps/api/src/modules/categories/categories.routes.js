/**
 * Routes des catégories.
 *
 * Tier : métier. Chaîne : route → authentification → [rôle ADMIN] → validation → contrôleur → service.
 * - routesCategories      : /api/v1/categories (tout utilisateur connecté)
 * - routesAdminCategories : /api/v1/admin/categories (ADMIN, protégé dans app.js)
 */
import { Router } from 'express';
import { valider } from '../../middlewares/validation.js';
import { schemaParamsId } from '../../utils/schemasCommuns.js';
import { schemaCorpsCategorie, schemaStatutCategorie } from './categories.schemas.js';
import * as controleur from './categories.controleur.js';

export const routesCategories = Router();
routesCategories.get('/', controleur.listerActives);

export const routesAdminCategories = Router();
routesAdminCategories.get('/', controleur.listerToutes);
routesAdminCategories.post('/', valider({ body: schemaCorpsCategorie }), controleur.creer);
routesAdminCategories.put(
  '/:id',
  valider({ params: schemaParamsId, body: schemaCorpsCategorie }),
  controleur.modifier,
);
routesAdminCategories.patch(
  '/:id/status',
  valider({ params: schemaParamsId, body: schemaStatutCategorie }),
  controleur.changerStatut,
);
