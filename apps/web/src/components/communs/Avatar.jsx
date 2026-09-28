/**
 * Avatar à initiales (aucune photo de profil dans le produit).
 * Tier : présentation.
 */
import { cn } from '@/lib/utils';
import { initiales } from '@/lib/formatage';

/**
 * @param {{ nom: string, grand?: boolean, className?: string }} props
 */
export function Avatar({ nom, grand = false, className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full border bg-muted font-semibold tracking-wide text-muted-strong',
        grand ? 'size-10 text-sm' : 'size-7 text-[11px]',
        className,
      )}
    >
      {initiales(nom)}
    </span>
  );
}
