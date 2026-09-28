// Formulaire « mot de passe oublié » : une adresse e-mail valide est exigée.
import { describe, expect, it } from 'vitest';
import { schemaMotDePasseOublie } from '@/fonctionnalites/auth/schemas';

describe('schéma du mot de passe oublié', () => {
  it('accepte une adresse valide (espaces retirés)', () => {
    const resultat = schemaMotDePasseOublie.safeParse({ email: '  awa.kone@itrm.demo ' });
    expect(resultat.success).toBe(true);
    expect(resultat.data.email).toBe('awa.kone@itrm.demo');
  });

  it('refuse une adresse vide', () => {
    const resultat = schemaMotDePasseOublie.safeParse({ email: '' });
    expect(resultat.error.issues[0].message).toBe("L'adresse e-mail est obligatoire.");
  });

  it('refuse une adresse invalide', () => {
    const resultat = schemaMotDePasseOublie.safeParse({ email: 'awa.kone' });
    expect(resultat.error.issues[0].message).toBe('Adresse e-mail invalide.');
  });
});
