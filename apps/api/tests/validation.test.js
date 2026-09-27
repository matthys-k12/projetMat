// Tests de validation des entrées (schémas zod + middleware valider).
import { describe, expect, it } from 'vitest';
import { valider } from '../src/middlewares/validation.js';
import { schemaCreationDemande, schemaRefus } from '../src/modules/demandes/demandes.schemas.js';
import { schemaCorpsMateriel } from '../src/modules/materiels/materiels.schemas.js';

const ID_MATERIEL = '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b';
const MOTIF_VALIDE = 'Remplacement de mon ordinateur portable en panne.';

describe('validation de la création d’une demande', () => {
  it('accepte une demande valide', () => {
    const resultat = schemaCreationDemande.safeParse({
      motif: MOTIF_VALIDE,
      articles: [{ materielId: ID_MATERIEL, quantite: 2 }],
    });
    expect(resultat.success).toBe(true);
  });

  it('rejette une demande vide', () => {
    const resultat = schemaCreationDemande.safeParse({ motif: MOTIF_VALIDE, articles: [] });
    expect(resultat.success).toBe(false);
    expect(resultat.error.issues[0].message).toBe('La demande doit contenir au moins un matériel.');
  });

  it('rejette une quantité à 0', () => {
    const resultat = schemaCreationDemande.safeParse({
      motif: MOTIF_VALIDE,
      articles: [{ materielId: ID_MATERIEL, quantite: 0 }],
    });
    expect(resultat.success).toBe(false);
    expect(resultat.error.issues[0].message).toBe('La quantité doit être au moins égale à 1.');
  });

  it('rejette un motif de moins de 10 caractères', () => {
    const resultat = schemaCreationDemande.safeParse({
      motif: 'Court',
      articles: [{ materielId: ID_MATERIEL, quantite: 1 }],
    });
    expect(resultat.success).toBe(false);
    expect(resultat.error.issues[0].message).toBe('Le motif doit contenir au moins 10 caractères.');
  });

  it('rejette un matériel en double', () => {
    const resultat = schemaCreationDemande.safeParse({
      motif: MOTIF_VALIDE,
      articles: [
        { materielId: ID_MATERIEL, quantite: 1 },
        { materielId: ID_MATERIEL, quantite: 2 },
      ],
    });
    expect(resultat.success).toBe(false);
  });
});

describe('validation du refus et des matériels', () => {
  it('le motif du refus est obligatoire', () => {
    const resultat = schemaRefus.safeParse({ commentaire: '   ' });
    expect(resultat.success).toBe(false);
    expect(resultat.error.issues[0].message).toBe('Le motif du refus est obligatoire.');
  });

  it('la quantité disponible ne peut pas dépasser la quantité totale', () => {
    const resultat = schemaCorpsMateriel.safeParse({
      nom: 'Écran Dell',
      categorieId: ID_MATERIEL,
      quantiteTotale: 10,
      quantiteDisponible: 12,
      stockMinimum: 2,
    });
    expect(resultat.success).toBe(false);
    expect(resultat.error.issues[0].path).toEqual(['quantiteDisponible']);
  });
});

describe('middleware valider()', () => {
  it('lève une ErreurApi 422 VALIDATION_ERROR avec le détail des champs', () => {
    const middleware = valider({ body: schemaCreationDemande });
    const req = { body: { motif: MOTIF_VALIDE, articles: [] }, query: {}, params: {} };
    try {
      middleware(req, {}, () => {});
      expect.unreachable();
    } catch (erreur) {
      expect(erreur.statutHttp).toBe(422);
      expect(erreur.code).toBe('VALIDATION_ERROR');
      expect(erreur.details[0].champ).toBe('articles');
    }
  });

  it('place les données validées dans req.donnees', () => {
    const middleware = valider({ body: schemaCreationDemande });
    const req = {
      body: { motif: `  ${MOTIF_VALIDE}  `, articles: [{ materielId: ID_MATERIEL, quantite: 1 }] },
      query: {},
      params: {},
    };
    let suivantAppele = false;
    middleware(req, {}, () => {
      suivantAppele = true;
    });
    expect(suivantAppele).toBe(true);
    expect(req.donnees.body.motif).toBe(MOTIF_VALIDE);
  });
});
