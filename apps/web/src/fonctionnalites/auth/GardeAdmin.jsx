/**
 * Garde de route : réservé au rôle ADMIN.
 *
 * Tier : présentation. C'est du CONFORT VISUEL : la vraie sécurité est dans
 * l'API (exigerRole('ADMIN') sur tout /admin), qui répond 403 à un USER même
 * s'il modifie le code du navigateur.
 */
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './useAuth';

export function GardeAdmin() {
  const { estAdmin } = useAuth();
  if (!estAdmin) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
