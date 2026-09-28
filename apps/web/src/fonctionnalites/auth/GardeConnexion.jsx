/**
 * Garde de route : exige un utilisateur connecté, sinon redirige vers /login.
 * Si le mot de passe temporaire n'a pas été remplacé, force la page /change-password.
 * Tier : présentation. Confort de navigation : l'API refuse de toute façon
 * (401 sans token, 403 PASSWORD_CHANGE_REQUIRED tant que le mot de passe n'est pas changé).
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from './useAuth';

export function GardeConnexion() {
  const { etat, profil } = useAuth();
  const emplacement = useLocation();

  if (etat === 'chargement') {
    return (
      <div className="grid min-h-screen place-items-center" aria-busy="true">
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Chargement" />
      </div>
    );
  }
  if (etat === 'deconnecte') {
    // On mémorise la page demandée pour y revenir après la connexion
    return <Navigate to="/login" replace state={{ depuis: emplacement.pathname }} />;
  }
  if (profil?.doitChangerMotDePasse && emplacement.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }
  return <Outlet />;
}
