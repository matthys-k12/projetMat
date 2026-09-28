/**
 * Hooks TanStack Query des notifications.
 * Tier : présentation. Clés : ['notifications', params], ['notifications', 'non-lues'].
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';

/** @param {{ page: number, unread?: boolean }} parametres */
export function useNotifications(parametres) {
  return useQuery({
    queryKey: ['notifications', parametres],
    queryFn: () => api.listerNotifications({ ...parametres, limit: 20 }),
  });
}

/** Compteur de non-lues, rafraîchi toutes les 30 s (sidebar et cloche). */
export function useNombreNonLues() {
  return useQuery({
    queryKey: ['notifications', 'non-lues'],
    queryFn: api.compterNonLues,
    refetchInterval: 30_000,
    select: (reponse) => reponse.nombre,
  });
}

export function useMarquerCommeLue() {
  const clientRequetes = useQueryClient();
  return useMutation({
    mutationFn: api.marquerCommeLue,
    onSuccess: () => clientRequetes.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarquerToutesCommeLues() {
  const clientRequetes = useQueryClient();
  return useMutation({
    mutationFn: api.marquerToutesCommeLues,
    onSuccess: () => clientRequetes.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
