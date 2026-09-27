/**
 * Routes des notifications (/api/v1/notifications).
 *
 * Tier : métier. Chaîne : route → authentification → validation → contrôleur → service.
 */
import { Router } from 'express';
import { z } from 'zod';
import { valider } from '../../middlewares/validation.js';
import { schemaPagination, schemaParamsId } from '../../utils/schemasCommuns.js';
import * as controleur from './notifications.controleur.js';

const schemaFiltresNotifications = schemaPagination.extend({
  unread: z
    .enum(['true', 'false'])
    .optional()
    .transform((valeur) => valeur === 'true'),
});

export const routesNotifications = Router();
routesNotifications.get('/', valider({ query: schemaFiltresNotifications }), controleur.lister);
routesNotifications.get('/unread-count', controleur.compterNonLues);
// « read-all » avant « /:id/read » n'est pas nécessaire (chemins différents), mais reste lisible.
routesNotifications.patch('/read-all', controleur.marquerToutesLues);
routesNotifications.patch('/:id/read', valider({ params: schemaParamsId }), controleur.marquerLue);
