// Validation du formulaire de connexion : messages français, aria-invalid, et appel
// de la connexion uniquement quand le formulaire est valide.
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ContexteAuth } from '@/fonctionnalites/auth/ContexteAuth';
import { PageConnexion } from '@/fonctionnalites/auth/PageConnexion';

/** Rend la page avec un contexte d'authentification simulé. */
function rendre(seConnecter = vi.fn()) {
  const valeur = { etat: 'deconnecte', profil: null, estAdmin: false, seConnecter, seDeconnecter: vi.fn() };
  render(
    <MemoryRouter>
      <ContexteAuth.Provider value={valeur}>
        <PageConnexion />
      </ContexteAuth.Provider>
    </MemoryRouter>,
  );
  return seConnecter;
}

describe('PageConnexion', () => {
  it('affiche les erreurs des champs vides sans appeler la connexion', async () => {
    const seConnecter = rendre();
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByText("L'adresse e-mail est obligatoire.")).toBeInTheDocument();
    expect(screen.getByText('Le mot de passe est obligatoire.')).toBeInTheDocument();
    expect(screen.getByLabelText('Adresse e-mail')).toHaveAttribute('aria-invalid', 'true');
    expect(seConnecter).not.toHaveBeenCalled();
  });

  it('refuse une adresse e-mail invalide', async () => {
    rendre();
    await userEvent.type(screen.getByLabelText('Adresse e-mail'), 'pas-un-email');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(await screen.findByText('Adresse e-mail invalide.')).toBeInTheDocument();
  });

  it('appelle la connexion avec des identifiants valides', async () => {
    const seConnecter = rendre(vi.fn().mockResolvedValue(undefined));
    await userEvent.type(screen.getByLabelText('Adresse e-mail'), 'aya@itrm.demo');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'User123!');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(seConnecter).toHaveBeenCalledWith('aya@itrm.demo', 'User123!');
  });

  it('affiche « E-mail ou mot de passe incorrect » si la connexion échoue', async () => {
    rendre(vi.fn().mockRejectedValue(new Error('Invalid login credentials')));
    await userEvent.type(screen.getByLabelText('Adresse e-mail'), 'aya@itrm.demo');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'mauvais');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(await screen.findByText('E-mail ou mot de passe incorrect')).toBeInTheDocument();
  });
});
