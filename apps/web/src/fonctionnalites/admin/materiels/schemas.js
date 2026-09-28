/**
 * Schéma zod du formulaire matériel (mêmes règles que l'API et les contraintes SQL).
 * Tier : présentation. Les champs numériques arrivent en texte depuis les <input> :
 * z.coerce les convertit en nombres.
 */
import { z } from 'zod';

/** @param {string} libelle */
function quantite(libelle) {
  return z.coerce
    .number({ message: `${libelle} doit être un nombre.` })
    .int({ message: `${libelle} doit être un nombre entier.` })
    .min(0, { message: `${libelle} doit être positive ou nulle.` });
}

export const schemaMateriel = z
  .object({
    nom: z
      .string()
      .trim()
      .min(1, { message: 'Le nom est obligatoire.' })
      .min(2, { message: 'Le nom doit contenir au moins 2 caractères.' })
      .max(150, { message: 'Le nom est limité à 150 caractères.' }),
    categorieId: z.string().min(1, { message: 'La catégorie est obligatoire.' }),
    description: z.string().trim().max(2000, { message: 'La description est limitée à 2000 caractères.' }),
    quantiteTotale: quantite('La quantité totale'),
    quantiteDisponible: quantite('La quantité disponible'),
    stockMinimum: quantite("Le seuil d'alerte"),
    actif: z.boolean(),
  })
  .superRefine((valeurs, contexte) => {
    if (valeurs.quantiteDisponible > valeurs.quantiteTotale) {
      contexte.addIssue({
        code: 'custom',
        path: ['quantiteDisponible'],
        message: `Ne peut pas dépasser la quantité totale (${valeurs.quantiteTotale}).`,
      });
    }
  });

/** Valeurs d'un formulaire vide (création). */
export const VALEURS_VIDES = {
  nom: '',
  categorieId: '',
  description: '',
  quantiteTotale: 0,
  quantiteDisponible: 0,
  stockMinimum: 0,
  actif: true,
};
