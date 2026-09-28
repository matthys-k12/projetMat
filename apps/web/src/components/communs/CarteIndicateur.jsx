/**
 * Indicateurs (KPI) : une bande unique à bordures, cellules séparées par un filet
 * (le design interdit les grilles de cartes KPI colorées).
 * Tier : présentation.
 */
import { cn } from '@/lib/utils';

/**
 * Conteneur des indicateurs.
 * @param {{ children: import('react').ReactNode, className?: string }} props
 */
export function BandeIndicateurs({ children, className }) {
  return (
    <section
      aria-label="Indicateurs"
      className={cn(
        // Filets entre cellules : en grille 2×2 sur mobile, en ligne à partir de lg
        'grid grid-cols-2 overflow-hidden rounded-lg border bg-card shadow-sm [&>*]:-mb-px [&>*]:-mr-px [&>*]:border-b [&>*]:border-r lg:grid-flow-col lg:grid-cols-none lg:auto-cols-fr',
        className,
      )}
    >
      {children}
    </section>
  );
}

/**
 * Un indicateur : libellé (avec pastille éventuelle), valeur, précision.
 * @param {{ libelle: string, valeur: import('react').ReactNode, precision?: string, pastille?: string }} props
 */
export function CarteIndicateur({ libelle, valeur, precision, pastille }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-4">
      <div className="flex items-center gap-1.5 text-label text-muted-foreground">
        {pastille && <span aria-hidden="true" className={cn('size-1.5 rounded-full', pastille)} />}
        {libelle}
      </div>
      <div className="chiffres text-[24px] font-semibold leading-8 tracking-tight">{valeur}</div>
      {precision && <div className="text-caption text-muted-foreground">{precision}</div>}
    </div>
  );
}
