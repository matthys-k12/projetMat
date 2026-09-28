/**
 * Affichage UNIQUE du mot de passe temporaire après création d'un compte.
 *
 * Tier : présentation. Le mot de passe n'est gardé qu'en mémoire (état React)
 * le temps de ce dialog : il n'est ni stocké, ni relisible par l'API. À la
 * fermeture, il est perdu : l'admin doit le transmettre au collaborateur tout de suite.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { Check, Copy, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alerte } from '@/components/communs/Carte';

/**
 * @param {{ resultat: { utilisateur: import('./api').Utilisateur, motDePasseTemporaire: string }|null, surFermer: () => void, reinitialisation?: boolean }} props
 *   reinitialisation : true après « Réinitialiser le mot de passe » (sinon : création de compte)
 */
export function DialogueMotDePasseTemporaire({ resultat, surFermer, reinitialisation = false }) {
  const [copie, setCopie] = useState(false);

  async function copier() {
    try {
      await navigator.clipboard.writeText(resultat.motDePasseTemporaire);
      setCopie(true);
      toast.success('Mot de passe copié');
    } catch {
      toast.error('Copie impossible : sélectionnez le mot de passe manuellement.');
    }
  }

  function fermer() {
    setCopie(false);
    surFermer();
  }

  return (
    <Dialog open={Boolean(resultat)} onOpenChange={(etat) => !etat && fermer()}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {reinitialisation ? 'Mot de passe réinitialisé' : 'Compte créé'}
          </DialogTitle>
          <DialogDescription>
            Transmettez ce mot de passe temporaire à {resultat?.utilisateur.nomComplet} (
            {resultat?.utilisateur.email}). Il devra le remplacer à sa{' '}
            {reinitialisation ? 'prochaine' : 'première'} connexion.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <code
            className="flex-1 select-all rounded-md border bg-background px-3 py-2 font-mono text-[15px] tracking-wide"
            aria-label="Mot de passe temporaire"
          >
            {resultat?.motDePasseTemporaire}
          </code>
          <Button variant="outline" onClick={copier} aria-label="Copier le mot de passe">
            {copie ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {copie ? 'Copié' : 'Copier'}
          </Button>
        </div>

        <Alerte ton="warning" icone={TriangleAlert}>
          <b className="font-medium">Ce mot de passe ne sera plus affiché.</b> Il n&apos;est
          conservé nulle part : copiez-le avant de fermer cette fenêtre.
        </Alerte>

        <DialogFooter>
          <Button onClick={fermer}>J&apos;ai transmis le mot de passe</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
