/**
 * Hooks TanStack Query du catalogue.
 * Tier : présentation. Clés : ['materiels', params], ['materiels', id], ['categories'].
 */
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import * as api from './api';

/** @param {Record<string, unknown>} parametres */
export function useMateriels(parametres) {
  return useQuery({
    queryKey: ['materiels', parametres],
    queryFn: () => api.listerMateriels(parametres),
    placeholderData: keepPreviousData,
  });
}

/** @param {string} id */
export function useMateriel(id) {
  return useQuery({ queryKey: ['materiels', id], queryFn: () => api.lireMateriel(id) });
}

/**
 * Tout le catalogue disponible pour le sélecteur de la nouvelle demande.
 * 50 = plafond de l'API ; suffisant pour un catalogue interne (à paginer au-delà).
 */
export function useCatalogueComplet() {
  return useQuery({
    queryKey: ['materiels', 'selecteur'],
    queryFn: () => api.listerMateriels({ limit: 50, sort: 'nom_asc' }),
    select: (reponse) => reponse.data,
  });
}

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: api.listerCategories, staleTime: 5 * 60_000 });
}
