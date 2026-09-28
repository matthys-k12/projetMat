/**
 * Schémas de validation de l'authentification.
 * Tier : métier.
 */
import { z } from 'zod';
import { schemaMotDePasse } from '../../utils/motDePasse.js';

/** Corps de POST /auth/password. */
export const schemaChangementMotDePasse = z.object({
  nouveauMotDePasse: schemaMotDePasse,
});
