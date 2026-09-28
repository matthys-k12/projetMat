/**
 * Hook d'accès au contexte d'authentification.
 * Tier : présentation.
 */
import { useContext } from 'react';
import { ContexteAuth } from './ContexteAuth';

/**
 * @returns {import('./ContexteAuth').ValeurAuth}
 * @throws si utilisé hors de <FournisseurAuth>
 */
export function useAuth() {
  const valeur = useContext(ContexteAuth);
  if (!valeur) throw new Error('useAuth doit être utilisé dans <FournisseurAuth>.');
  return valeur;
}
