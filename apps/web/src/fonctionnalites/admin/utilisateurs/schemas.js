/**
 * Schéma zod de création d'un compte (mêmes règles que l'API).
 * Tier : présentation.
 */
import { z } from 'zod';

export const schemaNouvelUtilisateur = z.object({
  prenom: z
    .string()
    .trim()
    .min(1, { message: 'Le prénom est obligatoire.' })
    .max(100, { message: 'Le prénom est limité à 100 caractères.' }),
  nom: z
    .string()
    .trim()
    .min(1, { message: 'Le nom est obligatoire.' })
    .max(100, { message: 'Le nom est limité à 100 caractères.' }),
  email: z
    .string()
    .trim()
    .min(1, { message: "L'adresse e-mail est obligatoire." })
    .email({ message: 'Adresse e-mail invalide.' }),
  role: z.enum(['USER', 'ADMIN']),
});
