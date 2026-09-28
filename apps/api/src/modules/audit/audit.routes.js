/**
 * Routes du journal d'audit (/api/v1/admin/audit, ADMIN uniquement, protégé dans app.js).
 *
 * Tier : métier. Chaîne : route → authentification → rôle ADMIN → validation → contrôleur → service.
 */
import { Router } from 'express';
import { z } from 'zod';
import { valider } from '../../middlewares/validation.js';
import { schemaPagination } from '../../utils/schemasCommuns.js';
import * as controleur from './audit.controleur.js';

const schemaFiltresAudit = schemaPagination.extend({
  limit: schemaPagination.shape.limit.default(20),
  action: z
    .string()
    .regex(/^[A-Z_]{3,50}$/, { message: 'Action invalide.' })
    .optional(),
  entityType: z
    .enum(['request', 'material', 'category', 'user'], { message: 'Type de ressource invalide.' })
    .optional(),
});

export const routesAdminAudit = Router();
routesAdminAudit.get('/', valider({ query: schemaFiltresAudit }), controleur.lister);
