/**
 * Conversion des lignes SQL (snake_case anglais) en objets API (camelCase français).
 *
 * Tier : métier (frontière avec le tier données).
 * Utilisé par : tous les services.
 *
 * Pourquoi une couche de conversion : le schéma SQL est un contrat figé en
 * anglais ; le JSON exposé au front est en français. Centraliser la conversion
 * ici évite que les noms de colonnes « fuient » dans le front et permet de
 * changer le schéma sans casser le contrat HTTP.
 */
import { env } from '../config/env.js';

/**
 * @typedef {'disponible'|'stock_faible'|'indisponible'} Disponibilite
 */

/**
 * Déduit la disponibilité affichée à partir du stock.
 * @param {{ available_quantity: number, is_low_stock: boolean }} ligne
 * @returns {Disponibilite}
 */
export function calculerDisponibilite(ligne) {
  if (ligne.available_quantity <= 0) return 'indisponible';
  if (ligne.is_low_stock) return 'stock_faible';
  return 'disponible';
}

/**
 * URL publique d'une image du bucket « materials » (bucket public en lecture).
 * @param {string|null} cheminImage
 * @returns {string|null}
 */
export function construireUrlImage(cheminImage) {
  if (!cheminImage) return null;
  return `${env.SUPABASE_URL}/storage/v1/object/public/materials/${cheminImage}`;
}

/**
 * @typedef {Object} ProfilApi
 * @property {string} id
 * @property {string} email
 * @property {string} prenom
 * @property {string} nom
 * @property {string} nomComplet
 * @property {'USER'|'ADMIN'} role
 * @property {boolean} actif
 * @property {boolean} doitChangerMotDePasse vrai tant que le mot de passe temporaire n'est pas remplacé
 */

/**
 * @param {any} ligne ligne de public.profiles
 * @returns {ProfilApi|null}
 */
export function versProfilApi(ligne) {
  if (!ligne) return null;
  return {
    id: ligne.id,
    email: ligne.email,
    prenom: ligne.first_name,
    nom: ligne.last_name,
    nomComplet: `${ligne.first_name} ${ligne.last_name}`.trim(),
    role: ligne.role,
    actif: ligne.active,
    doitChangerMotDePasse: ligne.must_change_password ?? false,
  };
}

/**
 * @typedef {Object} CategorieApi
 * @property {string} id
 * @property {string} nom
 * @property {string|null} description
 * @property {boolean} actif
 * @property {number} [nombreMateriels]
 * @property {string} dateCreation
 */

/**
 * @param {any} ligne ligne de public.categories (éventuellement avec materials(count))
 * @returns {CategorieApi}
 */
export function versCategorieApi(ligne) {
  const categorie = {
    id: ligne.id,
    nom: ligne.name,
    description: ligne.description,
    actif: ligne.active,
    dateCreation: ligne.created_at,
  };
  if (Array.isArray(ligne.materials)) {
    categorie.nombreMateriels = ligne.materials[0]?.count ?? 0;
  }
  return categorie;
}

/**
 * @typedef {Object} MaterielApi
 * @property {string} id
 * @property {string} nom
 * @property {string|null} description
 * @property {{ id: string, nom: string }|null} categorie
 * @property {string|null} imageUrl
 * @property {number} quantiteTotale
 * @property {number} quantiteDisponible
 * @property {number} stockMinimum
 * @property {boolean} stockFaible
 * @property {Disponibilite} disponibilite
 * @property {boolean} actif
 * @property {string} dateCreation
 * @property {string} dateMiseAJour
 */

/**
 * @param {any} ligne ligne de public.materials avec la jointure categories(id, name)
 * @returns {MaterielApi}
 */
export function versMaterielApi(ligne) {
  return {
    id: ligne.id,
    nom: ligne.name,
    description: ligne.description,
    categorie: ligne.categories ? { id: ligne.categories.id, nom: ligne.categories.name } : null,
    imageUrl: construireUrlImage(ligne.image_path),
    quantiteTotale: ligne.total_quantity,
    quantiteDisponible: ligne.available_quantity,
    stockMinimum: ligne.minimum_stock,
    stockFaible: ligne.is_low_stock,
    disponibilite: calculerDisponibilite(ligne),
    actif: ligne.active,
    dateCreation: ligne.created_at,
    dateMiseAJour: ligne.updated_at,
  };
}

/**
 * @typedef {Object} DemandeResumeApi
 * @property {string} id
 * @property {string} reference
 * @property {string} statut PENDING | APPROVED | REJECTED | CANCELLED | FULFILLED
 * @property {string} motif
 * @property {string|null} commentaireAdmin
 * @property {number} nombreArticles nombre de lignes (matériels différents)
 * @property {ProfilApi|null} [demandeur]
 * @property {string} dateCreation
 * @property {string} dateMiseAJour
 */

/**
 * Demande telle qu'affichée dans une liste.
 * @param {any} ligne ligne de public.requests avec request_items(count) et éventuellement profiles
 * @returns {DemandeResumeApi}
 */
