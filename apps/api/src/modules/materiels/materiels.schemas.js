/**
 * Schémas de validation des matériels (catalogue et administration).
 *
 * Tier : métier. Les règles reprennent les contraintes SQL (quantités ≥ 0,
 * disponible ≤ total) pour échouer tôt avec un message français par champ.
 */
import { z } from 'zod';
import { schemaPagination, schemaRecherche } from '../../utils/schemasCommuns.js';

export const DISPONIBILITES = ['disponible', 'stock_faible', 'indisponible'];
export const TRIS = ['nom_asc', 'nom_desc', 'stock_desc', 'recent'];

/** Query de GET /materials et GET /admin/materials. */
export const schemaFiltresMateriels = schemaPagination.extend({
  limit: schemaPagination.shape.limit.default(12),
  search: schemaRecherche,
  category: z.uuid({ message: 'Catégorie invalide.' }).optional(),
  availability: z
    .enum(DISPONIBILITES, {
      message: 'Disponibilité invalide (disponible, stock_faible, indisponible).',
    })
    .optional(),
  sort: z.enum(TRIS, { message: 'Tri invalide.' }).default('nom_asc'),
});

/**
 * Entier ≥ 0 avec message français (champ de stock).
 * @param {string} libelle
 */
function quantite(libelle) {
  return z
    .number({ message: `${libelle} doit être un nombre.` })
    .int({ message: `${libelle} doit être un nombre entier.` })
    .min(0, { message: `${libelle} doit être positive ou nulle.` });
}

/** Corps de POST /admin/materials et PUT /admin/materials/:id. */
export const schemaCorpsMateriel = z
  .object({
    nom: z
      .string({ message: 'Le nom est obligatoire.' })
      .trim()
      .min(2, { message: 'Le nom doit contenir au moins 2 caractères.' })
      .max(150, { message: 'Le nom est limité à 150 caractères.' }),
    description: z
      .string()
      .trim()
      .max(2000, { message: 'La description est limitée à 2000 caractères.' })
      .nullish()
      .transform((valeur) => valeur || null),
    categorieId: z.uuid({ message: 'La catégorie est obligatoire.' }),
    quantiteTotale: quantite('La quantité totale'),
    quantiteDisponible: quantite('La quantité disponible'),
    stockMinimum: quantite("Le seuil d'alerte"),
    actif: z.boolean().default(true),
  })
  // Même règle que la contrainte SQL materials_available_lte_total
  .refine((m) => m.quantiteDisponible <= m.quantiteTotale, {
    message: 'La quantité disponible ne peut pas dépasser la quantité totale.',
    path: ['quantiteDisponible'],
  });

/** Corps de PATCH /admin/materials/:id/status. */
export const schemaStatutMateriel = z.object({
  actif: z.boolean({ message: 'Le champ « actif » doit être un booléen.' }),
});
