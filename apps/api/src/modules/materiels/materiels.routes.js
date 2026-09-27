/**
 * Routes des matériels.
 *
 * Tier : métier. Chaîne : route → authentification → [rôle ADMIN] → validation → contrôleur → service.
 * - routesMateriels      : /api/v1/materials (catalogue, tout utilisateur connecté)
 * - routesAdminMateriels : /api/v1/admin/materials (ADMIN, protégé dans app.js)
 */
import { Router } from 'express';
import multer from 'multer';
import { valider } from '../../middlewares/validation.js';
import { ErreurApi } from '../../utils/ErreurApi.js';
import { schemaParamsId } from '../../utils/schemasCommuns.js';
import {
  schemaCorpsMateriel,
  schemaFiltresMateriels,
  schemaStatutMateriel,
} from './materiels.schemas.js';
import { TYPES_IMAGE } from './materiels.service.js';
import * as controleur from './materiels.controleur.js';

export const routesMateriels = Router();
routesMateriels.get('/', valider({ query: schemaFiltresMateriels }), controleur.listerCatalogue);
routesMateriels.get('/:id', valider({ params: schemaParamsId }), controleur.lireDuCatalogue);

/**
 * Upload en mémoire (pas de fichier temporaire sur disque), 2 Mo maximum,
 * PNG/JPEG/WebP uniquement : mêmes limites que le bucket Supabase.
 */
const televersement = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, fichier, rappel) => {
    if (TYPES_IMAGE[fichier.mimetype]) return rappel(null, true);
    rappel(new ErreurApi(422, 'INVALID_FILE_TYPE', 'Format accepté : PNG, JPEG ou WebP.'));
  },
});

/**
 * Traduit les erreurs de multer (fichier trop gros…) au format standard.
 * @type {import('express').RequestHandler}
 */
function recevoirImage(req, res, next) {
  televersement.single('image')(req, res, (erreur) => {
    if (erreur?.code === 'LIMIT_FILE_SIZE') {
      return next(new ErreurApi(413, 'FILE_TOO_LARGE', "L'image ne doit pas dépasser 2 Mo."));
    }
    next(erreur);
  });
}

export const routesAdminMateriels = Router();
routesAdminMateriels.get(
  '/',
  valider({ query: schemaFiltresMateriels }),
  controleur.listerPourAdmin,
);
routesAdminMateriels.post('/', valider({ body: schemaCorpsMateriel }), controleur.creer);
routesAdminMateriels.get('/:id', valider({ params: schemaParamsId }), controleur.lirePourAdmin);
routesAdminMateriels.put(
  '/:id',
  valider({ params: schemaParamsId, body: schemaCorpsMateriel }),
  controleur.modifier,
);
routesAdminMateriels.patch(
  '/:id/status',
  valider({ params: schemaParamsId, body: schemaStatutMateriel }),
  controleur.changerStatut,
);
routesAdminMateriels.post(
  '/:id/image',
  valider({ params: schemaParamsId }),
  recevoirImage,
  controleur.televerserImage,
);
