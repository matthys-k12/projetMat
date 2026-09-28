/**
 * Service d'authentification : profil, déconnexion, changement de mot de passe.
 *
 * Tier : métier → données (supabase-js service_role).
 */
import { createClient } from '@supabase/supabase-js';
import { env } from '../../config/env.js';
import { supabase } from '../../config/supabase.js';
import { versProfilApi } from '../../utils/convertisseurs.js';
import { enregistrerAudit } from '../../utils/journalAudit.js';
import { ErreurApi } from '../../utils/ErreurApi.js';

/**
 * Lit le profil complet d'un utilisateur.
 * @param {string} idUtilisateur
 * @returns {Promise<import('../../utils/convertisseurs.js').ProfilApi & { dateCreation: string }>}
 * @throws {ErreurApi} 404 si le profil n'existe pas
 */
export async function lireProfil(idUtilisateur) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, role, active, must_change_password, created_at')
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

/**
 * Indique si le mot de passe proposé est déjà le mot de passe actuel.
 *
 * Le mot de passe temporaire n'est stocké nulle part en clair : pour vérifier
 * que l'utilisateur ne le réutilise pas, on tente une connexion avec le nouveau
 * mot de passe. Un client jetable (sans session persistée) est utilisé pour ne
 * pas toucher au client partagé du serveur.
 * @param {string} email
 * @param {string} motDePasse
 * @returns {Promise<boolean>}
 */
async function estLeMotDePasseActuel(email, motDePasse) {
  const clientJetable = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data } = await clientJetable.auth.signInWithPassword({ email, password: motDePasse });
  if (data?.session) {
    await clientJetable.auth.admin.signOut(data.session.access_token);
    return true;
  }
  return false;
}

/**
 * Remplace le mot de passe de l'utilisateur connecté et lève l'obligation de changement.
 * Le mot de passe n'apparaît ni dans les logs ni dans l'audit.
 * @param {{ id: string, email: string }} utilisateur utilisateur du token
 * @param {string} nouveauMotDePasse déjà validé (10 caractères, majuscule, chiffre)
 * @throws {ErreurApi} 422 si identique au mot de passe actuel ou refusé par Supabase
 */
export async function changerMotDePasse(utilisateur, nouveauMotDePasse) {
  if (await estLeMotDePasseActuel(utilisateur.email, nouveauMotDePasse)) {
    throw new ErreurApi(
      422,
      'SAME_PASSWORD',
      'Le nouveau mot de passe doit être différent du mot de passe actuel.',
    );
  }

  const { error } = await supabase.auth.admin.updateUserById(utilisateur.id, {
    password: nouveauMotDePasse,
  });
  if (error) {
    throw new ErreurApi(
      422,
      'WEAK_PASSWORD',
      'Ce mot de passe a été refusé. Choisissez-en un autre.',
    );
  }

  const { error: erreurProfil } = await supabase
    .from('profiles')
    .update({ must_change_password: false })
    .eq('id', utilisateur.id);
  if (erreurProfil) throw erreurProfil;

  await enregistrerAudit(utilisateur.id, 'PASSWORD_CHANGED', 'user', utilisateur.id, {});
  return lireProfil(utilisateur.id);
}
