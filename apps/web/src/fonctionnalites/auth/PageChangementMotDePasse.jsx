/**
 * Choix du mot de passe définitif (/change-password).
 *
 * Tier : présentation. Forcée par GardeConnexion tant que le profil indique
 * doitChangerMotDePasse (compte créé ou réinitialisé par un administrateur avec
 * un mot de passe temporaire) ; accessible aussi volontairement depuis le profil.
 * L'API revalide les règles et refuse de réutiliser le mot de passe actuel.
 */
import { KeyRound, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alerte } from '@/components/communs/Carte';
import { Logo } from '@/app/miseEnPage/NavigationLaterale';
import { FormulaireNouveauMotDePasse } from './FormulaireNouveauMotDePasse';
import { useAuth } from './useAuth';

export function PageChangementMotDePasse() {
  const { profil, seDeconnecter } = useAuth();
  const force = profil?.doitChangerMotDePasse;

  return (
    <div className="flex w-full max-w-[360px] flex-col gap-8">
      <Logo />
      <div>
        <h1 className="text-h1">Choisissez votre mot de passe</h1>
        <p className="mt-1 text-muted-foreground">
          {profil?.prenom ? `Bienvenue, ${profil.prenom}. ` : ''}
          {force
            ? 'Remplacez le mot de passe temporaire fourni par votre administrateur.'
            : 'Choisissez un nouveau mot de passe pour votre compte.'}
        </p>
      </div>

      {force && (
        <Alerte ton="warning" icone={KeyRound}>
          Cette étape est obligatoire avant d&apos;accéder à l&apos;application. Votre
          administrateur ne connaîtra pas ce nouveau mot de passe.
        </Alerte>
      )}

      <FormulaireNouveauMotDePasse />

      <Button variant="ghost" className="self-start" onClick={seDeconnecter}>
        <LogOut aria-hidden="true" /> Se déconnecter
      </Button>
    </div>
  );
}
