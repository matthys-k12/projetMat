/**
 * Détail d'une demande côté collaborateur (design Ecran07, Ecran07 annulation, Mobile07) :
 * informations, matériels, commentaire de l'administrateur, chronologie,
 * « Annuler la demande » (en attente uniquement) avec confirmation.
 * Tier : présentation.
 */
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Carte, CorpsCarte, EnTeteCarte } from '@/components/communs/Carte';
import { EtatErreur } from '@/components/communs/EtatErreur';
import { BadgeStatut } from '@/components/communs/BadgeStatut';
import { formaterDateHeure, formaterDateLongue } from '@/lib/formatage';
import { useAnnulerDemande, useDemande } from './hooks';
import { CarteSuivi, NoteAdministrateur, TableauMateriels } from './SectionsDemande';

export function PageDetailDemande() {
  const { id } = useParams();
  const requete = useDemande(id);

  return (
    <>
      <Link to="/requests" className="flex items-center gap-1.5 self-start text-small text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" /> Mes demandes
      </Link>
      {requete.isPending && <div aria-busy="true" className="h-64 animate-pulse rounded-lg bg-muted" />}
      {requete.isError && (
        <Carte>
          <EtatErreur titre="Demande introuvable" erreur={requete.error} surReessayer={requete.refetch} />
        </Carte>
      )}
      {requete.isSuccess && <ContenuDemande demande={requete.data} />}
    </>
  );
}

/**
 * @param {{ demande: import('./api').Demande }} props
 */
function ContenuDemande({ demande }) {
  const peutAnnuler = demande.statut === 'PENDING';
  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-[22px] font-semibold leading-8">{demande.reference}</h1>
            <BadgeStatut statut={demande.statut} />
          </div>
          <p className="mt-1 text-muted-foreground">Créée le {formaterDateLongue(demande.dateCreation)}</p>
        </div>
        {peutAnnuler && (
          <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-card p-4 sm:static sm:border-0 sm:bg-transparent sm:p-0">
            <BoutonAnnulation demande={demande} />
          </div>
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <Carte>
            <EnTeteCarte titre="Informations" />
            <CorpsCarte>
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[160px_1fr]">
                <dt className="text-muted-foreground">Date de création</dt>
                <dd className="chiffres">{formaterDateHeure(demande.dateCreation)}</dd>
                <dt className="text-muted-foreground">Demandeur</dt>
                <dd>{demande.demandeur?.nomComplet}</dd>
                <dt className="text-muted-foreground">Motif</dt>
                <dd className="whitespace-pre-line">{demande.motif}</dd>
              </dl>
            </CorpsCarte>
          </Carte>
          <TableauMateriels demande={demande} />
          <NoteAdministrateur demande={demande} />
        </div>
        <CarteSuivi demande={demande} />
      </div>
    </>
  );
}

/**
 * Bouton + confirmation d'annulation (action définitive : AlertDialog).
 * @param {{ demande: import('./api').Demande }} props
 */
function BoutonAnnulation({ demande }) {
  const annulation = useAnnulerDemande();

  async function confirmer() {
    try {
      await annulation.mutateAsync(demande.id);
      toast.success(`Demande ${demande.reference} annulée`);
    } catch (erreur) {
      toast.error(erreur.message);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="dangerOutline" className="h-11 w-full sm:h-9 sm:w-auto" disabled={annulation.isPending}>
          {annulation.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          Annuler la demande
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-[440px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Annuler la demande {demande.reference} ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est définitive. La demande ne sera plus traitée et vous devrez en créer une
            nouvelle si besoin.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Conserver la demande</AlertDialogCancel>
          {/* Bouton simple (pas AlertDialogAction) : le dialog reste ouvert pendant l'envoi et en cas d'erreur */}
          <Button variant="destructive" onClick={confirmer} disabled={annulation.isPending}>
            {annulation.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
            Annuler la demande
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
