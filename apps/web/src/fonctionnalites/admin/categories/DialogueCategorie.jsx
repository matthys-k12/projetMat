/**
 * Dialog de création / modification d'une catégorie (design Ecran14).
 * Tier : présentation. React Hook Form + zod (mêmes règles que l'API).
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChampFormulaire } from '@/components/communs/ChampFormulaire';
import { useCreerCategorie, useModifierCategorie } from './hooks';

const schemaCategorie = z.object({
  nom: z
    .string()
    .trim()
    .min(2, { message: 'Le nom doit contenir au moins 2 caractères.' })
    .max(100, { message: 'Le nom est limité à 100 caractères.' }),
  description: z
    .string()
    .trim()
    .max(500, { message: 'La description est limitée à 500 caractères.' }),
});

/**
 * @param {{ ouvert: boolean, surFermer: () => void, categorie?: { id: string, nom: string, description: string|null }|null }} props
 */
export function DialogueCategorie({ ouvert, surFermer, categorie }) {
  const creation = useCreerCategorie();
  const modification = useModifierCategorie();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schemaCategorie),
    defaultValues: { nom: '', description: '' },
  });

  useEffect(() => {
    if (ouvert) reset({ nom: categorie?.nom ?? '', description: categorie?.description ?? '' });
  }, [ouvert, categorie, reset]);

  async function soumettre(valeurs) {
    const corps = { nom: valeurs.nom, description: valeurs.description || null };
    try {
      if (categorie) await modification.mutateAsync({ id: categorie.id, corps });
      else await creation.mutateAsync(corps);
      toast.success(`Catégorie ${valeurs.nom} ${categorie ? 'modifiée' : 'créée'}`);
      surFermer();
    } catch (erreur) {
      // ex. 409 : « Cet élément existe déjà. » (nom unique)
      toast.error(erreur.message);
    }
  }

  const enCours = creation.isPending || modification.isPending;

  return (
    <Dialog open={ouvert} onOpenChange={(etat) => !etat && surFermer()}>
      <DialogContent className="max-w-[480px]">
        <form noValidate onSubmit={handleSubmit(soumettre)} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>
              {categorie ? `Modifier ${categorie.nom}` : 'Nouvelle catégorie'}
            </DialogTitle>
            <DialogDescription>
              Les catégories organisent le catalogue et ses filtres.
            </DialogDescription>
          </DialogHeader>
          <ChampFormulaire
            id="nom-categorie"
            libelle="Nom"
            obligatoire
            erreur={errors.nom?.message}
          >
            {(a) => <Input {...a} {...register('nom')} />}
          </ChampFormulaire>
          <ChampFormulaire
            id="description-categorie"
            libelle="Description"
            erreur={errors.description?.message}
          >
            {(a) => <Textarea {...a} rows={3} maxLength={500} {...register('description')} />}
          </ChampFormulaire>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </DialogClose>
            <Button type="submit" disabled={enCours}>
              {enCours && <Loader2 className="animate-spin" aria-hidden="true" />}
              Enregistrer la catégorie
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
