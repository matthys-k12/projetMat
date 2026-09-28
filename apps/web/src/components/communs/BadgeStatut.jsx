/**
 * Badge de statut d'une demande : pastille + libellé français (jamais la couleur seule).
 * Tier : présentation. Libellés et couleurs centralisés dans lib/constantes.js.
 */
import { cn } from '@/lib/utils';
import { STATUTS_DEMANDE } from '@/lib/constantes';

/**
 * Badge générique : pastille 6px + libellé, hauteur 22px (design StatusBadge).
 * @param {{ libelle: string, classes: string, pastille: string, className?: string }} props
 */
export function Pastille({ libelle, classes, pastille, className }) {
  return (
    <span
      className={cn(
        'inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-full border px-2 text-caption font-medium',
        classes,
        className,
      )}
    >
      <span aria-hidden="true" className={cn('size-1.5 shrink-0 rounded-full', pastille)} />
      {libelle}
    </span>
  );
}

/**
 * @param {{ statut: 'PENDING'|'APPROVED'|'REJECTED'|'CANCELLED'|'FULFILLED', className?: string }} props
 */
export function BadgeStatut({ statut, className }) {
  const style = STATUTS_DEMANDE[statut];
  if (!style) return null;
  return <Pastille {...style} className={className} />;
}
