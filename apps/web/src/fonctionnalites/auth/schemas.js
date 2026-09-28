/**
 * Schéma zod du formulaire de connexion (messages en français).
 * Tier : présentation.
 */
import { z } from 'zod';

export const schemaConnexion = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "L'adresse e-mail est obligatoire." })
    .email({ message: 'Adresse e-mail invalide.' }),
  motDePasse: z.string().min(1, { message: 'Le mot de passe est obligatoire.' }),
});
