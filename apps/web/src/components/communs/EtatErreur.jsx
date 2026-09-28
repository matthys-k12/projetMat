/**
 * État d'erreur : explique, propose « Réessayer » et affiche le code (design Etat03CatalogueErreur).
 * Tier : présentation.
 */
import { CircleAlert, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formaterDateHeure } from '@/lib/formatage';

/**
 * @param {{ titre?: string, erreur?: { message?: string, statut?: number }|null, surReessayer?: () => void }} props
 */
export function EtatErreur({ titre = 'Impossible de charger les données', erreur, surReessayer }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <div className="mb-2 grid size-11 place-items-center rounded-lg border border-destructive-border bg-destructive-subtle text-destructive shadow-sm">
        <CircleAlert className="size-5" aria-hidden="true" />
      </div>
      <h2 className="text-h3">{titre}</h2>
      <p className="max-w-[360px] text-muted-foreground">
        {erreur?.message ?? "Le serveur n'a pas répondu. Vérifiez votre connexion puis réessayez."}
      </p>
      {surReessayer && (
        <Button variant="outline" className="mt-2" onClick={surReessayer}>
          <RotateCw aria-hidden="true" />
          Réessayer
        </Button>
      )}
      <span className="mt-2 text-caption text-muted-foreground">
        Code : {erreur?.statut || '—'} · {formaterDateHeure(new Date())}
      </span>
    </div>
  );
}
