/**
 * Schéma zod de la nouvelle demande — mêmes règles que l'API et la base :
 * au moins un matériel, pas de doublon, quantité entre 1 et le stock disponible,
 * motif de 10 à 1000 caractères.
 * Tier : présentation.
 */
import { z } from 'zod';

export const MOTIF_MIN = 10;
export const MOTIF_MAX = 1000;

const schemaLigne = z.object({
  materielId: z.string().min(1, { message: 'Choisissez un matériel.' }),
  quantite: z.number().int().min(1, { message: 'La quantité doit être au moins égale à 1.' }),
  quantiteDisponible: z.number().int(),
});

export const schemaNouvelleDemande = z
  .object({
    lignes: z.array(schemaLigne).min(1, { message: 'Ajoutez au moins un matériel.' }),
    motif: z
      .string()
      .trim()
      .min(MOTIF_MIN, { message: `Le motif doit contenir au moins ${MOTIF_MIN} caractères.` })
      .max(MOTIF_MAX, { message: `Le motif est limité à ${MOTIF_MAX} caractères.` }),
  })
  .superRefine((valeurs, contexte) => {
    const dejaVus = new Set();
    valeurs.lignes.forEach((ligne, index) => {
      if (ligne.quantite > ligne.quantiteDisponible) {
        contexte.addIssue({
          code: 'custom',
          path: ['lignes', index, 'quantite'],
          message: `Quantité supérieure au stock disponible (${ligne.quantiteDisponible}).`,
        });
      }
      if (ligne.materielId && dejaVus.has(ligne.materielId)) {
        contexte.addIssue({
          code: 'custom',
          path: ['lignes', index, 'materielId'],
          message: 'Ce matériel figure déjà dans la demande.',
        });
      }
      dejaVus.add(ligne.materielId);
    });
  });

/**
 * Regroupe les erreurs zod par ligne pour l'affichage (une erreur par ligne suffit).
 * @param {import('zod').ZodError|undefined} erreur
 * @returns {{ parLigne: Record<number, string>, motif?: string, general?: string }}
 */
export function extraireErreurs(erreur) {
  /** @type {{ parLigne: Record<number, string>, motif?: string, general?: string }} */
  const resultat = { parLigne: {} };
  if (!erreur) return resultat;

  for (const probleme of erreur.issues) {
    const [racine, index] = probleme.path;
    if (racine === 'lignes' && typeof index === 'number') {
      resultat.parLigne[index] ??= probleme.message;
    } else if (racine === 'lignes') {
      resultat.general ??= probleme.message;
    } else if (racine === 'motif') {
      resultat.motif ??= probleme.message;
    }
  }
  return resultat;
}
