/**
 * Hooks TanStack Query de la gestion des matériels (ADMIN).
 * Tier : présentation. Clés : ['admin', 'materiels', params], ['admin', 'materiels', id].
 * Toute écriture invalide aussi le catalogue collaborateur (['materiels']).
 */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';

/** @param {Record<string, unknown>} parametres */
export function useMaterielsAdmin(parametres) {
  return useQuery({
    queryKey: ['admin', 'materiels', parametres],
    queryFn: () => api.listerMaterielsAdmin(parametres),
    placeholderData: keepPreviousData,
  });
}

/** @param {string|undefined} id */
export function useMaterielAdmin(id) {
  return useQuery({
    queryKey: ['admin', 'materiels', id],
    queryFn: () => api.lireMaterielAdmin(id),
    enabled: Boolean(id),
  });
}

/** @param {(entree: any) => Promise<any>} action */
function useEcritureMateriel(action) {
  const clientRequetes = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: () => {
      clientRequetes.invalidateQueries({ queryKey: ['admin'] });
      clientRequetes.invalidateQueries({ queryKey: ['materiels'] });
      clientRequetes.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export const useCreerMateriel = () => useEcritureMateriel(api.creerMateriel);
export const useModifierMateriel = () => useEcritureMateriel(api.modifierMateriel);
export const useChangerStatutMateriel = () => useEcritureMateriel(api.changerStatutMateriel);
export const useTeleverserImage = () => useEcritureMateriel(api.televerserImage);
