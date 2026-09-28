/**
 * Profil de l'utilisateur connecté (lecture seule) : identité et rôle, lus via GET /auth/me.
 * Tier : présentation.
 */
import { Link } from 'react-router-dom';
import { KeyRound, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EnTetePage } from '@/components/communs/EnTetePage';
import { Carte, CorpsCarte, EnTeteCarte } from '@/components/communs/Carte';
import { Avatar } from '@/components/communs/Avatar';
import { useAuth } from '@/fonctionnalites/auth/useAuth';
import { formaterDate } from '@/lib/formatage';

const ROLES = { USER: 'Collaborateur', ADMIN: 'Administrateur' };

export function PageProfil() {
  const { profil, seDeconnecter } = useAuth();
  if (!profil) return null;

  return (
    <>
      <EnTetePage titre="Profil" description="Vos informations de compte." />
      <Carte className="max-w-[720px]">
        <EnTeteCarte>
          <div className="flex items-center gap-3">
            <Avatar nom={profil.nomComplet} grand />
            <div>
              <div className="text-h3">{profil.nomComplet}</div>
              <div className="text-small text-muted-foreground">{profil.email}</div>
            </div>
          </div>
        </EnTeteCarte>
        <CorpsCarte>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[160px_1fr]">
            <dt className="text-muted-foreground">Prénom</dt>
            <dd>{profil.prenom}</dd>
            <dt className="text-muted-foreground">Nom</dt>
            <dd>{profil.nom || '—'}</dd>
            <dt className="text-muted-foreground">Rôle</dt>
            <dd>{ROLES[profil.role]}</dd>
            {profil.dateCreation && (
              <>
                <dt className="text-muted-foreground">Membre depuis</dt>
                <dd className="chiffres">{formaterDate(profil.dateCreation)}</dd>
              </>
            )}
          </dl>
          <p className="mt-4 text-caption text-muted-foreground">
            Pour modifier vos informations, contactez le support IT au poste 4400.
          </p>
        </CorpsCarte>
        <div className="flex justify-end gap-2 border-t px-5 py-3">
          <Button variant="outline" asChild>
            <Link to="/change-password">
              <KeyRound aria-hidden="true" /> Changer mon mot de passe
            </Link>
          </Button>
          <Button variant="outline" onClick={seDeconnecter}>
            <LogOut aria-hidden="true" /> Déconnexion
          </Button>
        </div>
      </Carte>
    </>
  );
}
