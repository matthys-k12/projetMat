// Schéma zod de la nouvelle demande : mêmes règles que l'API et la base.
import { describe, expect, it } from 'vitest';
import { extraireErreurs, schemaNouvelleDemande } from '@/fonctionnalites/demandes/schemas';

const MOTIF = 'Arrivée dans l’équipe contrôle de gestion le 1er octobre.';
const ligne = (materielId, quantite, quantiteDisponible = 10) => ({ materielId, quantite, quantiteDisponible });

describe('schéma de la nouvelle demande', () => {
  it('accepte une demande valide', () => {
    const resultat = schemaNouvelleDemande.safeParse({ motif: MOTIF, lignes: [ligne('a', 2)] });
    expect(resultat.success).toBe(true);
  });

  it('refuse une demande sans matériel', () => {
    const resultat = schemaNouvelleDemande.safeParse({ motif: MOTIF, lignes: [] });
    expect(extraireErreurs(resultat.error).general).toBe('Ajoutez au moins un matériel.');
  });

  it('refuse une quantité supérieure au stock avec le message du design', () => {
    const resultat = schemaNouvelleDemande.safeParse({ motif: MOTIF, lignes: [ligne('a', 5, 3)] });
    expect(extraireErreurs(resultat.error).parLigne[0]).toBe('Quantité supérieure au stock disponible (3).');
  });

  it('refuse une quantité à 0', () => {
    const resultat = schemaNouvelleDemande.safeParse({ motif: MOTIF, lignes: [ligne('a', 0)] });
    expect(resultat.success).toBe(false);
  });

  it('refuse un matériel en double', () => {
    const resultat = schemaNouvelleDemande.safeParse({ motif: MOTIF, lignes: [ligne('a', 1), ligne('a', 1)] });
    expect(extraireErreurs(resultat.error).parLigne[1]).toBe('Ce matériel figure déjà dans la demande.');
  });

  it('refuse un motif trop court', () => {
    const resultat = schemaNouvelleDemande.safeParse({ motif: 'Court', lignes: [ligne('a', 1)] });
    expect(extraireErreurs(resultat.error).motif).toBe('Le motif doit contenir au moins 10 caractères.');
  });
});
