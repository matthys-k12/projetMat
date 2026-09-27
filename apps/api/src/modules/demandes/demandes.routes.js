/**
 * Routes des demandes.
 *
 * Tier : métier. Chaîne : route → authentification → [rôle ADMIN] → validation → contrôleur → service → RPC.
 * - routesDemandes      : /api/v1/requests (collaborateur connecté)
 * - routesAdminDemandes : /api/v1/admin/requests (ADMIN, protégé dans app.js)
 */
import { Router } from 'express';
import { valider } from '../../middlewares/validation.js';
import { schemaParamsId } from '../../utils/schemasCommuns.js';
import {
  schemaApprobation,
  schemaCreationDemande,
  schemaFiltresDemandesAdmin,
  schemaFiltresMesDemandes,
  schemaRefus,
} from './demandes.schemas.js';
import * as controleur from './demandes.controleur.js';

export const routesDemandes = Router();
routesDemandes.post('/', valider({ body: schemaCreationDemande }), controleur.creer);
// « /me » doit être déclaré avant « /:id », sinon « me » serait lu comme un identifiant.
routesDemandes.get('/me', valider({ query: schemaFiltresMesDemandes }), controleur.listerMiennes);
routesDemandes.get('/:id', valider({ params: schemaParamsId }), controleur.lire);
routesDemandes.patch('/:id/cancel', valider({ params: schemaParamsId }), controleur.annuler);

export const routesAdminDemandes = Router();
routesAdminDemandes.get(
  '/',
  valider({ query: schemaFiltresDemandesAdmin }),
  controleur.listerPourAdmin,
);
routesAdminDemandes.get('/:id', valider({ params: schemaParamsId }), controleur.lirePourAdmin);
routesAdminDemandes.patch(
  '/:id/approve',
  valider({ params: schemaParamsId, body: schemaApprobation }),
  controleur.approuver,
);
routesAdminDemandes.patch(
  '/:id/reject',
  valider({ params: schemaParamsId, body: schemaRefus }),
  controleur.refuser,
);
routesAdminDemandes.patch('/:id/fulfill', valider({ params: schemaParamsId }), controleur.remettre);
