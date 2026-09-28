/**
 * Page 404 : l'adresse ne correspond à aucun écran.
 * Tier : présentation.
 */
import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Carte } from '@/components/communs/Carte';
import { EtatVide } from '@/components/communs/EtatVide';

export function PageIntrouvable() {
  return (
    <Carte>
      <EtatVide
        icone={FileQuestion}
        titre="Page introuvable"
        description="L'adresse demandée n'existe pas ou a été déplacée."
        actions={
          <Button asChild>
            <Link to="/dashboard">Retour au tableau de bord</Link>
          </Button>
        }
      />
    </Carte>
  );
}
