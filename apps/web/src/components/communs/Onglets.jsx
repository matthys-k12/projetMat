/**
 * Onglets de filtre avec compteur (design Tabs) ; défilent horizontalement sur mobile.
 * Tier : présentation.
 */
import { cn } from '@/lib/utils';

/**
 * @param {{
 *   libelle: string,
 *   onglets: { valeur: string, libelle: string, compteur?: number }[],
 *   valeur: string,
 *   surChangement: (valeur: string) => void,
 * }} props
 */
export function Onglets({ libelle, onglets, valeur, surChangement }) {
  return (
    <div role="tablist" aria-label={libelle} className="flex gap-6 overflow-x-auto border-b">
      {onglets.map((onglet) => {
        const actif = onglet.valeur === valeur;
        return (
          <button
            key={onglet.valeur}
            type="button"
            role="tab"
            aria-selected={actif}
            onClick={() => surChangement(onglet.valeur)}
            className={cn(
              '-mb-px inline-flex h-10 shrink-0 items-center gap-2 border-b-2 text-sm font-medium',
              actif
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {onglet.libelle}
            {onglet.compteur !== undefined && (
              <span className="chiffres rounded-full bg-muted px-1.5 text-caption text-muted-strong">
                {onglet.compteur}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
