/**
 * Schémas de validation des demandes.
 *
 * Tier : métier. Mêmes règles que la RPC create_request et que le front :
 * au moins un article, quantité ≥ 1, pas de doublon, motif de 10 à 1000 caractères.
 */
import { z } from 'zod';
import { schemaPagination, schemaRecherche } from '../../utils/schemasCommuns.js';
import { STATUTS } from './machineEtat.js';

const schemaArticle = z.object({
  materielId: z.uuid({ message: 'Matériel invalide.' }),
  quantite: z
    .number({ message: 'La quantité doit être un nombre.' })
    .int({ message: 'La quantité doit être un nombre entier.' })
    .min(1, { message: 'La quantité doit être au moins égale à 1.' }),
});

/** Corps de POST /requests. */
export const schemaCreationDemande = z.object({
  motif: z
    .string({ message: 'Le motif est obligatoire.' })
    .trim()
    .min(10, { message: 'Le motif doit contenir au moins 10 caractères.' })
    .max(1000, { message: 'Le motif est limité à 1000 caractères.' }),
  articles: z
    .array(schemaArticle, { message: 'La liste des matériels est obligatoire.' })
    .min(1, { message: 'La demande doit contenir au moins un matériel.' })
    .max(50, { message: 'Une demande est limitée à 50 matériels différents.' })
    .refine((articles) => new Set(articles.map((a) => a.materielId)).size === articles.length, {
      message: 'Un même matériel ne peut apparaître qu’une fois dans la demande.',
    }),
});

/**
 * Filtre de statut : un statut ou plusieurs séparés par des virgules
 * (ex. « APPROVED,FULFILLED » pour l'onglet « Acceptées »).
 */
const schemaFiltreStatut = z
  .string()
  .optional()
  .transform((valeur) =>
    valeur ? valeur.split(',').map((s) => s.trim().toUpperCase()) : undefined,
  )
  .refine((statuts) => !statuts || statuts.every((s) => STATUTS.includes(s)), {
    message: `Statut invalide. Valeurs possibles : ${STATUTS.join(', ')}.`,
  });

/** Query de GET /requests/me. */
export const schemaFiltresMesDemandes = schemaPagination.extend({
  status: schemaFiltreStatut,
  search: schemaRecherche,
});

/** Date AAAA-MM-JJ (filtre de période). */
const schemaDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date attendue au format AAAA-MM-JJ.' })
  .optional();

/** Query de GET /admin/requests. */
export const schemaFiltresDemandesAdmin = schemaFiltresMesDemandes.extend({
  from: schemaDate,
  to: schemaDate,
  userId: z.uuid({ message: 'Demandeur invalide.' }).optional(),
});

/** Corps de PATCH /admin/requests/:id/approve. */
export const schemaApprobation = z.object({
  commentaire: z
    .string()
    .trim()
    .max(1000, { message: 'Le commentaire est limité à 1000 caractères.' })
    .optional(),
});

/** Corps de PATCH /admin/requests/:id/reject : le motif est obligatoire. */
export const schemaRefus = z.object({
  commentaire: z
    .string({ message: 'Le motif du refus est obligatoire.' })
    .trim()
    .min(1, { message: 'Le motif du refus est obligatoire.' })
    .max(1000, { message: 'Le motif du refus est limité à 1000 caractères.' }),
});
