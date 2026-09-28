/**
 * Hooks TanStack Query des demandes du collaborateur.
 *
 * Tier : présentation. Clés : ['demandes', 'miennes', params], ['demandes', id],
 * ['demandes', 'statistiques']. Après une mutation, on invalide tout ['demandes']
 * (listes, détail, compteurs) et le catalogue (le stock affiché a pu changer).
 */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';

/** @param {{ page: number, status?: string, search?: string }} parametres */
export function useMesDemandes(parametres) {
  return useQuery({
    queryKey: ['demandes', 'miennes', parametres],
    queryFn: () => api.listerMesDemandes({ ...parametres, limit: 10 }),
    placeholderData: keepPreviousData,
  });
}

/** @param {string} id */
export function useDemande(id) {
  return useQuery({ queryKey: ['demandes', id], queryFn: () => api.lireDemande(id) });
}

export function useMesStatistiques() {
  return useQuery({ queryKey: ['demandes', 'statistiques'], queryFn: api.lireMesStatistiques });
}

export function useCreerDemande() {
  const clientRequetes = useQueryClient();
  return useMutation({
    mutationFn: api.creerDemande,
    onSuccess: () => {
      clientRequetes.invalidateQueries({ queryKey: ['demandes'] });
      clientRequetes.invalidateQueries({ queryKey: ['materiels'] });
    },
  });
}

export function useAnnulerDemande() {
  const clientRequetes = useQueryClient();
  return useMutation({
    mutationFn: api.annulerDemande,
    onSuccess: (demande) => {
      clientRequetes.setQueryData(['demandes', demande.id], demande);
      clientRequetes.invalidateQueries({ queryKey: ['demandes'] });
    },
  });
}
