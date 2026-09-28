/**
 * Hooks TanStack Query de la gestion des comptes (ADMIN).
 * Tier : présentation. Clé : ['admin', 'utilisateurs', params].
 */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';

/** @param {Record<string, unknown>} parametres */
export function useUtilisateurs(parametres) {
  return useQuery({
    queryKey: ['admin', 'utilisateurs', parametres],
    queryFn: () => api.listerUtilisateurs(parametres),
    placeholderData: keepPreviousData,
  });
}

/** @param {(entree: any) => Promise<any>} action */
function useEcritureUtilisateur(action) {
  const clientRequetes = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: () => clientRequetes.invalidateQueries({ queryKey: ['admin'] }),
  });
}

export const useCreerUtilisateur = () => useEcritureUtilisateur(api.creerUtilisateur);
export const useChangerStatutUtilisateur = () =>
  useEcritureUtilisateur(api.changerStatutUtilisateur);
export const useChangerRoleUtilisateur = () => useEcritureUtilisateur(api.changerRoleUtilisateur);
export const useReinitialiserMotDePasse = () => useEcritureUtilisateur(api.reinitialiserMotDePasse);
