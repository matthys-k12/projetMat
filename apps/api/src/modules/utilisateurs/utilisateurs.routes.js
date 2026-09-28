/**
 * Routes de gestion des comptes (/api/v1/admin/users, ADMIN uniquement, protégé dans app.js).
 *
 * Tier : métier. Chaîne : route → authentification → rôle ADMIN → validation → contrôleur → service.
 * Il n'existe volontairement aucune route d'inscription publique.
 */
import { Router } from 'express';
import { valider } from '../../middlewares/validation.js';
import { schemaParamsId } from '../../utils/schemasCommuns.js';
import {
  schemaCreationUtilisateur,
  schemaFiltresUtilisateurs,
  schemaRoleUtilisateur,
  schemaStatutUtilisateur,
} from './utilisateurs.schemas.js';
import * as controleur from './utilisateurs.controleur.js';

export const routesAdminUtilisateurs = Router();
routesAdminUtilisateurs.get('/', valider({ query: schemaFiltresUtilisateurs }), controleur.lister);
routesAdminUtilisateurs.post('/', valider({ body: schemaCreationUtilisateur }), controleur.creer);
routesAdminUtilisateurs.patch(
  '/:id/status',
  valider({ params: schemaParamsId, body: schemaStatutUtilisateur }),
  controleur.changerStatut,
);
routesAdminUtilisateurs.patch(
  '/:id/role',
  valider({ params: schemaParamsId, body: schemaRoleUtilisateur }),
  controleur.changerRole,
);
routesAdminUtilisateurs.post(
  '/:id/password-reset',
  valider({ params: schemaParamsId }),
  controleur.reinitialiserMotDePasse,
);
