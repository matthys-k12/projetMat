/**
 * Contrôle segmenté (design SegmentedControl) : choix exclusif parmi quelques options.
 * Tier : présentation. Accessibilité : radiogroup / radio + aria-checked.
 */
import { cn } from '@/lib/utils';

/**
 * @param {{
 *   libelle: string,
 *   options: { valeur: string, libelle: string }[],
 *   valeur: string,
 *   surChangement: (valeur: string) => void,
 *   className?: string,
 * }} props
 */
export function ControleSegmente({ libelle, options, valeur, surChangement, className }) {
  return (
    <div
      role="radiogroup"
      aria-label={libelle}
      className={cn('inline-flex h-9 gap-0.5 rounded-md bg-muted p-[3px]', className)}
    >
      {options.map((option) => {
        const actif = option.valeur === valeur;
        return (
          <button
            key={option.valeur}
            type="button"
            role="radio"
            aria-checked={actif}
            onClick={() => surChangement(option.valeur)}
            className={cn(
              'inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-sm px-3 text-small font-medium',
              actif
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-strong hover:text-foreground',
            )}
          >
            {option.libelle}
          </button>
        );
      })}
    </div>
  );
}
