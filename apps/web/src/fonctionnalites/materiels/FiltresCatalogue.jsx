/**
 * Barre de filtres du catalogue : recherche, catégorie, disponibilité, tri.
 * Empilés à 44 px sur mobile (design Mobile03), en ligne sur desktop.
 * Tier : présentation.
 */
import { ArrowUpDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChampRecherche } from '@/components/communs/ChampRecherche';
import { ControleSegmente } from '@/components/communs/ControleSegmente';
import { useCategories } from './hooks';

const OPTIONS_DISPONIBILITE = [
  { valeur: 'tous', libelle: 'Tous' },
  { valeur: 'disponible', libelle: 'Disponibles' },
  { valeur: 'stock_faible', libelle: 'Stock faible' },
  { valeur: 'indisponible', libelle: 'Indisponibles' },
];

const OPTIONS_TRI = [
  { valeur: 'nom_asc', libelle: 'Nom (A → Z)' },
  { valeur: 'nom_desc', libelle: 'Nom (Z → A)' },
  { valeur: 'stock_desc', libelle: 'Stock disponible' },
  { valeur: 'recent', libelle: 'Plus récents' },
];

/**
 * @typedef {{ search: string, category: string, availability: string, sort: string }} Filtres
 */

/**
 * @param {{ filtres: Filtres, surChangement: (modifications: Partial<Filtres>) => void, total?: number }} props
 */
export function FiltresCatalogue({ filtres, surChangement, total }) {
  const { data: categories = [] } = useCategories();

  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
        <ChampRecherche
          id="recherche-materiel"
          libelle="Rechercher un matériel"
          placeholder="Rechercher un matériel…"
          valeur={filtres.search}
          surChangement={(search) => surChangement({ search })}
          className="md:w-[260px] [&_input]:h-11 md:[&_input]:h-9"
        />
        <Select value={filtres.category} onValueChange={(category) => surChangement({ category })}>
          <SelectTrigger className="h-11 bg-card md:h-9 md:w-[220px]" aria-label="Catégorie">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="toutes">Toutes les catégories</SelectItem>
            {categories.map((categorie) => (
              <SelectItem key={categorie.id} value={categorie.id}>
                {categorie.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ControleSegmente
          libelle="Disponibilité"
          options={OPTIONS_DISPONIBILITE}
          valeur={filtres.availability}
          surChangement={(availability) => surChangement({ availability })}
          className="h-11 w-full overflow-x-auto md:h-9 md:w-auto"
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="chiffres text-small text-muted-foreground">
          {total !== undefined && `${total} matériel${total > 1 ? 's' : ''}`}
        </span>
        <Select value={filtres.sort} onValueChange={(sort) => surChangement({ sort })}>
          <SelectTrigger className="h-11 w-[200px] bg-card md:h-9" aria-label="Trier par">
            <span className="flex items-center gap-2">
              <ArrowUpDown className="size-4 text-muted-foreground" aria-hidden="true" />
              <SelectValue />
            </span>
          </SelectTrigger>
          <SelectContent>
            {OPTIONS_TRI.map((option) => (
              <SelectItem key={option.valeur} value={option.valeur}>
                {option.libelle}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
