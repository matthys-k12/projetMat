/**
 * Page de connexion (design Ecran01Connexion / Mobile01Connexion).
 *
 * Tier : présentation. React Hook Form + zod pour la validation ; la connexion
 * elle-même passe par Supabase Auth (seul usage du SDK côté front), puis le
 * profil est chargé via l'API.
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, CircleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChampFormulaire } from '@/components/communs/ChampFormulaire';
import { Alerte } from '@/components/communs/Carte';
import { Logo } from '@/app/miseEnPage/NavigationLaterale';
import { schemaConnexion } from './schemas';
import { useAuth } from './useAuth';

export function PageConnexion() {
  const { etat, seConnecter } = useAuth();
  const naviguer = useNavigate();
  const emplacement = useLocation();
  const [erreurConnexion, setErreurConnexion] = useState(false);
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schemaConnexion),
    defaultValues: { email: '', motDePasse: '' },
  });

  if (etat === 'connecte') return <Navigate to="/dashboard" replace />;

  /** @param {{ email: string, motDePasse: string }} valeurs */
  async function soumettre(valeurs) {
    setErreurConnexion(false);
    try {
      await seConnecter(valeurs.email, valeurs.motDePasse);
      naviguer(emplacement.state?.depuis ?? '/dashboard', { replace: true });
    } catch {
      // Message volontairement générique : ne pas révéler si l'e-mail existe
      setErreurConnexion(true);
    }
  }

  return (
    <div className="flex w-full max-w-[360px] flex-col gap-8">
      <Logo />
      <div>
        <h1 className="text-h1">Connexion</h1>
        <p className="mt-1 text-muted-foreground">
          Accédez à vos demandes de matériel informatique.
        </p>
      </div>

      <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit(soumettre)}>
        {erreurConnexion && (
          <Alerte icone={CircleAlert}>
            <b className="font-medium">E-mail ou mot de passe incorrect</b>
            <div>Vérifiez vos identifiants puis réessayez.</div>
          </Alerte>
        )}

        <ChampFormulaire id="email" libelle="Adresse e-mail" erreur={errors.email?.message}>
          {(attributs) => (
            <Input
              {...attributs}
              type="email"
              autoComplete="email"
              className="h-11 lg:h-9"
              {...register('email')}
            />
          )}
        </ChampFormulaire>

        <ChampFormulaire id="motDePasse" libelle="Mot de passe" erreur={errors.motDePasse?.message}>
          {(attributs) => (
            <div className="relative">
              <Input
                {...attributs}
                type={motDePasseVisible ? 'text' : 'password'}
                autoComplete="current-password"
                className="h-11 pr-11 lg:h-9"
                {...register('motDePasse')}
              />
              <Button
                type="button"
                variant="ghost"
                size="iconSm"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 lg:right-0.5"
                aria-label={
                  motDePasseVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                }
                aria-pressed={motDePasseVisible}
                onClick={() => setMotDePasseVisible(!motDePasseVisible)}
              >
                {motDePasseVisible ? <EyeOff /> : <Eye />}
              </Button>
            </div>
          )}
        </ChampFormulaire>

        <Button type="submit" className="h-11 w-full lg:h-9" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
          {isSubmitting ? 'Connexion…' : 'Se connecter'}
        </Button>
      </form>

      <p className="text-caption text-muted-foreground">
        Problème d&apos;accès ? Contactez le support IT au poste 4400.
      </p>
    </div>
  );
}
