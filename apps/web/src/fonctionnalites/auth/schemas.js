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

/** Mot de passe oublié : seule l'adresse e-mail est demandée. */
export const schemaMotDePasseOublie = schemaConnexion.pick({ email: true });

/**
 * Changement de mot de passe : mêmes règles que l'API (10 caractères minimum,
 * une majuscule, un chiffre) + confirmation identique.
 */
export const schemaChangementMotDePasse = z
  .object({
    nouveauMotDePasse: z
      .string()
      .min(10, { message: 'Le mot de passe doit contenir au moins 10 caractères.' })
      .max(72, { message: 'Le mot de passe est limité à 72 caractères.' })
      .regex(/[A-Z]/, { message: 'Le mot de passe doit contenir au moins une majuscule.' })
      .regex(/[0-9]/, { message: 'Le mot de passe doit contenir au moins un chiffre.' }),
    confirmation: z.string().min(1, { message: 'Confirmez le mot de passe.' }),
  })
  .refine((valeurs) => valeurs.nouveauMotDePasse === valeurs.confirmation, {
    message: 'Les deux mots de passe ne correspondent pas.',
    path: ['confirmation'],
  });
