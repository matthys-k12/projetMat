/**
 * Choix du mot de passe définitif (/change-password).
 *
 * Tier : présentation. Forcée par GardeConnexion tant que le profil indique
 * doitChangerMotDePasse (compte créé par un administrateur avec un mot de passe
 * temporaire) ; accessible aussi volontairement depuis le profil.
 * L'API revalide les règles et refuse de réutiliser le mot de passe actuel.
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { KeyRound, Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChampFormulaire } from '@/components/communs/ChampFormulaire';
import { Alerte } from '@/components/communs/Carte';
import { Logo } from '@/app/miseEnPage/NavigationLaterale';
import { changerMotDePasse } from './api';
import { schemaChangementMotDePasse } from './schemas';
import { useAuth } from './useAuth';

export function PageChangementMotDePasse() {
  const { profil, rechargerProfil, seDeconnecter } = useAuth();
  const naviguer = useNavigate();
  const force = profil?.doitChangerMotDePasse;

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
    <div className="flex w-full max-w-[360px] flex-col gap-8">
      <Logo />
      <div>
        <h1 className="text-h1">Choisissez votre mot de passe</h1>
        <p className="mt-1 text-muted-foreground">
          {profil?.prenom ? `Bienvenue, ${profil.prenom}. ` : ''}
          Remplacez le mot de passe temporaire fourni par votre administrateur.
        </p>
      </div>

      {force && (
        <Alerte ton="warning" icone={KeyRound}>
          Cette étape est obligatoire avant d&apos;accéder à l&apos;application. Votre
          administrateur ne connaîtra pas ce nouveau mot de passe.
        </Alerte>
      )}

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
        <ChampFormulaire
          id="confirmation"
          libelle="Confirmation"
          erreur={errors.confirmation?.message}
        >
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

      <Button variant="ghost" className="self-start" onClick={seDeconnecter}>
        <LogOut aria-hidden="true" /> Se déconnecter
      </Button>
    </div>
  );
}
