/**
 * Mot de passe oublié (/forgot-password, page publique).
 *
 * Tier : présentation. Envoie l'adresse à l'API (POST /auth/password/forgot), qui
 * fait envoyer par Supabase Auth un lien vers /reset-password. Le message de
 * confirmation est le même que l'adresse ait un compte ou non : la page ne
 * permet pas de deviner qui a un compte.
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChampFormulaire } from '@/components/communs/ChampFormulaire';
import { Logo } from '@/app/miseEnPage/NavigationLaterale';
import { demanderReinitialisation } from './api';
import { schemaMotDePasseOublie } from './schemas';

export function PageMotDePasseOublie() {
  // Adresse à laquelle le lien a été demandé (null tant que le formulaire n'est pas envoyé)
  const [adresseEnvoyee, setAdresseEnvoyee] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schemaMotDePasseOublie),
    defaultValues: { email: '' },
  });

  /** @param {{ email: string }} valeurs */
  async function soumettre(valeurs) {
    try {
      await demanderReinitialisation(valeurs.email);
      setAdresseEnvoyee(valeurs.email);
    } catch (erreur) {
      toast.error(erreur.message);
    }
  }

  return (
    <div className="flex w-full max-w-[360px] flex-col gap-8">
      <Logo />
      <div>
        <h1 className="text-h1">Mot de passe oublié</h1>
        <p className="mt-1 text-muted-foreground">
          {adresseEnvoyee
            ? 'Consultez votre boîte de réception.'
            : 'Indiquez votre adresse e-mail professionnelle : nous vous enverrons un lien pour choisir un nouveau mot de passe.'}
        </p>
      </div>

      {adresseEnvoyee ? (
        <div className="flex flex-col gap-3 rounded-md border bg-background p-4 text-small">
          <MailCheck className="size-5 text-primary" aria-hidden="true" />
          <p>
            Si un compte actif correspond à <b className="font-medium">{adresseEnvoyee}</b>, un
            e-mail contenant un lien de réinitialisation vient d&apos;être envoyé. Le lien est
            valable 1 heure.
          </p>
          <p className="text-muted-foreground">
            Rien reçu après quelques minutes ? Vérifiez vos indésirables, ou contactez le support
            IT (poste 4400) : un administrateur peut vous attribuer un mot de passe temporaire.
          </p>
        </div>
      ) : (
        <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit(soumettre)}>
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
          <Button type="submit" className="h-11 w-full lg:h-9" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
            Envoyer le lien
          </Button>
        </form>
      )}

      <Button asChild variant="ghost" className="self-start">
        <Link to="/login">
          <ArrowLeft aria-hidden="true" /> Retour à la connexion
        </Link>
      </Button>
    </div>
  );
}
