// Le badge affiche le libellé français figé par le design, avec une pastille (jamais la couleur seule).
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BadgeStatut } from '@/components/communs/BadgeStatut';
import { BadgeDisponibilite } from '@/components/communs/BadgeDisponibilite';

describe('BadgeStatut', () => {
  it.each([
    ['PENDING', 'En attente'],
    ['APPROVED', 'Approuvée'],
    ['FULFILLED', 'Remise'],
    ['REJECTED', 'Refusée'],
    ['CANCELLED', 'Annulée'],
  ])('affiche « %s » en français : %s', (statut, libelle) => {
    render(<BadgeStatut statut={statut} />);
    expect(screen.getByText(libelle)).toBeInTheDocument();
  });

  it('n’affiche jamais le code technique', () => {
    render(<BadgeStatut statut="PENDING" />);
    expect(screen.queryByText('PENDING')).not.toBeInTheDocument();
  });

  it('n’affiche rien pour un statut inconnu', () => {
    const { container } = render(<BadgeStatut statut="INCONNU" />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('BadgeDisponibilite', () => {
  it('affiche « Stock faible »', () => {
    render(<BadgeDisponibilite disponibilite="stock_faible" />);
    expect(screen.getByText('Stock faible')).toBeInTheDocument();
  });
});
