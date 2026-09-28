/**
 * Mes demandes (design Ecran06 / Mobile06 / Etat06 vide) : onglets par statut avec
 * compteurs, recherche par référence, liste paginée.
 * Tier : présentation. Filtres conservés dans l'URL.
 */
import { Link, useSearchParams } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EnTetePage } from '@/components/communs/EnTetePage';
import { Carte } from '@/components/communs/Carte';
import { EtatVide } from '@/components/communs/EtatVide';
import { EtatErreur } from '@/components/communs/EtatErreur';
import { Onglets } from '@/components/communs/Onglets';
import { Pagination } from '@/components/communs/Pagination';
import { ChampRecherche } from '@/components/communs/ChampRecherche';
import { ONGLETS_DEMANDES } from '@/lib/constantes';
import { useMesDemandes, useMesStatistiques } from './hooks';
import { ListeDemandes, SqueletteListe } from './ListeDemandes';

/**
 * Compteur de chaque onglet à partir des statistiques (« Acceptées » = approuvées + remises).
 * @param {import('@/fonctionnalites/demandes/api').Demande|any} stats
 * @param {string} cle
 */
function compteurOnglet(stats, cle) {
  if (!stats) return undefined;
  if (cle === 'acceptees') return stats.approuvees + stats.remises;
  return stats[cle];
}

export function PageMesDemandes() {
  const [parametresUrl, setParametresUrl] = useSearchParams();
  const onglet = parametresUrl.get('onglet') ?? 'toutes';
  const recherche = parametresUrl.get('search') ?? '';
  const page = Number(parametresUrl.get('page') ?? '1');

  const ongletActif = ONGLETS_DEMANDES.find((o) => o.valeur === onglet) ?? ONGLETS_DEMANDES[0];
  const statistiques = useMesStatistiques();
  const requete = useMesDemandes({
    page,
    status: ongletActif.statuts,
    search: recherche || undefined,
  });

  /** @param {Record<string, string>} modifications */
  function modifier(modifications) {
    const suivants = { onglet, search: recherche, page: '1', ...modifications };
    const nettoyes = Object.entries(suivants).filter(
      ([cle, valeur]) =>
        valeur && !(cle === 'onglet' && valeur === 'toutes') && !(cle === 'page' && valeur === '1'),
    );
    setParametresUrl(Object.fromEntries(nettoyes));
  }

  const aucuneDemande = statistiques.data?.total === 0;

  return (
    <>
      <EnTetePage
        titre="Mes demandes"
        description="Suivez le traitement de vos demandes de matériel."
        actions={
          <Button asChild className="h-11 w-full sm:h-9 sm:w-auto">
            <Link to="/requests/new">
              <Plus aria-hidden="true" /> Nouvelle demande
            </Link>
          </Button>
        }
      />

      <Onglets
        libelle="Filtrer par statut"
        valeur={ongletActif.valeur}
        surChangement={(valeur) => modifier({ onglet: valeur })}
        onglets={ONGLETS_DEMANDES.map((o) => ({
          valeur: o.valeur,
          libelle: o.libelle,
          compteur: compteurOnglet(statistiques.data, o.cleStat),
        }))}
      />

      <Carte>
        <div className="border-b px-4 py-3 md:px-5">
          <ChampRecherche
            id="recherche-reference"
            libelle="Rechercher par référence"
            placeholder="Rechercher une référence…"
            valeur={recherche}
            surChangement={(search) => modifier({ search })}
            className="md:w-[280px] [&_input]:h-11 md:[&_input]:h-9"
          />
        </div>

        {requete.isPending && <SqueletteListe />}
        {requete.isError && <EtatErreur erreur={requete.error} surReessayer={requete.refetch} />}
        {requete.isSuccess && requete.data.data.length === 0 && (
          <EtatVide
            icone={FileText}
            titre={aucuneDemande ? 'Aucune demande pour le moment' : 'Aucune demande trouvée'}
            description={
              aucuneDemande
                ? 'Vos demandes de matériel apparaîtront ici. Commencez par parcourir le catalogue ou créez directement une demande.'
                : 'Aucune demande ne correspond à ce filtre.'
            }
            actions={
              aucuneDemande && (
                <>
                  <Button variant="outline" asChild>
                    <Link to="/materials">Parcourir le catalogue</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/requests/new">
                      <Plus aria-hidden="true" /> Nouvelle demande
                    </Link>
                  </Button>
                </>
              )
            }
          />
        )}
        {requete.isSuccess && requete.data.data.length > 0 && (
          <>
            <ListeDemandes demandes={requete.data.data} />
            <Pagination
              meta={requete.data.meta}
              libelle="demandes"
              surChangement={(p) => modifier({ page: String(p) })}
            />
          </>
        )}
      </Carte>
    </>
  );
}
