/**
 * Catalogue admin (design Ecran12) : miniature, nom, catégorie, total, disponible, seuil,
 * stock, statut via Switch, modifier. Inclut les matériels inactifs.
 * Tier : présentation.
 */
import { Link, useSearchParams } from 'react-router-dom';
import { Boxes, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EnTetePage } from '@/components/communs/EnTetePage';
import { Carte } from '@/components/communs/Carte';
import { EtatVide } from '@/components/communs/EtatVide';
import { EtatErreur } from '@/components/communs/EtatErreur';
import { Pagination } from '@/components/communs/Pagination';
import { ChampRecherche } from '@/components/communs/ChampRecherche';
import { SqueletteListe } from '@/fonctionnalites/demandes/ListeDemandes';
import { useCategoriesAdmin } from '@/fonctionnalites/admin/categories/hooks';
import { pluriel } from '@/lib/formatage';
import { useMaterielsAdmin } from './hooks';
import { TableauMaterielsAdmin } from './TableauMaterielsAdmin';

const STOCKS = [
  { valeur: 'tous', libelle: 'Tous' },
  { valeur: 'disponible', libelle: 'Disponible' },
  { valeur: 'stock_faible', libelle: 'Stock faible' },
  { valeur: 'indisponible', libelle: 'Indisponible' },
];

export function PageAdminMateriels() {
  const [parametresUrl, setParametresUrl] = useSearchParams();
  const recherche = parametresUrl.get('search') ?? '';
  const categorie = parametresUrl.get('category') ?? 'toutes';
  const stock = parametresUrl.get('stock') ?? 'tous';
  const page = Number(parametresUrl.get('page') ?? '1');
  const { data: categories = [] } = useCategoriesAdmin();

  const requete = useMaterielsAdmin({
    page,
    limit: 15,
    search: recherche || undefined,
    category: categorie === 'toutes' ? undefined : categorie,
    availability: stock === 'tous' ? undefined : stock,
  });

  /** @param {Record<string, string>} modifications */
  function modifier(modifications) {
    const suivants = { search: recherche, category: categorie, stock, page: '1', ...modifications };
    const parDefaut = { search: '', category: 'toutes', stock: 'tous', page: '1' };
    setParametresUrl(Object.fromEntries(Object.entries(suivants).filter(([c, v]) => v !== parDefaut[c])));
  }

  const total = requete.data?.meta.total;

  return (
    <>
      <EnTetePage
        titre="Matériels"
        description={total !== undefined ? `${pluriel(total, 'référence')} dans le catalogue` : ' '}
        actions={
          <Button asChild>
            <Link to="/admin/materials/new">
              <Plus aria-hidden="true" /> Ajouter un matériel
            </Link>
          </Button>
        }
      />
      <Carte>
        <div className="flex flex-col gap-3 border-b px-4 py-3 md:flex-row md:flex-wrap md:px-5">
          <ChampRecherche
            id="recherche-materiels-admin"
            libelle="Rechercher un matériel"
            placeholder="Rechercher un matériel…"
            valeur={recherche}
            surChangement={(search) => modifier({ search })}
            className="md:w-[280px] [&_input]:h-11 md:[&_input]:h-9"
          />
          <Select value={categorie} onValueChange={(category) => modifier({ category })}>
            <SelectTrigger className="h-11 bg-card md:h-9 md:w-[240px]" aria-label="Catégorie">
              <span className="truncate">
                <span className="text-muted-foreground">Catégorie : </span>
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="toutes">Toutes</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stock} onValueChange={(valeur) => modifier({ stock: valeur })}>
            <SelectTrigger className="h-11 bg-card md:h-9 md:w-[190px]" aria-label="Stock">
              <span className="truncate">
                <span className="text-muted-foreground">Stock : </span>
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              {STOCKS.map((s) => (
                <SelectItem key={s.valeur} value={s.valeur}>
                  {s.libelle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {requete.isPending && <SqueletteListe lignes={8} />}
        {requete.isError && <EtatErreur erreur={requete.error} surReessayer={requete.refetch} />}
        {requete.isSuccess && requete.data.data.length === 0 && (
          <EtatVide icone={Boxes} titre="Aucun matériel" description="Aucun matériel ne correspond à ces filtres." />
        )}
        {requete.isSuccess && requete.data.data.length > 0 && (
          <>
            <TableauMaterielsAdmin materiels={requete.data.data} />
            <Pagination meta={requete.data.meta} libelle="matériels" surChangement={(p) => modifier({ page: String(p) })} />
          </>
        )}
      </Carte>
    </>
  );
}
