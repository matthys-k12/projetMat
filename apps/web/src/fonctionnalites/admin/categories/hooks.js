/**
 * Hooks TanStack Query des catégories (ADMIN).
 * Tier : présentation. Clé : ['admin', 'categories'] ; les écritures invalident aussi
 * ['categories'] (filtres du catalogue) et ['materiels'] (visibilité).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';

export function useCategoriesAdmin() {
  return useQuery({ queryKey: ['admin', 'categories'], queryFn: api.listerCategoriesAdmin });
}

/** @param {(entree: any) => Promise<any>} action */
function useEcritureCategorie(action) {
  const clientRequetes = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: () => {
      clientRequetes.invalidateQueries({ queryKey: ['admin'] });
      clientRequetes.invalidateQueries({ queryKey: ['categories'] });
      clientRequetes.invalidateQueries({ queryKey: ['materiels'] });
    },
  });
}

export const useCreerCategorie = () => useEcritureCategorie(api.creerCategorie);
export const useModifierCategorie = () => useEcritureCategorie(api.modifierCategorie);
export const useChangerStatutCategorie = () => useEcritureCategorie(api.changerStatutCategorie);
