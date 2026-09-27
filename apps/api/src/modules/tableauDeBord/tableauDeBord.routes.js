/**
 * Routes des tableaux de bord.
 *
 * Tier : métier.
 * - routesTableauDeBord      : /api/v1/dashboard (collaborateur connecté)
 * - routesAdminTableauDeBord : /api/v1/admin/dashboard (ADMIN, protégé dans app.js)
 */
import { Router } from 'express';
import * as controleur from './tableauDeBord.controleur.js';

export const routesTableauDeBord = Router();
routesTableauDeBord.get('/user', controleur.lireUtilisateur);

export const routesAdminTableauDeBord = Router();
routesAdminTableauDeBord.get('/', controleur.lireAdmin);
