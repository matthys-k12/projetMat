/**
 * Décision admin sur une demande (design Ecran11) : demandeur, motif, matériels avec
 * « Stock actuel » (rouge si insuffisant), chronologie, actions de décision.
 * Tier : présentation.
 */
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CircleAlert } from 'lucide-react';
import { Alerte, Carte, CorpsCarte, EnTeteCarte } from '@/components/communs/Carte';
import { Avatar } from '@/components/communs/Avatar';
import { BadgeStatut } from '@/components/communs/BadgeStatut';
import { EtatErreur } from '@/components/communs/EtatErreur';
import {
  CarteSuivi,
  NoteAdministrateur,
  TableauMateriels,
} from '@/fonctionnalites/demandes/SectionsDemande';
import { formaterDateLongue, pluriel } from '@/lib/formatage';
import { useDemandeAdmin } from './hooks';
import { ActionsDecision } from './ActionsDecision';

export function PageAdminDetailDemande() {
  const { id } = useParams();
  const requete = useDemandeAdmin(id);

  return (
    <>
      <Link
        to="/admin/requests"
        className="flex items-center gap-1.5 self-start text-small text-primary hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Toutes les demandes
      </Link>
      {requete.isPending && (
        <div aria-busy="true" className="h-64 animate-pulse rounded-lg bg-muted" />
      )}
      {requete.isError && (
        <Carte>
          <EtatErreur
            titre="Demande introuvable"
            erreur={requete.error}
            surReessayer={requete.refetch}
          />
        </Carte>
      )}
      {requete.isSuccess && <ContenuDecision demande={requete.data} />}
    </>
  );
}

/**
 * @param {{ demande: import('@/fonctionnalites/demandes/api').Demande }} props
 */
function ContenuDecision({ demande }) {
  // Pré-contrôle visuel : la base refera ce contrôle sous verrou au moment de l'approbation
  const manquants =
    demande.statut === 'PENDING'
      ? demande.articles.filter((a) => a.materiel.quantiteDisponible < a.quantite)
      : [];

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-[22px] font-semibold leading-8">{demande.reference}</h1>
            <BadgeStatut statut={demande.statut} />
          </div>
          <p className="mt-1 text-muted-foreground">
            Reçue le {formaterDateLongue(demande.dateCreation)}
          </p>
        </div>
        <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-card p-4 empty:hidden sm:static sm:border-0 sm:bg-transparent sm:p-0">
          <ActionsDecision demande={demande} stockInsuffisant={manquants.length > 0} />
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <Carte>
            <EnTeteCarte titre="Demandeur" />
            <CorpsCarte className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-3">
                <Avatar nom={demande.demandeur.nomComplet} grand />
                <div className="flex flex-col">
                  <span className="font-medium">{demande.demandeur.nomComplet}</span>
                  <span className="text-small text-muted-foreground">
                    {demande.demandeur.email}
                  </span>
                </div>
                <span className="ml-auto text-caption text-muted-foreground">
                  {pluriel(demande.nombreDemandesDemandeur ?? 0, 'demande')} au total
                </span>
              </div>
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[160px_1fr]">
                <dt className="text-muted-foreground">Motif</dt>
                <dd className="whitespace-pre-line">{demande.motif}</dd>
              </dl>
            </CorpsCarte>
          </Carte>

          <TableauMateriels demande={demande} avecStock>
            {manquants.length > 0 && (
              <div id="alerte-stock" className="border-t px-5 py-3">
                <Alerte icone={CircleAlert}>
                  <b className="font-medium">
                    Stock insuffisant pour {pluriel(manquants.length, 'matériel')}.
                  </b>{' '}
                  {manquants
                    .map(
                      (a) =>
                        `${a.materiel.nom} : ${a.quantite} demandé(s), ${a.materiel.quantiteDisponible} disponible(s).`,
                    )
                    .join(' ')}{' '}
                  L&apos;approbation sera refusée tant que le stock n&apos;est pas réapprovisionné.
                </Alerte>
              </div>
            )}
          </TableauMateriels>
          <NoteAdministrateur demande={demande} />
        </div>
        <CarteSuivi demande={demande} />
      </div>
    </>
  );
}
