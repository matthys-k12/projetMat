/**
 * Service d'authentification : lecture du profil et déconnexion.
 *
 * Tier : métier → données (supabase-js service_role).
 */
import { supabase } from '../../config/supabase.js';
import { versProfilApi } from '../../utils/convertisseurs.js';
import { ErreurApi } from '../../utils/ErreurApi.js';

/**
 * Lit le profil complet d'un utilisateur.
 * @param {string} idUtilisateur
 * @returns {Promise<import('../../utils/convertisseurs.js').ProfilApi>}
 * @throws {ErreurApi} 404 si le profil n'existe pas
 */
export async function lireProfil(idUtilisateur) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, role, active, created_at')
    .eq('id', idUtilisateur)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw ErreurApi.introuvable('Profil introuvable.');

  return { ...versProfilApi(data), dateCreation: data.created_at };
}

/**
 * Révoque les jetons de rafraîchissement liés au token : même volé, il ne
 * pourra plus être prolongé. Un échec n'empêche pas la déconnexion côté front.
 * @param {string|null} token
 * @returns {Promise<void>}
 */
export async function revoquerSession(token) {
  if (!token) return;
  const { error } = await supabase.auth.admin.signOut(token);
  if (error) console.warn('[auth] Révocation de session impossible :', error.message);
}
