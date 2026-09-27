/**
 * Service des demandes : création, consultation, annulation (collaborateur)
 * et approbation, refus, remise (administrateur).
 *
 * Tier : métier → données.
 * Utilisé par : demandes.controleur.js.
 *
 * Règle fondamentale : toutes les ÉCRITURES passent par les fonctions RPC
 * PostgreSQL (create_request, approve_request…). Chacune s'exécute dans une
 * seule transaction : stock, statut, historique, notification et audit sont
 * validés ensemble ou annulés ensemble. supabase-js ne sait pas faire de
 * transaction multi-requêtes : on ne fait donc JAMAIS ces écritures ici « à la main ».
 */
import { supabase } from '../../config/supabase.js';
import {
  versArticleApi,
  versDemandeResumeApi,
  versEvenementHistoriqueApi,
  versProfilApi,
} from '../../utils/convertisseurs.js';
import { ErreurApi } from '../../utils/ErreurApi.js';
import { calculerIntervalle, construireListePaginee } from '../../utils/pagination.js';
import { nettoyerRecherche } from '../../utils/schemasCommuns.js';
import { verifierTransition } from './machineEtat.js';

const COLONNES_PROFIL = 'id, email, first_name, last_name, role, active';

// Indices de clé étrangère (!nom_fkey) : profiles est relié aux demandes par
// plusieurs chemins (demandeur, auteur d'historique, notifications) ; on indique
// explicitement lequel suivre pour lever l'ambiguïté côté PostgREST.
const DEMANDEUR = `profiles:profiles!requests_user_id_fkey(${COLONNES_PROFIL})`;
const DEMANDEUR_OBLIGATOIRE = `profiles:profiles!requests_user_id_fkey!inner(${COLONNES_PROFIL})`;

const COLONNES_LISTE =
  'id, reference, status, reason, admin_comment, created_at, updated_at, request_items(count)';

const COLONNES_DETAIL = `
  id, reference, user_id, status, reason, admin_comment, created_at, updated_at,
  ${DEMANDEUR},
  request_items(id, quantity, materials(id, name, image_path, available_quantity, active, categories(name))),
  request_status_history(id, previous_status, new_status, comment, created_at,
    profiles:profiles!request_status_history_changed_by_fkey(${COLONNES_PROFIL}))
`;

/**
 * Appelle une RPC et propage son erreur (traduite en HTTP par gestionErreurs.js).
 * @param {string} fonction
 * @param {Record<string, unknown>} parametres
 * @returns {Promise<unknown>}
 */
async function appelerRpc(fonction, parametres) {
  const { data, error } = await supabase.rpc(fonction, parametres);
  if (error) throw error;
  return data;
}

/**
 * Extrait l'identifiant renvoyé par create_request.
 * La migration déclare « returns uuid », mais la fonction déployée renvoie
 * { id, status, reference } : on accepte les deux formes.
 * @param {string|{ id: string }} retour
 * @returns {string}
 */
export function extraireIdDemande(retour) {
  if (retour && typeof retour === 'object') return retour.id;
  return retour;
}

/**
 * Lit le statut et le propriétaire d'une demande (pré-contrôle avant RPC).
 * @param {string} id
 * @returns {Promise<{ id: string, user_id: string, status: import('./machineEtat.js').StatutDemande }>}
 * @throws {ErreurApi} 404 REQUEST_NOT_FOUND
 */
async function lireEtatDemande(id) {
  const { data, error } = await supabase
    .from('requests')
    .select('id, user_id, status')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ErreurApi(404, 'REQUEST_NOT_FOUND', 'Demande introuvable.');
  return data;
}

// ---------------------------------------------------------------------------
// Lecture
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} FiltresDemandes
 * @property {number} page
 * @property {number} limit
 * @property {string[]} [status]
 * @property {string} [search]
 * @property {string} [from] AAAA-MM-JJ
 * @property {string} [to] AAAA-MM-JJ
 * @property {string} [userId]
 */

/**
 * Demandes du collaborateur connecté.
 * @param {string} utilisateurId toujours issu du token, jamais de la requête
 * @param {FiltresDemandes} filtres
 */
