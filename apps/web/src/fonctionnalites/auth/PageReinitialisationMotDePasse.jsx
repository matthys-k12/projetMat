/**
 * Nouveau mot de passe après un « mot de passe oublié » (/reset-password).
 *
 * Tier : présentation. Le lien reçu par e-mail pointe ici avec un token dans l'URL
 * (#access_token=…&type=recovery). Le SDK Supabase le lit tout seul au chargement
 * et ouvre une session de récupération ; le formulaire appelle ensuite
 * POST /auth/password avec ce token, comme un changement de mot de passe normal.
 * Lien expiré ou déjà utilisé : Supabase renvoie ici avec #error_code=… et sans session.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleAlert, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alerte } from '@/components/communs/Carte';
import { Logo } from '@/app/miseEnPage/NavigationLaterale';
import { FormulaireNouveauMotDePasse } from './FormulaireNouveauMotDePasse';
import { useAuth } from './useAuth';

/** Lit l'erreur éventuelle renvoyée par Supabase dans le fragment d'URL. */
function lireErreurDuLien() {
  return new URLSearchParams(window.location.hash.slice(1)).get('error_code');
}

export function PageReinitialisationMotDePasse() {
  const { etat } = useAuth();
  // Lu une seule fois au montage : le SDK peut nettoyer l'URL ensuite
  const [erreurLien] = useState(lireErreurDuLien);

  let contenu;
  if (etat === 'chargement' && !erreurLien) {
    contenu = (
      <p className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Vérification du lien…
      </p>
    );
  } else if (etat === 'connecte' && !erreurLien) {
    contenu = <FormulaireNouveauMotDePasse />;
  } else {
    contenu = (
      <>
        <Alerte icone={CircleAlert}>
          <b className="font-medium">Lien invalide ou expiré</b>
          <div>Ce lien a déjà servi ou n&apos;est plus valable. Demandez-en un nouveau.</div>
        </Alerte>
        <Button asChild className="h-11 w-full lg:h-9">
          <Link to="/forgot-password">Recevoir un nouveau lien</Link>
        </Button>
      </>
    );
  }

  return (
    <div className="flex w-full max-w-[360px] flex-col gap-8">
      <Logo />
      <div>
        <h1 className="text-h1">Nouveau mot de passe</h1>
        <p className="mt-1 text-muted-foreground">
          Choisissez le mot de passe que vous utiliserez désormais pour vous connecter.
        </p>
      </div>
      {contenu}
    </div>
  );
}
