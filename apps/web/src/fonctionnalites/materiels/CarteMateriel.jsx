/**
 * Carte d'un matériel du catalogue (design ProductCard) : visuel 4:3, catégorie, nom,
 * description sur 2 lignes, badge de disponibilité, stock, lien « Détails ».
 * Sous 640 px : ligne compacte avec miniature (design Mobile03).
 * Tier : présentation.
 */
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BadgeDisponibilite } from '@/components/communs/BadgeDisponibilite';
import { VisuelMateriel } from '@/components/communs/VisuelMateriel';

/**
 * @param {number} quantite
 * @returns {string} ex. « 8 disponibles », « 0 disponible »
 */
function libelleStock(quantite) {
  return `${quantite} disponible${quantite > 1 ? 's' : ''}`;
}

/**
 * @param {{ materiel: import('./api').Materiel }} props
 */
export function CarteMateriel({ materiel }) {
  const categorie = materiel.categorie?.nom;

  return (
    <>
      <article className="hidden flex-col overflow-hidden rounded-lg border bg-card shadow-sm sm:flex">
        <VisuelMateriel nom={materiel.nom} categorie={categorie} imageUrl={materiel.imageUrl} />
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="text-caption text-muted-foreground">{categorie}</div>
          <h3 className="text-[15px] font-semibold leading-[22px]">{materiel.nom}</h3>
          <p className="line-clamp-2 min-h-9 text-small text-muted-foreground">
            {materiel.description}
          </p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <BadgeDisponibilite disponibilite={materiel.disponibilite} />
            <span className="chiffres text-small text-muted-foreground">
              {libelleStock(materiel.quantiteDisponible)}
            </span>
          </div>
        </div>
        <div className="flex justify-end border-t px-4 py-3">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/materials/${materiel.id}`} aria-label={`Détails : ${materiel.nom}`}>
              Détails
            </Link>
          </Button>
        </div>
      </article>

      <Link
        to={`/materials/${materiel.id}`}
        className="flex min-h-touch items-center gap-3 rounded-lg border bg-card p-3 shadow-sm sm:hidden"
      >
        <VisuelMateriel
          nom={materiel.nom}
          categorie={categorie}
          imageUrl={materiel.imageUrl}
          taille="miniature"
          className="h-12 w-16"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate font-medium">{materiel.nom}</span>
          <div className="flex items-center gap-2">
            <BadgeDisponibilite disponibilite={materiel.disponibilite} />
            <span className="chiffres text-caption text-muted-foreground">
              {materiel.quantiteDisponible}
            </span>
          </div>
        </div>
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
      </Link>
    </>
  );
}

/** Squelette d'une carte : mêmes dimensions que la carte finale (design Etat03). */
export function SqueletteCarteMateriel() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
        <div className="h-9 w-full animate-pulse rounded bg-muted" />
        <div className="h-[22px] w-24 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}
