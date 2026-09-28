/**
 * Service de gestion des comptes (ADMIN) : liste, création, activation, rôle,
 * réinitialisation du mot de passe.
 *
 * Tier : métier → données (Supabase Auth admin + table profiles).
 *
 * Principe : pas d'inscription libre, l'organisation attribue les accès.
 * L'admin crée le compte avec un mot de passe temporaire aléatoire, affiché une
 * seule fois ; l'utilisateur doit le remplacer à sa première connexion. L'admin
 * ne connaît donc jamais le mot de passe définitif : une action tracée dans
 * l'audit est bien attribuable à la personne titulaire du compte.
 */
import { supabase } from '../../config/supabase.js';
import { versProfilApi } from '../../utils/convertisseurs.js';
import { enregistrerAudit } from '../../utils/journalAudit.js';
import { ErreurApi } from '../../utils/ErreurApi.js';
import { genererMotDePasseTemporaire } from '../../utils/motDePasse.js';
import { calculerIntervalle, construireListePaginee } from '../../utils/pagination.js';
import { nettoyerRecherche } from '../../utils/schemasCommuns.js';

const COLONNES = 'id, email, first_name, last_name, role, active, must_change_password, created_at';

/** Durée de bannissement Supabase équivalant à « désactivé » (100 ans). */
const BANNISSEMENT_PERMANENT = '876000h';

/**
 * @param {any} ligne ligne de profiles
 */
function versUtilisateurApi(ligne) {
  return { ...versProfilApi(ligne), dateCreation: ligne.created_at };
}

/**
 * Lit un profil ou lève 404.
 * @param {string} id
 */
async function lireProfilOu404(id) {
  const { data, error } = await supabase
    .from('profiles')
    .select(COLONNES)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw ErreurApi.introuvable('Utilisateur introuvable.');
  return data;
}

/**
 * Liste paginée des comptes.
 * @param {{ page: number, limit: number, search?: string, role?: 'USER'|'ADMIN', active?: boolean }} filtres
 */
export async function listerUtilisateurs(filtres) {
  let requete = supabase.from('profiles').select(COLONNES, { count: 'exact' });
  if (filtres.search) {
    const texte = nettoyerRecherche(filtres.search);
    requete = requete.or(
      `first_name.ilike.%${texte}%,last_name.ilike.%${texte}%,email.ilike.%${texte}%`,
    );
  }
  if (filtres.role) requete = requete.eq('role', filtres.role);
  if (filtres.active !== undefined) requete = requete.eq('active', filtres.active);

  const { debut, fin } = calculerIntervalle(filtres.page, filtres.limit);
  const { data, error, count } = await requete
    .order('last_name')
    .order('first_name')
    .range(debut, fin);
  if (error) throw error;

  return construireListePaginee(
    data.map(versUtilisateurApi),
    count ?? 0,
    filtres.page,
    filtres.limit,
  );
}

/**
 * Crée un compte avec un mot de passe temporaire.
 *
 * Étapes : création dans Supabase Auth (e-mail confirmé d'office), puis le
 * trigger on_auth_user_created crée le profil (rôle USER) ; on fixe ensuite le
 * rôle et l'obligation de changer le mot de passe. Si cette seconde étape
 * échoue, on supprime le compte Auth pour ne pas laisser de compte à moitié créé.
 *
 * @param {string} acteurId admin qui crée le compte
 * @param {{ prenom: string, nom: string, email: string, role: 'USER'|'ADMIN' }} corps
 * @returns {Promise<{ utilisateur: object, motDePasseTemporaire: string }>}
 *   Le mot de passe temporaire n'est renvoyé qu'ici, une seule fois ; il n'est stocké nulle part en clair.
 * @throws {ErreurApi} 409 si l'e-mail est déjà utilisé
 */
export async function creerUtilisateur(acteurId, corps) {
  const motDePasseTemporaire = genererMotDePasseTemporaire();

  const { data, error } = await supabase.auth.admin.createUser({
    email: corps.email,
    password: motDePasseTemporaire,
    email_confirm: true,
    user_metadata: { first_name: corps.prenom, last_name: corps.nom },
  });
  if (error) {
    const dejaUtilise = error.status === 422 || /already/i.test(error.message);
    if (dejaUtilise) {
      throw new ErreurApi(
        409,
        'EMAIL_ALREADY_USED',
        'Un compte existe déjà avec cette adresse e-mail.',
      );
    }
    throw new ErreurApi(502, 'AUTH_ERROR', "Le compte n'a pas pu être créé.");
  }

  const id = data.user.id;
  const { data: profil, error: erreurProfil } = await supabase
    .from('profiles')
    .update({
      role: corps.role,
      must_change_password: true,
      first_name: corps.prenom,
      last_name: corps.nom,
    })
    .eq('id', id)
    .select(COLONNES)
    .single();
  if (erreurProfil) {
    await supabase.auth.admin.deleteUser(id);
    throw erreurProfil;
  }

  // Jamais de mot de passe dans l'audit ni dans les logs
  await enregistrerAudit(acteurId, 'USER_CREATED', 'user', id, {
    email: corps.email,
    nom: `${corps.prenom} ${corps.nom}`,
    role: corps.role,
  });
  return { utilisateur: versUtilisateurApi(profil), motDePasseTemporaire };
}