export async function listerMesDemandes(utilisateurId, filtres) {
  let requete = supabase
    .from('requests')
    .select(COLONNES_LISTE, { count: 'exact' })
    .eq('user_id', utilisateurId);

  if (filtres.status) requete = requete.in('status', filtres.status);
  if (filtres.search) {
    requete = requete.ilike('reference', `%${nettoyerRecherche(filtres.search)}%`);
  }

  const { debut, fin } = calculerIntervalle(filtres.page, filtres.limit);
  const { data, error, count } = await requete
    .order('created_at', { ascending: false })
    .range(debut, fin);
  if (error) throw error;

  return construireListePaginee(
    data.map(versDemandeResumeApi),
    count ?? 0,
    filtres.page,
    filtres.limit,
  );
}

/**
 * Identifiants des profils dont le prénom, le nom ou l'e-mail contient le texte.
 * @param {string} texte déjà nettoyé
 * @returns {Promise<string[]>}
 */
async function chercherIdsDemandeurs(texte) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .or(`first_name.ilike.%${texte}%,last_name.ilike.%${texte}%,email.ilike.%${texte}%`)
    .limit(100);
  if (error) throw error;
  return data.map((profil) => profil.id);
}

/**
 * Toutes les demandes, pour l'administration.
 *
 * Recherche par référence OU par nom du demandeur : PostgREST ne sait pas
 * combiner dans un même « or » une colonne de requests et une colonne de la
 * table jointe. On cherche donc d'abord les demandeurs correspondants, puis on
 * filtre « référence contient X OU demandeur parmi ces profils ». La jointure
 * profiles!inner garantit que chaque ligne a bien son demandeur.
 *
 * @param {FiltresDemandes} filtres
 */
export async function listerDemandesAdmin(filtres) {
  let requete = supabase
    .from('requests')
    .select(`${COLONNES_LISTE}, ${DEMANDEUR_OBLIGATOIRE}`, { count: 'exact' });

  if (filtres.status) requete = requete.in('status', filtres.status);
  if (filtres.userId) requete = requete.eq('user_id', filtres.userId);
  if (filtres.from) requete = requete.gte('created_at', `${filtres.from}T00:00:00Z`);
  if (filtres.to) requete = requete.lte('created_at', `${filtres.to}T23:59:59Z`);

  if (filtres.search) {
    const texte = nettoyerRecherche(filtres.search);
    const ids = await chercherIdsDemandeurs(texte);
    const conditions = [`reference.ilike.%${texte}%`];
    if (ids.length > 0) conditions.push(`user_id.in.(${ids.join(',')})`);
    requete = requete.or(conditions.join(','));
  }

  const { debut, fin } = calculerIntervalle(filtres.page, filtres.limit);
  const { data, error, count } = await requete
    .order('created_at', { ascending: false })
    .range(debut, fin);
  if (error) throw error;

  return construireListePaginee(
    data.map(versDemandeResumeApi),
    count ?? 0,
    filtres.page,
    filtres.limit,
  );
}

/**
 * @typedef {Object} DemandeDetailApi
 * @property {string} id
 * @property {string} reference
 * @property {string} statut
 * @property {string} motif
 * @property {string|null} commentaireAdmin
 * @property {import('../../utils/convertisseurs.js').ProfilApi} demandeur
 * @property {import('../../utils/convertisseurs.js').ArticleApi[]} articles
 * @property {import('../../utils/convertisseurs.js').EvenementHistoriqueApi[]} historique
 * @property {number} [nombreDemandesDemandeur] admin uniquement
 * @property {string} dateCreation
 * @property {string} dateMiseAJour
 */

/**
 * Détail complet d'une demande : articles, commentaire admin, historique chronologique.
 *
 * Sécurité : un collaborateur qui demande la demande d'un autre reçoit 404 et
 * non 403, pour ne pas révéler qu'elle existe.
 *
 * @param {string} id
 * @param {{ id: string, role: string }} utilisateur utilisateur connecté
 * @param {boolean} vueAdmin true : ajoute le stock actuel de chaque matériel
 * @returns {Promise<DemandeDetailApi>}
 * @throws {ErreurApi} 404 REQUEST_NOT_FOUND
 */
