/**
 * Schémas de validation de la gestion des comptes (ADMIN).
 * Tier : métier. Mêmes limites que les contraintes SQL de profiles.
 */
import { z } from 'zod';
import { schemaPagination, schemaRecherche } from '../../utils/schemasCommuns.js';

const schemaRole = z.enum(['USER', 'ADMIN'], { message: 'Rôle invalide (USER ou ADMIN).' });

/** Query de GET /admin/users. */
export const schemaFiltresUtilisateurs = schemaPagination.extend({
  limit: schemaPagination.shape.limit.default(20),
  search: schemaRecherche,
  role: schemaRole.optional(),
  active: z
    .enum(['true', 'false'], { message: 'Filtre « active » invalide (true ou false).' })
    .optional()
    .transform((valeur) => (valeur === undefined ? undefined : valeur === 'true')),
});

/** Corps de POST /admin/users. */
export const schemaCreationUtilisateur = z.object({
  prenom: z
    .string({ message: 'Le prénom est obligatoire.' })
    .trim()
    .min(1, { message: 'Le prénom est obligatoire.' })
    .max(100, { message: 'Le prénom est limité à 100 caractères.' }),
  nom: z
    .string({ message: 'Le nom est obligatoire.' })
    .trim()
    .min(1, { message: 'Le nom est obligatoire.' })
    .max(100, { message: 'Le nom est limité à 100 caractères.' }),
  email: z
    .string({ message: "L'adresse e-mail est obligatoire." })
    .trim()
    .toLowerCase()
    .email({ message: 'Adresse e-mail invalide.' }),
  role: schemaRole.default('USER'),
});

/** Corps de PATCH /admin/users/:id/status. */
export const schemaStatutUtilisateur = z.object({
  actif: z.boolean({ message: 'Le champ « actif » doit être un booléen.' }),
});

/** Corps de PATCH /admin/users/:id/role. */
export const schemaRoleUtilisateur = z.object({ role: schemaRole });