/**
 * Active ou désactive un compte. Deux niveaux :
 * - profiles.active : l'API refuse toute requête d'un compte inactif ;
 * - bannissement Supabase Auth : le compte ne peut même plus obtenir de token.
 * @param {string} acteurId
 * @param {string} id
 * @param {boolean} actif
 * @throws {ErreurApi} 409 si l'admin tente de se désactiver lui-même
 */
export async function changerStatutUtilisateur(acteurId, id, actif) {
  if (id === acteurId && !actif) {
    // Évite qu'un admin bloque l'organisation (dernier admin qui se désactive)
    throw new ErreurApi(409, 'SELF_LOCKOUT', 'Vous ne pouvez pas désactiver votre propre compte.');
  }
  const avant = await lireProfilOu404(id);

  const { error: erreurAuth } = await supabase.auth.admin.updateUserById(id, {
    ban_duration: actif ? 'none' : BANNISSEMENT_PERMANENT,
  });
  if (erreurAuth)
    throw new ErreurApi(502, 'AUTH_ERROR', "Le statut du compte n'a pas pu être modifié.");

  const { data, error } = await supabase
    .from('profiles')
    .update({ active: actif })
    .eq('id', id)
    .select(COLONNES)
    .single();
  if (error) throw error;

  await enregistrerAudit(acteurId, 'USER_STATUS_CHANGED', 'user', id, {
    email: avant.email,
    actif,
  });
  return versUtilisateurApi(data);
}

/**
 * Change le rôle d'un compte.
 * @param {string} acteurId
 * @param {string} id
 * @param {'USER'|'ADMIN'} role
 * @throws {ErreurApi} 409 si l'admin tente de se retirer son propre rôle ADMIN
 */
export async function changerRoleUtilisateur(acteurId, id, role) {
  if (id === acteurId && role !== 'ADMIN') {
    throw new ErreurApi(
      409,
      'SELF_LOCKOUT',
      'Vous ne pouvez pas retirer votre propre rôle administrateur.',
    );
  }
  const avant = await lireProfilOu404(id);

  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id)
    .select(COLONNES)
    .single();
  if (error) throw error;

  await enregistrerAudit(acteurId, 'USER_ROLE_CHANGED', 'user', id, {
    email: avant.email,
    avant: avant.role,
    apres: role,
  });
  return versUtilisateurApi(data);
}

/**
 * Réinitialisation par l'admin (mot de passe oublié, sans e-mail) : même mécanisme
 * que la création. Nouveau mot de passe temporaire affiché une seule fois, et
 * obligation de le remplacer à la prochaine connexion. Les sessions déjà ouvertes
 * du compte sont bloquées par l'API (403 PASSWORD_CHANGE_REQUIRED) jusqu'au changement.
 * @param {string} acteurId
 * @param {string} id
 * @returns {Promise<{ utilisateur: object, motDePasseTemporaire: string }>}
 * @throws {ErreurApi} 409 sur son propre compte ou sur un compte désactivé
 */
export async function reinitialiserMotDePasse(acteurId, id) {
  if (id === acteurId) {
    throw new ErreurApi(
      409,
      'SELF_PASSWORD_RESET',
      'Pour votre propre compte, utilisez « Changer mon mot de passe » dans votre profil.',
    );
  }
  const avant = await lireProfilOu404(id);
  if (!avant.active) {
    throw new ErreurApi(409, 'USER_INACTIVE', "Réactivez d'abord ce compte.");
  }

  const motDePasseTemporaire = genererMotDePasseTemporaire();
  const { error: erreurAuth } = await supabase.auth.admin.updateUserById(id, {
    password: motDePasseTemporaire,
  });
  if (erreurAuth) {
    throw new ErreurApi(502, 'AUTH_ERROR', "Le mot de passe n'a pas pu être réinitialisé.");
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ must_change_password: true })
    .eq('id', id)
    .select(COLONNES)
    .single();
  if (error) throw error;

  // Jamais de mot de passe dans l'audit ni dans les logs
  await enregistrerAudit(acteurId, 'USER_PASSWORD_RESET', 'user', id, { email: avant.email });
  return { utilisateur: versUtilisateurApi(data), motDePasseTemporaire };
}
