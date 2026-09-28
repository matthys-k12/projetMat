/**
 * Hook TanStack Query du journal d'audit.
 * Tier : présentation. Clé : ['admin', 'audit', params].
 */
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listerAudit } from './api';

/** @param {Record<string, unknown>} parametres */
export function useAudit(parametres) {
  return useQuery({
    queryKey: ['admin', 'audit', parametres],
    queryFn: () => listerAudit(parametres),
    placeholderData: keepPreviousData,
  });
}
