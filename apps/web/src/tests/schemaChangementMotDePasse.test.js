// Règles du mot de passe définitif (mêmes que l'API) et confirmation.
import { describe, expect, it } from 'vitest';
import { schemaChangementMotDePasse } from '@/fonctionnalites/auth/schemas';

/** Premier message d'erreur, ou null si valide. */
function erreur(nouveauMotDePasse, confirmation = nouveauMotDePasse) {
  const resultat = schemaChangementMotDePasse.safeParse({ nouveauMotDePasse, confirmation });
  return resultat.success ? null : resultat.error.issues[0].message;
}

describe('schéma de changement de mot de passe', () => {
  it('accepte un mot de passe conforme et confirmé', () => {
    expect(erreur('Materiel2026')).toBeNull();
  });

  it('exige 10 caractères', () => {
    expect(erreur('Court1A')).toBe('Le mot de passe doit contenir au moins 10 caractères.');
  });

  it('exige une majuscule', () => {
    expect(erreur('materiel2026')).toBe('Le mot de passe doit contenir au moins une majuscule.');
  });

  it('exige un chiffre', () => {
    expect(erreur('MaterielSansChiffre')).toBe(
      'Le mot de passe doit contenir au moins un chiffre.',
    );
  });

  it('exige une confirmation identique', () => {
    expect(erreur('Materiel2026', 'Materiel2027')).toBe(
      'Les deux mots de passe ne correspondent pas.',
    );
  });
});
