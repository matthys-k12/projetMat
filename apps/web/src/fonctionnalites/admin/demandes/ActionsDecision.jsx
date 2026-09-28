/**
 * Boutons de décision de l'admin selon le statut :
 * - en attente : [Refuser] (Dialog motif obligatoire) [Approuver] (AlertDialog, commentaire facultatif) ;
 * - approuvée : [Marquer comme remise] (AlertDialog).
 * Tier : présentation. La base revérifie tout sous verrou (stock, transition).
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { Check, Loader2, PackageCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { DialogueRefus } from './DialogueRefus';
import { useApprouverDemande, useRemettreDemande } from './hooks';

/**
 * Confirmation générique : bouton déclencheur + AlertDialog, reste ouvert pendant l'envoi.
 * @param {{ declencheur: import('react').ReactNode, titre: string, description: string, libelleConfirmation: string, enCours: boolean, surConfirmer: () => Promise<boolean>, children?: import('react').ReactNode }} props
 */
function Confirmation({ declencheur, titre, description, libelleConfirmation, enCours, surConfirmer, children }) {
  const [ouvert, setOuvert] = useState(false);
  async function confirmer() {
    const reussi = await surConfirmer();
    if (reussi) setOuvert(false);
  }
  return (
    <AlertDialog open={ouvert} onOpenChange={setOuvert}>
      <AlertDialogTrigger asChild>{declencheur}</AlertDialogTrigger>
      <AlertDialogContent className="max-w-[440px]">
        <AlertDialogHeader>
          <AlertDialogTitle>{titre}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <Button onClick={confirmer} disabled={enCours}>
            {enCours && <Loader2 className="animate-spin" aria-hidden="true" />}
            {libelleConfirmation}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * @param {{ demande: import('@/fonctionnalites/demandes/api').Demande, stockInsuffisant: boolean }} props
 */
export function ActionsDecision({ demande, stockInsuffisant }) {
  const approbation = useApprouverDemande();
  const remise = useRemettreDemande();
  const [commentaire, setCommentaire] = useState('');

  /**
   * Lance une décision et affiche un toast nommant la demande.
   * @param {Promise<unknown>} promesse
   * @param {string} succes
   * @returns {Promise<boolean>}
   */
  async function executer(promesse, succes) {
    try {
      await promesse;
      toast.success(succes);
      return true;
    } catch (erreur) {
      // ex. « Stock insuffisant. Écran LG 27" 4K : demandé 2, disponible 0. »
      toast.error(erreur.message);
      return false;
    }
  }

  if (demande.statut === 'PENDING') {
    return (
      <div className="flex gap-2">
        <DialogueRefus demande={demande} />
        <Confirmation
          declencheur={
            <Button className="h-11 flex-1 sm:h-9 sm:flex-none" aria-describedby={stockInsuffisant ? "alerte-stock" : undefined}>
              <Check aria-hidden="true" /> Approuver
            </Button>
          }
          titre={`Approuver la demande ${demande.reference} ?`}
          description="Le stock des matériels sera immédiatement décrémenté et le demandeur sera notifié."
          libelleConfirmation="Approuver la demande"
          enCours={approbation.isPending}
          surConfirmer={() =>
            executer(
              approbation.mutateAsync({ id: demande.id, commentaire: commentaire.trim() || undefined }),
              `Demande ${demande.reference} approuvée`,
            )
          }
        >
          <label htmlFor="commentaire-approbation" className="text-label">
            Commentaire pour le demandeur (facultatif)
          </label>
          <Textarea
            id="commentaire-approbation"
            rows={3}
            maxLength={1000}
            placeholder="Ex. : à récupérer au bureau IT, 2ᵉ étage."
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
          />
        </Confirmation>
      </div>
    );
  }

  if (demande.statut === 'APPROVED') {
    return (
      <Confirmation
        declencheur={
          <Button className="h-11 w-full sm:h-9 sm:w-auto">
            <PackageCheck aria-hidden="true" /> Marquer comme remise
          </Button>
        }
        titre={`Marquer la demande ${demande.reference} comme remise ?`}
        description="Confirmez que le matériel a bien été remis au demandeur."
        libelleConfirmation="Confirmer la remise"
        enCours={remise.isPending}
        surConfirmer={() => executer(remise.mutateAsync({ id: demande.id }), `Demande ${demande.reference} remise`)}
      />
    );
  }
  return null;
}
