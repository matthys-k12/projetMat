/**
 * État vide : icône, titre, explication et actions pour démarrer (design EmptyState).
 * Tier : présentation.
 */
import { Inbox } from 'lucide-react';

/**
 * @param {{ titre: string, description?: string, icone?: import('react').ElementType, actions?: import('react').ReactNode }} props
 */
export function EtatVide({ titre, description, icone: Icone = Inbox, actions }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <div className="mb-2 grid size-11 place-items-center rounded-lg border bg-card text-muted-strong shadow-sm">
        <Icone className="size-5" aria-hidden="true" />
      </div>
      <h2 className="text-h3">{titre}</h2>
      {description && <p className="max-w-[360px] text-muted-foreground">{description}</p>}
      {actions && <div className="mt-2 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}
