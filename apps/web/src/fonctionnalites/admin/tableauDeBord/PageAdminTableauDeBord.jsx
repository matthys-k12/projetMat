/**
 * Dashboard admin (design Ecran09) : 6 KPI, courbe sur 14 jours, top 5 matériels,
 * demandes à traiter et stocks faibles.
 * Tier : présentation. Les agrégats sont calculés en SQL (RPC) côté serveur.
 */
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { CircleCheck, Inbox } from 'lucide-react';
import { EnTetePage } from '@/components/communs/EnTetePage';
import { BandeIndicateurs, CarteIndicateur } from '@/components/communs/CarteIndicateur';
import { Carte, CorpsCarte, EnTeteCarte } from '@/components/communs/Carte';
import { EtatErreur } from '@/components/communs/EtatErreur';
import { EtatVide } from '@/components/communs/EtatVide';
import { BadgeDisponibilite } from '@/components/communs/BadgeDisponibilite';
import { appelerApi } from '@/lib/clientApi';
import { useDemandesAdmin } from '@/fonctionnalites/admin/demandes/hooks';
import { TableauDemandesAdmin } from '@/fonctionnalites/admin/demandes/TableauDemandesAdmin';
import { useMaterielsAdmin } from '@/fonctionnalites/admin/materiels/hooks';
import { BarresTopMateriels, CourbeQuatorzeJours } from './Graphiques';

export function PageAdminTableauDeBord() {
  const stats = useQuery({ queryKey: ['admin', 'tableau-de-bord'], queryFn: () => appelerApi('/admin/dashboard') });
  const aTraiter = useDemandesAdmin({ page: 1, limit: 5, status: 'PENDING' });
  const stocksFaibles = useMaterielsAdmin({ page: 1, limit: 5, availability: 'stock_faible', sort: 'stock_desc' });
  const s = stats.data;

  if (stats.isError) {
    return <Carte><EtatErreur titre="Impossible de charger le dashboard" erreur={stats.error} surReessayer={stats.refetch} /></Carte>;
  }

  return (
    <>
      <EnTetePage
        titre="Dashboard"
        description={`Vue d'ensemble des demandes et des stocks · ${format(new Date(), 'd MMMM yyyy', { locale: fr })}`}
      />
      <BandeIndicateurs>
        <CarteIndicateur libelle="En attente" pastille="bg-warning" valeur={s?.enAttente ?? '–'} precision="à traiter" />
        <CarteIndicateur libelle="Aujourd'hui" valeur={s?.aujourdhui ?? '–'} precision="demandes reçues" />
        <CarteIndicateur libelle="Approuvées" pastille="bg-primary" valeur={s?.approuvees ?? '–'} precision={s ? `+ ${s.remises} remises` : undefined} />
        <CarteIndicateur libelle="Refusées" pastille="bg-destructive" valeur={s?.refusees ?? '–'} precision="au total" />
        <CarteIndicateur libelle="Matériels actifs" valeur={s?.materielsActifs ?? '–'} precision="dans le catalogue" />
        <CarteIndicateur libelle="Stocks faibles" pastille="bg-warning" valeur={s?.materielsStockFaible ?? '–'} precision="sous le seuil d'alerte" />
      </BandeIndicateurs>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Carte>
          <EnTeteCarte titre="Demandes sur 14 jours" />
          <CorpsCarte>{s ? <CourbeQuatorzeJours jours={s.quatorzeDerniersJours} /> : <div className="h-[240px] animate-pulse rounded bg-muted" />}</CorpsCarte>
        </Carte>
        <Carte>
          <EnTeteCarte titre="Top 5 matériels demandés" />
          <CorpsCarte>{s ? <BarresTopMateriels materiels={s.topMateriels} /> : <div className="h-[240px] animate-pulse rounded bg-muted" />}</CorpsCarte>
        </Carte>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Carte>
          <EnTeteCarte titre="Demandes à traiter">
            <Link to="/admin/requests?statut=PENDING" className="text-small text-primary hover:underline">Voir toutes</Link>
          </EnTeteCarte>
          {aTraiter.data?.data.length === 0 && <EtatVide icone={CircleCheck} titre="Aucune demande en attente" />}
          {aTraiter.data?.data.length > 0 && <TableauDemandesAdmin demandes={aTraiter.data.data} />}
        </Carte>
        <Carte>
          <EnTeteCarte titre="Stocks faibles">
            <Link to="/admin/materials?stock=stock_faible" className="text-small text-primary hover:underline">Gérer</Link>
          </EnTeteCarte>
          {stocksFaibles.data?.data.length === 0 && <EtatVide icone={Inbox} titre="Aucun stock faible" />}
          <ul className="divide-y">
            {stocksFaibles.data?.data.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <Link to={`/admin/materials/${m.id}/edit`} className="min-w-0 truncate font-medium hover:underline">{m.nom}</Link>
                <span className="flex items-center gap-2">
                  <span className="chiffres text-small text-muted-foreground">{m.quantiteDisponible} / seuil {m.stockMinimum}</span>
                  <BadgeDisponibilite disponibilite={m.disponibilite} />
                </span>
              </li>
            ))}
          </ul>
        </Carte>
      </div>
    </>
  );
}
