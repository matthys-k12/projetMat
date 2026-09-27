/**
 * Service du journal d'audit (lecture seule, admin).
 *
 * Tier : métier → données.
 * Le journal est alimenté par les RPC (demandes) et par utils/journalAudit.js
 * (matériels, catégories). Il n'est jamais modifié par l'API.
 */
import { supabase } from '../../config/supabase.js';
import { versAuditApi } from '../../utils/convertisseurs.js';
import { calculerIntervalle, construireListePaginee } from '../../utils/pagination.js';

const ACTEUR =
  'profiles:profiles!audit_logs_actor_id_fkey(id, email, first_name, last_name, role, active)';

/**
 * Liste paginée du journal, la plus récente en premier.
 * @param {{ page: number, limit: number, action?: string, entityType?: string }} filtres
 */
export async function listerAudit(filtres) {
  let requete = supabase
    .from('audit_logs')
    .select(`id, action, entity_type, entity_id, metadata, created_at, ${ACTEUR}`, {
      count: 'exact',
    });
  if (filtres.action) requete = requete.eq('action', filtres.action);
  if (filtres.entityType) requete = requete.eq('entity_type', filtres.entityType);

  const { debut, fin } = calculerIntervalle(filtres.page, filtres.limit);
  const { data, error, count } = await requete
    .order('created_at', { ascending: false })
    .range(debut, fin);
  if (error) throw error;

  return construireListePaginee(data.map(versAuditApi), count ?? 0, filtres.page, filtres.limit);
}