export function versDemandeResumeApi(ligne) {
  const demande = {
    id: ligne.id,
    reference: ligne.reference,
    statut: ligne.status,
    motif: ligne.reason,
    commentaireAdmin: ligne.admin_comment,
    nombreArticles: ligne.request_items?.[0]?.count ?? 0,
    dateCreation: ligne.created_at,
    dateMiseAJour: ligne.updated_at,
  };
  if (ligne.profiles) {
    demande.demandeur = versProfilApi(ligne.profiles);
  }
  return demande;
}

/**
 * @typedef {Object} ArticleApi
 * @property {string} id
 * @property {number} quantite
 * @property {{ id: string, nom: string, categorie: string|null, imageUrl: string|null, quantiteDisponible?: number, actif?: boolean }} materiel
 */

/**
 * @param {any} ligne ligne de request_items avec materials(…, categories(name))
 * @param {boolean} inclureStock true pour l'admin : ajoute le stock actuel du matériel
 * @returns {ArticleApi}
 */
export function versArticleApi(ligne, inclureStock) {
  const m = ligne.materials;
  const materiel = {
    id: m.id,
    nom: m.name,
    categorie: m.categories?.name ?? null,
    imageUrl: construireUrlImage(m.image_path),
  };
  if (inclureStock) {
    materiel.quantiteDisponible = m.available_quantity;
    materiel.actif = m.active;
  }
  return { id: ligne.id, quantite: ligne.quantity, materiel };
}

/**
 * @typedef {Object} EvenementHistoriqueApi
 * @property {string} id
 * @property {string|null} ancienStatut
 * @property {string} nouveauStatut
 * @property {string|null} commentaire
 * @property {{ id: string, nomComplet: string, role: string }|null} auteur
 * @property {string} date
 */

/**
 * @param {any} ligne ligne de request_status_history avec profiles(auteur)
 * @returns {EvenementHistoriqueApi}
 */
export function versEvenementHistoriqueApi(ligne) {
  const auteur = versProfilApi(ligne.profiles);
  return {
    id: ligne.id,
    ancienStatut: ligne.previous_status,
    nouveauStatut: ligne.new_status,
    commentaire: ligne.comment,
    auteur: auteur ? { id: auteur.id, nomComplet: auteur.nomComplet, role: auteur.role } : null,
    date: ligne.created_at,
  };
}

/**
 * @param {any} ligne ligne de public.notifications
 */
export function versNotificationApi(ligne) {
  return {
    id: ligne.id,
    titre: ligne.title,
    message: ligne.message,
    type: ligne.type,
    demandeId: ligne.request_id,
    lue: ligne.read_at !== null,
    dateLecture: ligne.read_at,
    dateCreation: ligne.created_at,
  };
}

/**
 * @param {any} ligne ligne de public.audit_logs avec profiles(acteur)
 */
export function versAuditApi(ligne) {
  const acteur = versProfilApi(ligne.profiles);
  return {
    id: ligne.id,
    action: ligne.action,
    typeEntite: ligne.entity_type,
    idEntite: ligne.entity_id,
    metadonnees: ligne.metadata,
    acteur: acteur ? { id: acteur.id, nomComplet: acteur.nomComplet, email: acteur.email } : null,
    date: ligne.created_at,
  };
}

/**
 * @typedef {Object} StatsUtilisateurApi
 * @property {number} total
 * @property {number} enAttente   PENDING
 * @property {number} approuvees  APPROVED (pas encore remises)
 * @property {number} remises     FULFILLED
 * @property {number} refusees    REJECTED
 * @property {number} annulees    CANCELLED
 */

/**
 * Statistiques du collaborateur.
 * @param {number} total
 * @param {Record<string, number>} parStatut ex. { PENDING: 1, FULFILLED: 2 }
 * @returns {StatsUtilisateurApi}
 */
export function versStatsUtilisateurApi(total, parStatut) {
  return {
    total,
    enAttente: parStatut.PENDING ?? 0,
    approuvees: parStatut.APPROVED ?? 0,
    remises: parStatut.FULFILLED ?? 0,
    refusees: parStatut.REJECTED ?? 0,
    annulees: parStatut.CANCELLED ?? 0,
  };
}

/**
 * Statistiques globales (RPC admin_dashboard_stats / get_admin_dashboard_stats).
 * Les compteurs par statut viennent de « byStatus », commun aux deux versions
 * de la fonction ; les autres champs acceptent les deux noms possibles.
 * @param {any} stats jsonb renvoyé par la RPC
 */
export function versStatsAdminApi(stats) {
  const parStatut = stats.byStatus ?? {};
  return {
    enAttente: parStatut.PENDING ?? 0,
    aujourdhui: stats.today ?? 0,
    approuvees: parStatut.APPROVED ?? 0,
    remises: parStatut.FULFILLED ?? 0,
    refusees: parStatut.REJECTED ?? 0,
    annulees: parStatut.CANCELLED ?? 0,
    materielsActifs: stats.activeMaterials ?? 0,
    materielsStockFaible: stats.lowStockMaterials ?? stats.lowStock ?? 0,
    parStatut,
    quatorzeDerniersJours: (stats.last14Days ?? []).map((jour) => ({
      date: jour.date,
      nombre: jour.count,
    })),
    topMateriels: (stats.topMaterials ?? []).map((m) => ({
      id: m.id,
      nom: m.name,
      totalDemande: m.totalRequested ?? m.total ?? 0,
    })),
  };
}
