/**
 * Sélecteur de quantité (design QuantityStepper) : [−] valeur [+], bornes min / max.
 * Tier : présentation.
 */
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * @param {{
 *   valeur: number,
 *   surChangement: (valeur: number) => void,
 *   min?: number,
 *   max?: number,
 *   invalide?: boolean,
 *   grand?: boolean,
 *   idLibelle?: string,
 *   idErreur?: string,
 * }} props
 */
export function SelecteurQuantite({
  valeur,
  surChangement,
  min = 1,
  max = Infinity,
  invalide = false,
  grand = false,
  idLibelle,
  idErreur,
}) {
  const classesBouton = cn(
    'grid place-items-center text-muted-strong hover:bg-muted disabled:opacity-40',
    grand ? 'size-[42px]' : 'size-[34px]',
  );

  return (
    <div
      role="group"
      aria-labelledby={idLibelle}
      aria-describedby={idErreur}
      aria-invalid={invalide || undefined}
      className={cn(
        'inline-flex items-center rounded-md border bg-card shadow-sm',
        invalide ? 'border-destructive' : 'border-input',
        grand ? 'h-11' : 'h-9',
      )}
    >
      <button
        type="button"
        className={cn(classesBouton, 'border-r')}
        aria-label="Diminuer la quantité"
        disabled={valeur <= min}
        onClick={() => surChangement(valeur - 1)}
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <output aria-live="polite" className="chiffres min-w-11 text-center font-medium">
        {valeur}
      </output>
      <button
        type="button"
        className={cn(classesBouton, 'border-l')}
        aria-label="Augmenter la quantité"
        disabled={valeur >= max}
        onClick={() => surChangement(valeur + 1)}
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