export async function lireDemande(id, utilisateur, vueAdmin) {
  const { data, error } = await supabase
    .from('requests')
    .select(COLONNES_DETAIL)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;

  const autorise = data && (vueAdmin || data.user_id === utilisateur.id);
  if (!autorise) throw new ErreurApi(404, 'REQUEST_NOT_FOUND', 'Demande introuvable.');

  const historique = [...data.request_status_history]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map(versEvenementHistoriqueApi);

  const demande = {
    id: data.id,
    reference: data.reference,
    statut: data.status,
    motif: data.reason,
    commentaireAdmin: data.admin_comment,
    demandeur: versProfilApi(data.profiles),
    articles: data.request_items.map((ligne) => versArticleApi(ligne, vueAdmin)),
    historique,
    dateCreation: data.created_at,
    dateMiseAJour: data.updated_at,
  };

  if (vueAdmin) {
    const { count } = await supabase
      .from('requests')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', data.user_id);
    demande.nombreDemandesDemandeur = count ?? 0;
  }
  return demande;
}

// ---------------------------------------------------------------------------
// Écriture (toujours via RPC)
// ---------------------------------------------------------------------------

/**
 * Crée une demande via la RPC create_request.
 * @param {{ id: string, role: string }} utilisateur demandeur (issu du token)
 * @param {{ motif: string, articles: { materielId: string, quantite: number }[] }} corps
 * @returns {Promise<DemandeDetailApi>}
 * @throws 409 INSUFFICIENT_STOCK, 422 MATERIAL_UNAVAILABLE / DUPLICATE_MATERIAL…
 */
export async function creerDemande(utilisateur, corps) {
  const retour = await appelerRpc('create_request', {
    p_user_id: utilisateur.id,
    p_reason: corps.motif,
    p_items: corps.articles.map((a) => ({ material_id: a.materielId, quantity: a.quantite })),
  });
  return lireDemande(extraireIdDemande(retour), utilisateur, false);
}

/**
 * Annule une demande en attente (par son auteur uniquement).
 * @param {string} id
 * @param {{ id: string, role: string }} utilisateur
 * @throws {ErreurApi} 404 si la demande n'est pas à lui, 409 si elle n'est plus en attente
 */
export async function annulerDemande(id, utilisateur) {
  const etat = await lireEtatDemande(id);
  if (etat.user_id !== utilisateur.id) {
    throw new ErreurApi(404, 'REQUEST_NOT_FOUND', 'Demande introuvable.');
  }
  verifierTransition(etat.status, 'CANCELLED');

  await appelerRpc('cancel_request', { p_request_id: id, p_user_id: utilisateur.id });
  return lireDemande(id, utilisateur, false);
}

/**
 * Approuve une demande : décrémente le stock sous verrou (dans la RPC).
 * @param {string} id
 * @param {{ id: string, role: string }} admin
 * @param {string} [commentaire]
 * @throws 409 INVALID_TRANSITION ou INSUFFICIENT_STOCK
 */
export async function approuverDemande(id, admin, commentaire) {
  const etat = await lireEtatDemande(id);
  verifierTransition(etat.status, 'APPROVED');

  await appelerRpc('approve_request', {
    p_request_id: id,
    p_admin_id: admin.id,
    p_comment: commentaire || null,
  });
  return lireDemande(id, admin, true);
}

/**
 * Refuse une demande avec un motif obligatoire.
 * @param {string} id
 * @param {{ id: string, role: string }} admin
 * @param {string} commentaire
 * @throws 409 INVALID_TRANSITION, 422 INVALID_COMMENT
 */
export async function refuserDemande(id, admin, commentaire) {
  const etat = await lireEtatDemande(id);
  verifierTransition(etat.status, 'REJECTED');

  await appelerRpc('reject_request', {
    p_request_id: id,
    p_admin_id: admin.id,
    p_comment: commentaire,
  });
  return lireDemande(id, admin, true);
}

/**
 * Marque une demande approuvée comme remise au collaborateur.
 * @param {string} id
 * @param {{ id: string, role: string }} admin
 * @throws 409 INVALID_TRANSITION
 */
export async function remettreDemande(id, admin) {
  const etat = await lireEtatDemande(id);
  verifierTransition(etat.status, 'FULFILLED');

  await appelerRpc('fulfill_request', { p_request_id: id, p_admin_id: admin.id });
  return lireDemande(id, admin, true);
}
