/**
 * Schémas zod réutilisés par plusieurs modules (identifiants, pagination, recherche).
 *
 * Tier : métier (validation des entrées).
 */
import { z } from 'zod';
import { LIMITE_MAX } from './pagination.js';

/** Paramètre de route :id (UUID). */
export const schemaParamsId = z.object({
  id: z.uuid({ message: 'Identifiant invalide.' }),
});

/**
 * Pagination commune : page ≥ 1, limite entre 1 et 50 (plafond de sécurité).
 * z.coerce convertit les chaînes de la query string en nombres.
 */
export const schemaPagination = z.object({
  page: z.coerce.number().int().min(1, { message: 'La page doit être ≥ 1.' }).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, { message: 'La limite doit être ≥ 1.' })
    .max(LIMITE_MAX, { message: `La limite ne peut pas dépasser ${LIMITE_MAX}.` })
    .default(10),
});

/** Texte de recherche optionnel, nettoyé des espaces. Vide → ignoré. */
export const schemaRecherche = z
  .string()
  .trim()
  .max(100, { message: 'La recherche est limitée à 100 caractères.' })
  .optional()
  .transform((valeur) => valeur || undefined);

/**
 * Neutralise les caractères spéciaux des filtres PostgREST (virgules, parenthèses)
 * et des motifs ILIKE (%, _) : la recherche reste une simple recherche de texte,
 * l'utilisateur ne peut pas injecter de filtre supplémentaire.
 * @param {string} texte
 * @returns {string}
 */
export function nettoyerRecherche(texte) {
  return texte.replace(/[%_,()\\*]/g, ' ').trim();
}
