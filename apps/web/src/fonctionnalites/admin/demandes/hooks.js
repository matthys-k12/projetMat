/**
 * Hooks TanStack Query de la gestion des demandes (ADMIN).
 *
 * Tier : présentation. Clés : ['admin', 'demandes', params], ['admin', 'demandes', id].
 * Après une décision : on met à jour le détail, puis on invalide les listes, les
 * tableaux de bord et le catalogue (une approbation décrémente le stock).
 */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';

/** @param {Record<string, unknown>} parametres */
export function useDemandesAdmin(parametres) {
  return useQuery({
    queryKey: ['admin', 'demandes', parametres],
    queryFn: () => api.listerDemandesAdmin(parametres),
    placeholderData: keepPreviousData,
  });
}

/** @param {string} id */
export function useDemandeAdmin(id) {
  return useQuery({ queryKey: ['admin', 'demandes', id], queryFn: () => api.lireDemandeAdmin(id) });
}

/**
 * Fabrique une mutation de décision (approuver, refuser, remettre) avec la même invalidation.
 * @param {(entree: any) => Promise<any>} action
 */
function useDecision(action) {
  const clientRequetes = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: (demande) => {
      clientRequetes.setQueryData(['admin', 'demandes', demande.id], demande);
      clientRequetes.invalidateQueries({ queryKey: ['admin'] });
      clientRequetes.invalidateQueries({ queryKey: ['materiels'] });
      clientRequetes.invalidateQueries({ queryKey: ['demandes'] });
    },
    // En cas d'échec (stock insuffisant, déjà traitée…), on relit la demande : son état a pu changer
    onError: (_erreur, entree) => {
      clientRequetes.invalidateQueries({ queryKey: ['admin', 'demandes', entree.id] });
    },
  });
}

export function useApprouverDemande() {
  return useDecision(api.approuverDemande);
}

export function useRefuserDemande() {
  return useDecision(api.refuserDemande);
}

export function useRemettreDemande() {
  return useDecision(api.remettreDemande);
}
