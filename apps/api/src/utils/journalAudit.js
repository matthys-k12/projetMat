/**
 * Écriture d'une ligne dans le journal d'audit (public.audit_logs).
 *
 * Tier : métier → données.
 * Utilisé par : services matériels et catégories (les RPC des demandes
 * écrivent déjà leur propre audit, dans la même transaction).
 */
import { supabase } from '../config/supabase.js';

/**
 * Enregistre une action d'administration.
 *
 * Choix : un échec d'audit est journalisé mais ne fait pas échouer la
 * requête, car l'écriture principale a déjà réussi (supabase-js n'offre pas de
 * transaction multi-requêtes). Les opérations critiques (demandes) sont, elles,
 * auditées dans la transaction SQL des RPC.
 *
 * @param {string} acteurId id du profil qui agit
 * @param {string} action ex. MATERIAL_CREATED, STOCK_UPDATED
 * @param {string} typeEntite ex. material, category
 * @param {string|null} idEntite
 * @param {Record<string, unknown>} [metadonnees]
 * @returns {Promise<void>}
 */
export async function enregistrerAudit(acteurId, action, typeEntite, idEntite, metadonnees = {}) {
  const { error } = await supabase.from('audit_logs').insert({
    actor_id: acteurId,
    action,
    entity_type: typeEntite,
    entity_id: idEntite,
    metadata: metadonnees,
  });
  if (error) {
    console.error(`[audit] Échec de l'enregistrement de ${action} :`, error.message);
  }
}
