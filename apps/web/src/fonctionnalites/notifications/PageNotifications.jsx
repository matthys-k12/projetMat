/**
 * Notifications (design Ecran08) : point non lu, titre, message, date relative,
 * filtre Toutes / Non lues, « Tout marquer comme lu ». Cliquer une notification la
 * marque comme lue et ouvre la demande concernée.
 * Tier : présentation.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Bell, CheckCheck, CircleCheck, CircleX, PackageCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EnTetePage } from '@/components/communs/EnTetePage';
import { Carte } from '@/components/communs/Carte';
import { EtatVide } from '@/components/communs/EtatVide';
import { EtatErreur } from '@/components/communs/EtatErreur';
import { ControleSegmente } from '@/components/communs/ControleSegmente';
import { Pagination } from '@/components/communs/Pagination';
import { formaterDateRelative, pluriel } from '@/lib/formatage';
import { cn } from '@/lib/utils';
import { useMarquerCommeLue, useMarquerToutesCommeLues, useNombreNonLues, useNotifications } from './hooks';

const ICONES = { REQUEST_APPROVED: CircleCheck, REQUEST_REJECTED: CircleX, REQUEST_FULFILLED: PackageCheck };

export function PageNotifications() {
  const [filtre, setFiltre] = useState('toutes');
  const [page, setPage] = useState(1);
  const naviguer = useNavigate();
  const { data: nonLues = 0 } = useNombreNonLues();
  const requete = useNotifications({ page, unread: filtre === 'non-lues' || undefined });
  const marquerLue = useMarquerCommeLue();
  const marquerToutes = useMarquerToutesCommeLues();

  async function toutMarquer() {
    const { nombre } = await marquerToutes.mutateAsync();
    toast.success(`${pluriel(nombre, 'notification')} marquée${nombre > 1 ? 's' : ''} comme lue${nombre > 1 ? 's' : ''}`);
  }

  /** @param {import('./api').Notification} notification */
  function ouvrir(notification) {
    if (!notification.lue) marquerLue.mutate(notification.id);
    if (notification.demandeId) naviguer(`/requests/${notification.demandeId}`);
  }

  return (
    <>
      <EnTetePage
        titre="Notifications"
        description={nonLues > 0 ? `${pluriel(nonLues, 'notification non lue', 'notifications non lues')}.` : 'Tout est lu.'}
        actions={
          <Button variant="outline" disabled={nonLues === 0 || marquerToutes.isPending} onClick={toutMarquer}>
            <CheckCheck aria-hidden="true" /> Tout marquer comme lu
          </Button>
        }
      />
      <ControleSegmente
        libelle="Filtre"
        className="self-start"
        valeur={filtre}
        surChangement={(valeur) => {
          setFiltre(valeur);
          setPage(1);
        }}
        options={[
          { valeur: 'toutes', libelle: 'Toutes' },
          { valeur: 'non-lues', libelle: `Non lues · ${nonLues}` },
        ]}
      />
      <Carte className="max-w-[880px]">
        {requete.isPending && <div aria-busy="true" className="h-48 animate-pulse bg-muted" />}
        {requete.isError && <EtatErreur erreur={requete.error} surReessayer={requete.refetch} />}
        {requete.isSuccess && requete.data.data.length === 0 && (
          <EtatVide icone={Bell} titre="Aucune notification" description="Vous serez prévenu ici quand une demande change de statut." />
        )}
        {requete.isSuccess && requete.data.data.length > 0 && (
          <>
            <ul className="divide-y">
              {requete.data.data.map((notification) => {
                const Icone = ICONES[notification.type] ?? Bell;
                return (
                  <li key={notification.id} className={cn(notification.lue && 'bg-background')}>
                    <button
                      type="button"
                      onClick={() => ouvrir(notification)}
                      className="grid w-full grid-cols-[8px_32px_1fr] items-start gap-3 px-4 py-4 text-left hover:bg-muted/50 sm:grid-cols-[8px_32px_1fr_auto] md:px-5"
                    >
                      {notification.lue ? (
                        <span />
                      ) : (
                        <span className="mt-3 size-2 rounded-full bg-primary" role="img" aria-label="Non lue" />
                      )}
                      <span className="grid size-8 place-items-center rounded-full bg-muted">
                        <Icone className="size-4" aria-hidden="true" />
                      </span>
                      <span>
                        <span className={cn('block', !notification.lue && 'font-semibold')}>{notification.titre}</span>
                        <span className="mt-0.5 block text-small">{notification.message}</span>
                        <span className="mt-1 block text-caption text-muted-foreground sm:hidden">
                          {formaterDateRelative(notification.dateCreation)}
                        </span>
                      </span>
                      <span className="mt-0.5 hidden whitespace-nowrap text-caption text-muted-foreground sm:block">
                        {formaterDateRelative(notification.dateCreation)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <Pagination meta={requete.data.meta} libelle="notifications" surChangement={setPage} />
          </>
        )}
      </Carte>
    </>
  );
}
