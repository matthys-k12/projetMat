/**
 * Catalogue du matériel (design Ecran03, Mobile03, Etat03 chargement / erreur).
 *
 * Tier : présentation. Les filtres vivent dans l'URL (?search=…&category=…) :
 * on peut partager ou recharger la page sans perdre la recherche.
 */
import { Link, useSearchParams } from 'react-router-dom';
import { PackageSearch, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EnTetePage } from '@/components/communs/EnTetePage';
import { Carte } from '@/components/communs/Carte';
import { EtatVide } from '@/components/communs/EtatVide';
import { EtatErreur } from '@/components/communs/EtatErreur';
import { Pagination } from '@/components/communs/Pagination';
import { CarteMateriel, SqueletteCarteMateriel } from './CarteMateriel';
import { FiltresCatalogue } from './FiltresCatalogue';
import { useMateriels } from './hooks';

/** Valeurs par défaut des filtres (« toutes »/« tous » = pas de filtre). */
const DEFAUTS = { search: '', category: 'toutes', availability: 'tous', sort: 'nom_asc', page: '1' };

export function PageCatalogue() {
  const [parametresUrl, setParametresUrl] = useSearchParams();
  const lire = (cle) => parametresUrl.get(cle) ?? DEFAUTS[cle];
  const filtres = {
    search: lire('search'),
    category: lire('category'),
    availability: lire('availability'),
    sort: lire('sort'),
  };
  const page = Number(lire('page'));

  const requete = useMateriels({
    page,
    limit: 12,
    search: filtres.search || undefined,
    category: filtres.category === 'toutes' ? undefined : filtres.category,
    availability: filtres.availability === 'tous' ? undefined : filtres.availability,
    sort: filtres.sort,
  });

  /** Met à jour l'URL ; tout changement de filtre revient à la page 1. */
  function modifierFiltres(modifications) {
    const suivants = { ...filtres, page: '1', ...modifications };
    const nettoyes = Object.entries(suivants).filter(([cle, valeur]) => valeur && valeur !== DEFAUTS[cle]);
    setParametresUrl(Object.fromEntries(nettoyes));
  }

  return (
    <>
      <EnTetePage
        titre="Matériels"
        description="Catalogue du matériel informatique mis à disposition des collaborateurs."
        actions={
          <Button asChild className="hidden sm:inline-flex">
            <Link to="/requests/new">
              <Plus aria-hidden="true" /> Nouvelle demande
            </Link>
          </Button>
        }
      />
      <FiltresCatalogue filtres={filtres} surChangement={modifierFiltres} total={requete.data?.meta.total} />

      {requete.isPending && (
        <div aria-busy="true" aria-label="Chargement du catalogue" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <SqueletteCarteMateriel key={index} />
          ))}
        </div>
      )}

      {requete.isError && (
        <Carte>
          <EtatErreur titre="Impossible de charger le catalogue" erreur={requete.error} surReessayer={requete.refetch} />
        </Carte>
      )}

      {requete.isSuccess && requete.data.data.length === 0 && (
        <Carte>
          <EtatVide
            icone={PackageSearch}
            titre="Aucun matériel trouvé"
            description="Modifiez la recherche ou les filtres pour élargir les résultats."
            actions={
              <Button variant="outline" onClick={() => setParametresUrl({})}>
                Réinitialiser les filtres
              </Button>
            }
          />
        </Carte>
      )}

      {requete.isSuccess && requete.data.data.length > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {requete.data.data.map((materiel) => (
              <CarteMateriel key={materiel.id} materiel={materiel} />
            ))}
          </div>
          <Carte>
            <Pagination
              meta={requete.data.meta}
              libelle="matériels"
              surChangement={(nouvellePage) => modifierFiltres({ page: String(nouvellePage) })}
            />
          </Carte>
        </>
      )}
    </>
  );
}
