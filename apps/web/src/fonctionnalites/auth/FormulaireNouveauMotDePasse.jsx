/**
 * Formulaire « nouveau mot de passe + confirmation », partagé par :
 * - /change-password (mot de passe temporaire à remplacer, ou changement volontaire) ;
 * - /reset-password (fin du « mot de passe oublié », après le lien reçu par e-mail).
 *
 * Tier : présentation. Mêmes règles que l'API (10 caractères, majuscule, chiffre),
 * qui les revalide et refuse en plus de réutiliser le mot de passe actuel.
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChampFormulaire } from '@/components/communs/ChampFormulaire';
import { changerMotDePasse } from './api';
import { schemaChangementMotDePasse } from './schemas';
import { useAuth } from './useAuth';

export function FormulaireNouveauMotDePasse() {
  const { rechargerProfil } = useAuth();
  const naviguer = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schemaChangementMotDePasse),
    defaultValues: { nouveauMotDePasse: '', confirmation: '' },
  });

  /** @param {{ nouveauMotDePasse: string }} valeurs */
  async function soumettre(valeurs) {
    try {
      await changerMotDePasse(valeurs.nouveauMotDePasse);
      await rechargerProfil();
      toast.success('Mot de passe enregistré');
      naviguer('/dashboard', { replace: true });
    } catch (erreur) {
      toast.error(erreur.message);
    }
  }

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit(soumettre)}>
      <ChampFormulaire
        id="nouveauMotDePasse"
        libelle="Nouveau mot de passe"
        erreur={errors.nouveauMotDePasse?.message}
        aide="10 caractères minimum, dont une majuscule et un chiffre."
      >
        {(attributs) => (
          <Input
            {...attributs}
            type="password"
            autoComplete="new-password"
            className="h-11 lg:h-9"
            {...register('nouveauMotDePasse')}
          />
        )}
      </ChampFormulaire>
      <ChampFormulaire id="confirmation" libelle="Confirmation" erreur={errors.confirmation?.message}>
        {(attributs) => (
          <Input
            {...attributs}
            type="password"
            autoComplete="new-password"
            className="h-11 lg:h-9"
            {...register('confirmation')}
          />
        )}
      </ChampFormulaire>
      <Button type="submit" className="h-11 w-full lg:h-9" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
        Enregistrer le mot de passe
      </Button>
    </form>
  );
}
