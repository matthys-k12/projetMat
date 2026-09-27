/**
 * Création de l'application Express : sécurité HTTP, JSON, routes, erreurs.
 *
 * Tier : métier (point d'assemblage de toutes les couches).
 * Utilisé par : server.js (démarrage) et les tests Supertest (sans ouvrir de port).
 *
 * Ordre de la chaîne pour chaque requête :
 *   route → middlewares (authentification, rôle, validation) → contrôleur (HTTP)
 *         → service (règles métier) → Supabase / RPC PostgreSQL
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import express, { Router } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';

import { env } from './config/env.js';
import { authentifier } from './middlewares/authentification.js';
import { exigerRole } from './middlewares/autorisation.js';
import { gestionErreurs, routeIntrouvable } from './middlewares/gestionErreurs.js';

import { routesSante } from './modules/sante/sante.routes.js';
import { routesAuth } from './modules/auth/auth.routes.js';
import { routesAdminMateriels, routesMateriels } from './modules/materiels/materiels.routes.js';
import { routesAdminCategories, routesCategories } from './modules/categories/categories.routes.js';
import { routesAdminDemandes, routesDemandes } from './modules/demandes/demandes.routes.js';
import { routesNotifications } from './modules/notifications/notifications.routes.js';
import {
  routesAdminTableauDeBord,
  routesTableauDeBord,
} from './modules/tableauDeBord/tableauDeBord.routes.js';
import { routesAdminAudit } from './modules/audit/audit.routes.js';

/**
 * Charge la documentation OpenAPI (docs/openapi.yaml).
 * @returns {object}
 */
function chargerOpenApi() {
  const chemin = fileURLToPath(new URL('../docs/openapi.yaml', import.meta.url));
  return YAML.parse(readFileSync(chemin, 'utf8'));
}

/**
 * Routes réservées aux administrateurs. exigerRole('ADMIN') est posé UNE fois
 * sur tout le routeur : impossible d'oublier la protection sur une nouvelle route.
 * @returns {import('express').Router}
 */
function creerRoutesAdmin() {
  const admin = Router();
  admin.use(exigerRole('ADMIN'));
  admin.use('/dashboard', routesAdminTableauDeBord);
  admin.use('/requests', routesAdminDemandes);
  admin.use('/materials', routesAdminMateriels);
  admin.use('/categories', routesAdminCategories);
  admin.use('/audit', routesAdminAudit);
  return admin;
}

/**
 * Routes de l'API v1.
 * @returns {import('express').Router}
 */
function creerRoutesApi() {
  const api = Router();

  // Public : déclaré AVANT le middleware d'authentification
  api.use('/health', routesSante);

  // Tout ce qui suit exige un token valide
  api.use(authentifier);
  api.use('/auth', routesAuth);
  api.use('/materials', routesMateriels);
  api.use('/categories', routesCategories);
  api.use('/requests', routesDemandes);
  api.use('/notifications', routesNotifications);
  api.use('/dashboard', routesTableauDeBord);
  api.use('/admin', creerRoutesAdmin());
  return api;
}

/**
 * Construit l'application Express (sans l'écouter sur un port).
 * @returns {import('express').Express}
 */
export function creerApp() {
  const app = express();

  // Swagger UI charge des scripts inline : on le sert avant helmet (sa CSP les bloquerait).
  // La documentation ne contient aucune donnée, seulement la description des routes.
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(chargerOpenApi()));

  app.use(helmet());
  // CORS : seul le front officiel peut appeler l'API depuis un navigateur
  app.use(cors({ origin: env.WEB_URL }));
  // 100 ko suffisent largement pour nos corps JSON et limitent les abus
  app.use(express.json({ limit: '100kb' }));
  if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

  app.use('/api/v1', creerRoutesApi());

  app.use(routeIntrouvable);
  app.use(gestionErreurs);
  return app;
}
