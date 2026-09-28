/**
 * Tableau des matériels (admin) avec interrupteur Actif / Inactif et lien de modification.
 * Sous md : cartes. Tier : présentation.
 */
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { BadgeDisponibilite } from '@/components/communs/BadgeDisponibilite';
import { VisuelMateriel } from '@/components/communs/VisuelMateriel';
import { cn } from '@/lib/utils';
import { useChangerStatutMateriel } from './hooks';

const TH = 'h-10 bg-background px-4 text-left text-caption font-medium text-muted-foreground first:pl-5 last:pr-5';
const TD = 'h-12 border-t px-4 first:pl-5 last:pr-5';

/**
 * Interrupteur de statut, avec toast nommant le matériel.
 * @param {{ materiel: import('@/fonctionnalites/materiels/api').Materiel }} props
 */
function InterrupteurStatut({ materiel }) {
  const statut = useChangerStatutMateriel();

  async function basculer(actif) {
    try {
      await statut.mutateAsync({ id: materiel.id, actif });
      toast.success(`${materiel.nom} ${actif ? 'activé' : 'désactivé'}`);
    } catch (erreur) {
      toast.error(erreur.message);
    }
  }

  return (
    <span className="flex items-center gap-2.5">
      <Switch
        checked={materiel.actif}
        disabled={statut.isPending}
        onCheckedChange={basculer}
        aria-label={`Actif : ${materiel.nom}`}
      />
      <span className={cn('text-small', !materiel.actif && 'text-muted-foreground')}>
        {materiel.actif ? 'Actif' : 'Inactif'}
      </span>
    </span>
  );
}

/**
 * @param {{ materiels: import('@/fonctionnalites/materiels/api').Materiel[] }} props
 */
export function TableauMaterielsAdmin({ materiels }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead>
            <tr>
              <th className={TH}>Matériel</th>
              <th className={TH}>Catégorie</th>
              <th className={`${TH} text-right`}>Total</th>
              <th className={`${TH} text-right`}>Disponible</th>
              <th className={`${TH} text-right`}>Seuil</th>
              <th className={TH}>Stock</th>
              <th className={TH}>Statut</th>
              <th className={TH}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {materiels.map((m) => (
              <tr key={m.id} className="hover:bg-background">
                <td className={TD}>
                  <span className="flex items-center gap-2.5">
                    <VisuelMateriel nom={m.nom} categorie={m.categorie?.nom} imageUrl={m.imageUrl} taille="miniature" />
                    <span className="font-medium">{m.nom}</span>
                  </span>
                </td>
                <td className={`${TD} text-muted-foreground`}>{m.categorie?.nom}</td>
                <td className={`${TD} chiffres text-right`}>{m.quantiteTotale}</td>
                <td className={cn(TD, 'chiffres text-right', m.disponibilite !== 'disponible' && 'font-medium text-warning-text')}>
                  {m.quantiteDisponible}
                </td>
                <td className={`${TD} chiffres text-right text-muted-foreground`}>{m.stockMinimum}</td>
                <td className={TD}>
                  <BadgeDisponibilite disponibilite={m.disponibilite} />
                </td>
                <td className={TD}>
                  <InterrupteurStatut materiel={m} />
                </td>
                <td className={`${TD} w-px text-right`}>
                  <Button variant="ghost" size="iconSm" asChild>
                    <Link to={`/admin/materials/${m.id}/edit`} aria-label={`Modifier ${m.nom}`}>
                      <Pencil />
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y md:hidden">
        {materiels.map((m) => (
          <li key={m.id} className="flex items-center gap-3 px-4 py-3">
            <VisuelMateriel nom={m.nom} categorie={m.categorie?.nom} imageUrl={m.imageUrl} taille="miniature" />
            <Link to={`/admin/materials/${m.id}/edit`} className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate font-medium">{m.nom}</span>
              <span className="chiffres text-caption text-muted-foreground">
                {m.quantiteDisponible} / {m.quantiteTotale} · seuil {m.stockMinimum}
              </span>
            </Link>
            <InterrupteurStatut materiel={m} />
          </li>
        ))}
      </ul>
    </>
  );
}
