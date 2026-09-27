/**
 * Service des notifications du collaborateur connecté.
 *
 * Tier : métier → données.
 * Les notifications sont CRÉÉES par les RPC (approbation, refus, remise), dans la
 * même transaction que le changement de statut. Ce service ne fait que les lire
 * et les marquer comme lues. Chaque requête est filtrée sur l'utilisateur du token.
 */
import { supabase } from '../../config/supabase.js';
import { versNotificationApi } from '../../utils/convertisseurs.js';
import { ErreurApi } from '../../utils/ErreurApi.js';
import { calculerIntervalle, construireListePaginee } from '../../utils/pagination.js';

const COLONNES = 'id, title, message, type, request_id, read_at, created_at';

/**
 * Liste paginée, la plus récente en premier.
 * @param {string} utilisateurId
 * @param {{ page: number, limit: number, unread?: boolean }} filtres
 */
export async function listerNotifications(utilisateurId, filtres) {
  let requete = supabase
    .from('notifications')
    .select(COLONNES, { count: 'exact' })
    .eq('user_id', utilisateurId);
  if (filtres.unread) requete = requete.is('read_at', null);

  const { debut, fin } = calculerIntervalle(filtres.page, filtres.limit);
  const { data, error, count } = await requete
    .order('created_at', { ascending: false })
    .range(debut, fin);
  if (error) throw error;

  return construireListePaginee(
    data.map(versNotificationApi),
    count ?? 0,
    filtres.page,
    filtres.limit,
  );
}

/**
 * Nombre de notifications non lues (compteur de la sidebar, rafraîchi toutes les 30 s).
 * @param {string} utilisateurId
 * @returns {Promise<{ nombre: number }>}
 */
export async function compterNonLues(utilisateurId) {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', utilisateurId)
    .is('read_at', null);
  if (error) throw error;
  return { nombre: count ?? 0 };
}

/**
 * Marque une notification comme lue. Le filtre user_id empêche de toucher
 * à la notification d'un autre (on répond alors 404).
 * @param {string} utilisateurId
 * @param {string} id
 * @throws {ErreurApi} 404
 */
export async function marquerCommeLue(utilisateurId, id) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', utilisateurId)
    .select(COLONNES)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw ErreurApi.introuvable('Notification introuvable.');
  return versNotificationApi(data);
}

/**
 * Marque toutes les notifications non lues comme lues.
 * @param {string} utilisateurId
 * @returns {Promise<{ nombre: number }>} nombre de notifications mises à jour
 */
export async function marquerToutesCommeLues(utilisateurId) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', utilisateurId)
    .is('read_at', null)
    .select('id');
  if (error) throw error;
  return { nombre: data.length };
}
