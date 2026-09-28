/**
 * Pagination : « Page X sur Y » + boutons précédent / suivant.
 * Tier : présentation. Reçoit le « meta » renvoyé par l'API { page, limite, total, totalPages }.
 */
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * @param {{ meta?: { page: number, limite: number, total: number, totalPages: number }, surChangement: (page: number) => void, libelle?: string }} props
 */
export function Pagination({ meta, surChangement, libelle = 'résultats' }) {
  if (!meta || meta.total === 0) return null;
  const debut = (meta.page - 1) * meta.limite + 1;
  const fin = Math.min(meta.page * meta.limite, meta.total);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-4 border-t px-5 py-3 text-small text-muted-foreground"
    >
      <span className="chiffres">
        {debut}–{fin} sur {meta.total} {libelle}
      </span>
      <div className="flex items-center gap-2">
        <span className="chiffres hidden sm:inline">
          Page {meta.page} sur {meta.totalPages}
        </span>
        <Button
          variant="outline"
          size="iconSm"
          aria-label="Page précédente"
          disabled={meta.page <= 1}
          onClick={() => surChangement(meta.page - 1)}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="iconSm"
          aria-label="Page suivante"
          disabled={meta.page >= meta.totalPages}
          onClick={() => surChangement(meta.page + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}
