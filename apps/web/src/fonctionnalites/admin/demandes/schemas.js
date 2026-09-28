/**
 * Schémas zod des décisions admin (mêmes règles que l'API).
 * Tier : présentation.
 */
import { z } from 'zod';

export const COMMENTAIRE_MAX = 1000;

/** Refus : motif obligatoire (contrainte SQL requests_rejected_needs_comment). */
export const schemaRefus = z.object({
  commentaire: z
    .string()
    .trim()
    .min(1, { message: 'Le motif du refus est obligatoire.' })
    .max(COMMENTAIRE_MAX, { message: `Le motif est limité à ${COMMENTAIRE_MAX} caractères.` }),
});
