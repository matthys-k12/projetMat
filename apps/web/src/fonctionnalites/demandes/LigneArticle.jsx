/**
 * Ligne d'article de la nouvelle demande : choix du matériel (avec stock), quantité, suppression.
 * Desktop : une rangée (design Ecran05) ; mobile : une carte par article (design Mobile05).
 * Tier : présentation.
 */
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SelecteurQuantite } from '@/components/communs/SelecteurQuantite';
import { MessageErreur } from '@/components/communs/ChampFormulaire';
import { VisuelMateriel } from '@/components/communs/VisuelMateriel';
import { cn } from '@/lib/utils';

/**
 * @param {{
 *   ligne: import('./ContextePanier').LignePanier,
 *   index: number,
 *   catalogue: import('@/fonctionnalites/materiels/api').Materiel[],
 *   idsDejaChoisis: string[],
 *   erreur?: string,
 *   surChangerMateriel: (materiel: import('@/fonctionnalites/materiels/api').Materiel) => void,
 *   surChangerQuantite: (quantite: number) => void,
 *   surSupprimer: () => void,
 * }} props
 */
export function LigneArticle({
  ligne,
  index,
  catalogue,
  idsDejaChoisis,
  erreur,
  surChangerMateriel,
  surChangerQuantite,
  surSupprimer,
}) {
  const idChamp = `materiel-${index}`;
  const idQuantite = `quantite-${index}`;
  const idErreur = `ligne-${index}-erreur`;
  const nom = ligne.materiel?.nom ?? 'matériel';
  const stock = ligne.materiel?.quantiteDisponible ?? 0;

  return (
    <div className="grid grid-cols-[1fr_auto] items-end gap-3 border-t px-4 py-4 first:border-t-0 md:grid-cols-[1fr_128px_36px] md:px-5">
      <div className="col-span-2 flex flex-col gap-1.5 md:col-span-1">
        <label htmlFor={idChamp} className="text-label">
          Matériel
        </label>
        <Select
          value={ligne.materiel?.id ?? ''}
          onValueChange={(id) => surChangerMateriel(catalogue.find((m) => m.id === id))}
        >
          <SelectTrigger id={idChamp} className="h-11 bg-card md:h-9" aria-describedby={erreur ? idErreur : undefined}>
            <SelectValue placeholder="Choisir un matériel…" />
          </SelectTrigger>
          <SelectContent>
            {catalogue.map((materiel) => (
              <SelectItem
                key={materiel.id}
                value={materiel.id}
                // Un matériel déjà présent sur une autre ligne n'est pas proposé (pas de doublon)
                disabled={materiel.quantiteDisponible === 0 || (idsDejaChoisis.includes(materiel.id) && materiel.id !== ligne.materiel?.id)}
              >
                <span className="flex items-center gap-2">
                  <VisuelMateriel nom={materiel.nom} categorie={materiel.categorie?.nom} taille="miniature" className="h-[18px] w-6" />
                  {materiel.nom}
                  <span className={cn('text-caption', materiel.disponibilite === 'stock_faible' ? 'text-warning-text' : 'text-muted-foreground')}>
                    {materiel.quantiteDisponible} en stock
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <span id={idQuantite} className="text-label">
          Quantité
        </span>
        <SelecteurQuantite
          valeur={ligne.quantite}
          surChangement={surChangerQuantite}
          max={Math.max(stock, 1)}
          invalide={Boolean(erreur)}
          idLibelle={idQuantite}
          idErreur={erreur ? idErreur : undefined}
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-11 md:size-9"
        aria-label={`Supprimer ${nom}`}
        onClick={surSupprimer}
      >
        <Trash2 />
      </Button>

      {erreur && (
        <div className="col-span-full">
          <MessageErreur id={idErreur}>{erreur}</MessageErreur>
        </div>
      )}
    </div>
  );
}
