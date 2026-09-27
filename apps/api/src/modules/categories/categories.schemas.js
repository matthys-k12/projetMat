/**
 * Schémas de validation des catégories.
 *
 * Tier : métier. Mêmes règles que les contraintes SQL (nom 2–100, description ≤ 500),
 * pour renvoyer un message clair avant même d'interroger la base.
 */
import { z } from 'zod';

export const schemaCorpsCategorie = z.object({
  nom: z
    .string({ message: 'Le nom est obligatoire.' })
    .trim()
    .min(2, { message: 'Le nom doit contenir au moins 2 caractères.' })
    .max(100, { message: 'Le nom est limité à 100 caractères.' }),
  description: z
    .string()
    .trim()
    .max(500, { message: 'La description est limitée à 500 caractères.' })
    .nullish()
    .transform((valeur) => valeur || null),
});

export const schemaStatutCategorie = z.object({
  actif: z.boolean({ message: 'Le champ « actif » doit être un booléen.' }),
});
