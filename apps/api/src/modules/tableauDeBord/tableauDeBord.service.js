/**
 * Service des tableaux de bord.
 *
 * Tier : métier → données.
 *
 * Écart constaté entre supabase/migrations et la base déployée : les fonctions
 * de statistiques y s'appellent user_dashboard_stats / admin_dashboard_stats
 * (et non get_*), et leur JSON diffère légèrement (pas de « fulfilled »,
 * « approved » inclut les remises). Pour ne dépendre d'aucune des deux variantes :
 * - les compteurs du collaborateur sont calculés ici par une requête simple ;
 * - pour l'admin, on appelle la RPC sous le nom disponible et on lit les
 *   compteurs dans « byStatus », présent dans les deux versions.
 */
import { supabase } from '../../config/supabase.js';
import { versStatsAdminApi, versStatsUtilisateurApi } from '../../utils/convertisseurs.js';

/** Noms possibles de la RPC admin : base déployée d'abord, puis migration du dépôt. */
const NOMS_RPC_ADMIN = ['admin_dashboard_stats', 'get_admin_dashboard_stats'];

/** Code PostgREST « fonction introuvable ». */
const FONCTION_INTROUVABLE = 'PGRST202';

/**
 * Compteurs de demandes du collaborateur, par statut.
 * Un collaborateur a peu de demandes : on lit uniquement leur statut et on compte en JS.
 * @param {string} utilisateurId
 */
export async function lireStatsUtilisateur(utilisateurId) {
  const { data, error } = await supabase
    .from('requests')
    .select('status')
    .eq('user_id', utilisateurId);
  if (error) throw error;

  /** @type {Record<string, number>} */
  const parStatut = {};
  for (const ligne of data) {
    parStatut[ligne.status] = (parStatut[ligne.status] ?? 0) + 1;
  }
  return versStatsUtilisateurApi(data.length, parStatut);
}

/**
 * Indicateurs globaux pour l'administration (agrégats calculés en SQL par la RPC).
 */
export async function lireStatsAdmin() {
  for (const nom of NOMS_RPC_ADMIN) {
    const { data, error } = await supabase.rpc(nom);
    if (!error) return versStatsAdminApi(data);
    if (error.code !== FONCTION_INTROUVABLE) throw error;
  }
  throw new Error('Aucune fonction de statistiques admin trouvée en base.');
}
