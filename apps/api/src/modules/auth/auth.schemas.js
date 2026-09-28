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

/** Corps de POST /auth/password/forgot (route publique). */
export const schemaDemandeReinitialisation = z.object({
  email: z
    .string({ message: "L'adresse e-mail est obligatoire." })
    .trim()
    .toLowerCase()
    .email({ message: 'Adresse e-mail invalide.' }),
});
