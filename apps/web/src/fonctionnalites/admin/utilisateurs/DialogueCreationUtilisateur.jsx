/**
 * Dialog « Ajouter un collaborateur » : prénom, nom, e-mail, rôle.
 * Après succès, transmet le mot de passe temporaire au parent, qui l'affiche une seule fois.
 * Tier : présentation.
 */
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useCreerUtilisateur } from './hooks';
import { schemaNouvelUtilisateur } from './schemas';

const VALEURS_VIDES = { prenom: '', nom: '', email: '', role: 'USER' };

/**
 * @param {{
 *   ouvert: boolean,
 *   surFermer: () => void,
 *   surCree: (resultat: { utilisateur: import('./api').Utilisateur, motDePasseTemporaire: string }) => void,
 * }} props
 */
export function DialogueCreationUtilisateur({ ouvert, surFermer, surCree }) {
  const creation = useCreerUtilisateur();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schemaNouvelUtilisateur), defaultValues: VALEURS_VIDES });

  useEffect(() => {
    if (ouvert) reset(VALEURS_VIDES);
  }, [ouvert, reset]);

  async function soumettre(valeurs) {
    try {
      const resultat = await creation.mutateAsync(valeurs);
      toast.success(`Compte de ${resultat.utilisateur.nomComplet} créé`);
      surCree(resultat);
    } catch (erreur) {
      // ex. 409 « Un compte existe déjà avec cette adresse e-mail. »
      toast.error(erreur.message);
    }
  }

  return (
    <Dialog open={ouvert} onOpenChange={(etat) => !etat && surFermer()}>
      <DialogContent className="max-w-[480px]">
        <form noValidate onSubmit={handleSubmit(soumettre)} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Ajouter un collaborateur</DialogTitle>
            <DialogDescription>
              Un mot de passe temporaire sera généré. Le collaborateur devra le remplacer à sa
              première connexion.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <ChampFormulaire
              id="prenom"
              libelle="Prénom"
              obligatoire
              erreur={errors.prenom?.message}
            >
              {(a) => <Input {...a} autoComplete="off" {...register('prenom')} />}
            </ChampFormulaire>
            <ChampFormulaire id="nom" libelle="Nom" obligatoire erreur={errors.nom?.message}>
              {(a) => <Input {...a} autoComplete="off" {...register('nom')} />}
            </ChampFormulaire>
          </div>
          <ChampFormulaire
            id="email-compte"
            libelle="Adresse e-mail"
            obligatoire
            erreur={errors.email?.message}
          >
            {(a) => <Input {...a} type="email" autoComplete="off" {...register('email')} />}
          </ChampFormulaire>
          <ChampFormulaire id="role" libelle="Rôle">
            {(a) => (
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger {...a}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">Collaborateur</SelectItem>
                      <SelectItem value="ADMIN">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </ChampFormulaire>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </DialogClose>
            <Button type="submit" disabled={creation.isPending}>
              {creation.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              Créer le compte
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
