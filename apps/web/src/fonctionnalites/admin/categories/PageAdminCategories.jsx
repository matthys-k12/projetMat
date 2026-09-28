/**
 * Catégories (design Ecran14) : tableau simple, Dialog de création / édition, activation.
 *
 * Tier : présentation. Pas de suppression : une catégorie contenant des matériels
 * ne peut pas être supprimée (clé étrangère ON DELETE RESTRICT) ; on la désactive.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { FolderTree, Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { EnTetePage } from '@/components/communs/EnTetePage';
import { Carte } from '@/components/communs/Carte';
import { EtatVide } from '@/components/communs/EtatVide';
import { EtatErreur } from '@/components/communs/EtatErreur';
import { SqueletteListe } from '@/fonctionnalites/demandes/ListeDemandes';
import { formaterDate } from '@/lib/formatage';
import { useCategoriesAdmin, useChangerStatutCategorie } from './hooks';
import { DialogueCategorie } from './DialogueCategorie';

const TH =
  'h-10 bg-background px-4 text-left text-caption font-medium text-muted-foreground first:pl-5 last:pr-5';
const TD = 'h-[52px] border-t px-4 first:pl-5 last:pr-5';

export function PageAdminCategories() {
  const requete = useCategoriesAdmin();
  const statut = useChangerStatutCategorie();
  // undefined = dialog fermé, null = création, objet = édition
  const [enEdition, setEnEdition] = useState(undefined);

  async function basculer(categorie, actif) {
    try {
      await statut.mutateAsync({ id: categorie.id, actif });
      toast.success(`Catégorie ${categorie.nom} ${actif ? 'activée' : 'désactivée'}`);
    } catch (erreur) {
      toast.error(erreur.message);
    }
  }

  return (
    <>
      <EnTetePage
        titre="Catégories"
        description="Organisez le catalogue. Une catégorie désactivée masque ses matériels aux collaborateurs."
        actions={
          <Button onClick={() => setEnEdition(null)}>
            <Plus aria-hidden="true" /> Nouvelle catégorie
          </Button>
        }
      />
      <Carte className="overflow-x-auto">
        {requete.isPending && <SqueletteListe />}
        {requete.isError && <EtatErreur erreur={requete.error} surReessayer={requete.refetch} />}
        {requete.isSuccess && requete.data.length === 0 && (
          <EtatVide
            icone={FolderTree}
            titre="Aucune catégorie"
            description="Créez une première catégorie."
          />
        )}
        {requete.isSuccess && requete.data.length > 0 && (
          <table className="w-full min-w-[640px]">
            <thead>
              <tr>
                <th className={TH}>Nom</th>
                <th className={TH}>Description</th>
                <th className={`${TH} text-right`}>Matériels</th>
                <th className={TH}>Créée le</th>
                <th className={TH}>Statut</th>
                <th className={TH}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {requete.data.map((categorie) => (
                <tr key={categorie.id} className="hover:bg-background">
                  <td className={`${TD} font-medium`}>{categorie.nom}</td>
                  <td className={`${TD} text-muted-foreground`}>{categorie.description}</td>
                  <td className={`${TD} chiffres text-right`}>{categorie.nombreMateriels}</td>
                  <td className={`${TD} chiffres text-muted-foreground`}>
                    {formaterDate(categorie.dateCreation)}
                  </td>
                  <td className={TD}>
                    <Switch
                      checked={categorie.actif}
                      disabled={statut.isPending}
                      onCheckedChange={(actif) => basculer(categorie, actif)}
                      aria-label={`Active : ${categorie.nom}`}
                    />
                  </td>
                  <td className={`${TD} w-px text-right`}>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      aria-label={`Modifier ${categorie.nom}`}
                      onClick={() => setEnEdition(categorie)}
                    >
                      <Pencil />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Carte>
      <DialogueCategorie
        ouvert={enEdition !== undefined}
        categorie={enEdition}
        surFermer={() => setEnEdition(undefined)}
      />
    </>
  );
}
