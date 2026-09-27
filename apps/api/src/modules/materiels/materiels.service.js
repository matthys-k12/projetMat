/**
 * Service des matériels : catalogue (utilisateur) et gestion (admin).
 *
 * Tier : métier → données (supabase-js service_role).
 * Utilisé par : materiels.controleur.js.
 *
 * Règle du catalogue : un collaborateur ne voit que les matériels actifs
 * appartenant à une catégorie active. L'admin voit tout.
 */
import { supabase } from '../../config/supabase.js';
import { versMaterielApi } from '../../utils/convertisseurs.js';
import { enregistrerAudit } from '../../utils/journalAudit.js';
import { ErreurApi } from '../../utils/ErreurApi.js';
import { calculerIntervalle, construireListePaginee } from '../../utils/pagination.js';
import { nettoyerRecherche } from '../../utils/schemasCommuns.js';

const COLONNES_MATERIEL =
  'id, name, description, category_id, image_path, total_quantity, available_quantity, minimum_stock, is_low_stock, active, created_at, updated_at';

/** Colonne SQL et sens de tri pour chaque valeur de `sort`. */
const TRI_SQL = {
  nom_asc: { colonne: 'name', ascending: true },
  nom_desc: { colonne: 'name', ascending: false },
  stock_desc: { colonne: 'available_quantity', ascending: false },
  recent: { colonne: 'created_at', ascending: false },
};

/**
 * @typedef {Object} FiltresMateriels
 * @property {number} page
 * @property {number} limit
 * @property {string} [search]
 * @property {string} [category]
 * @property {'disponible'|'stock_faible'|'indisponible'} [availability]
 * @property {'nom_asc'|'nom_desc'|'stock_desc'|'recent'} sort
 */

/**
 * Applique le filtre de disponibilité (is_low_stock est une colonne générée, donc filtrable).
 * @param {any} requete requête supabase-js en cours de construction
 * @param {FiltresMateriels['availability']} disponibilite
 */
function filtrerDisponibilite(requete, disponibilite) {
  if (disponibilite === 'disponible') {
    return requete.gt('available_quantity', 0).eq('is_low_stock', false);
  }
  if (disponibilite === 'stock_faible') {
    return requete.gt('available_quantity', 0).eq('is_low_stock', true);
  }
  if (disponibilite === 'indisponible') {
    return requete.eq('available_quantity', 0);
  }
  return requete;
}

/**
 * Liste paginée des matériels.
 * @param {FiltresMateriels} filtres
 * @param {boolean} vueAdmin true : inclut les inactifs et les catégories inactives
 * @returns {Promise<import('../../utils/pagination.js').ListePaginee<import('../../utils/convertisseurs.js').MaterielApi>>}
 */
export async function listerMateriels(filtres, vueAdmin) {
  // !inner : la jointure devient obligatoire, ce qui permet de filtrer sur categories.active
  const jointure = vueAdmin ? 'categories(id, name, active)' : 'categories!inner(id, name, active)';
  let requete = supabase
    .from('materials')
    .select(`${COLONNES_MATERIEL}, ${jointure}`, { count: 'exact' });

  if (!vueAdmin) {
    requete = requete.eq('active', true).eq('categories.active', true);
  }
  if (filtres.search) {
    requete = requete.ilike('name', `%${nettoyerRecherche(filtres.search)}%`);
  }
  if (filtres.category) {
    requete = requete.eq('category_id', filtres.category);
  }
  requete = filtrerDisponibilite(requete, filtres.availability);

  const tri = TRI_SQL[filtres.sort];
  const { debut, fin } = calculerIntervalle(filtres.page, filtres.limit);
  const { data, error, count } = await requete
    .order(tri.colonne, { ascending: tri.ascending })
    .order('id')
    .range(debut, fin);
  if (error) throw error;

  return construireListePaginee(data.map(versMaterielApi), count ?? 0, filtres.page, filtres.limit);
}

/**
 * Détail d'un matériel.
 * @param {string} id
 * @param {boolean} vueAdmin false : un matériel inactif (ou de catégorie inactive) est introuvable
 * @returns {Promise<import('../../utils/convertisseurs.js').MaterielApi>}
 * @throws {ErreurApi} 404
 */
export async function lireMateriel(id, vueAdmin) {
  const { data, error } = await supabase
    .from('materials')
    .select(`${COLONNES_MATERIEL}, categories(id, name, active)`)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;

  const visible = data && (vueAdmin || (data.active && data.categories?.active));
  if (!visible) throw ErreurApi.introuvable('Matériel introuvable.');
  return versMaterielApi(data);
}

/**
 * Convertit le corps validé (français) en colonnes SQL.
 * @param {any} corps
 */
function versColonnes(corps) {
  return {
    name: corps.nom,
    description: corps.description,
    category_id: corps.categorieId,
    total_quantity: corps.quantiteTotale,
    available_quantity: corps.quantiteDisponible,
    minimum_stock: corps.stockMinimum,
    active: corps.actif,
  };
}

/**
 * Crée un matériel.
 * @param {string} acteurId
 * @param {any} corps corps validé par schemaCorpsMateriel
 * @throws 409/422 si la catégorie n'existe pas ou si une contrainte SQL est violée
 */
export async function creerMateriel(acteurId, corps) {
  const { data, error } = await supabase
    .from('materials')
    .insert(versColonnes(corps))
    .select(`${COLONNES_MATERIEL}, categories(id, name, active)`)
    .single();
  if (error) throw error;

  await enregistrerAudit(acteurId, 'MATERIAL_CREATED', 'material', data.id, {
    nom: data.name,
    quantiteTotale: data.total_quantity,
    quantiteDisponible: data.available_quantity,
  });
  return versMaterielApi(data);
}

/**
 * Modifie un matériel. Si les quantités changent, une ligne STOCK_UPDATED est
 * ajoutée au journal en plus de MATERIAL_UPDATED (traçabilité du stock).
 * @param {string} acteurId
 * @param {string} id
 * @param {any} corps corps validé par schemaCorpsMateriel
 * @throws {ErreurApi} 404
 */
export async function modifierMateriel(acteurId, id, corps) {
  const { data: avant, error: erreurLecture } = await supabase
    .from('materials')
    .select('total_quantity, available_quantity, minimum_stock')
    .eq('id', id)
    .maybeSingle();
  if (erreurLecture) throw erreurLecture;
  if (!avant) throw ErreurApi.introuvable('Matériel introuvable.');

  const { data, error } = await supabase
    .from('materials')
    .update(versColonnes(corps))
    .eq('id', id)
    .select(`${COLONNES_MATERIEL}, categories(id, name, active)`)
    .single();
  if (error) throw error;

  await enregistrerAudit(acteurId, 'MATERIAL_UPDATED', 'material', id, { nom: data.name });

  const stockModifie =
    avant.total_quantity !== data.total_quantity ||
    avant.available_quantity !== data.available_quantity ||
    avant.minimum_stock !== data.minimum_stock;
  if (stockModifie) {
    await enregistrerAudit(acteurId, 'STOCK_UPDATED', 'material', id, {
      nom: data.name,
      avant: {
        total: avant.total_quantity,
        disponible: avant.available_quantity,
        seuil: avant.minimum_stock,
      },
      apres: {
        total: data.total_quantity,
        disponible: data.available_quantity,
        seuil: data.minimum_stock,
      },
    });
  }
  return versMaterielApi(data);
}

/**
 * Active ou désactive un matériel (jamais de suppression : il peut figurer
 * dans d'anciennes demandes).
 * @param {string} acteurId
 * @param {string} id
 * @param {boolean} actif
 * @throws {ErreurApi} 404
 */
export async function changerStatutMateriel(acteurId, id, actif) {
  const { data, error } = await supabase
    .from('materials')
    .update({ active: actif })
    .eq('id', id)
    .select(`${COLONNES_MATERIEL}, categories(id, name, active)`)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw ErreurApi.introuvable('Matériel introuvable.');

  await enregistrerAudit(acteurId, 'MATERIAL_STATUS_CHANGED', 'material', id, {
    nom: data.name,
    actif,
  });
  return versMaterielApi(data);
}

/** Types d'image acceptés et extension de fichier associée. */
export const TYPES_IMAGE = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };

/**
 * Envoie l'image dans le bucket « materials » puis enregistre son chemin.
 * @param {string} acteurId
 * @param {string} id
 * @param {{ buffer: Buffer, mimetype: string }} fichier fichier reçu par multer (en mémoire)
 * @throws {ErreurApi} 404 si le matériel n'existe pas
 */
export async function televerserImage(acteurId, id, fichier) {
  await lireMateriel(id, true);

  // Nom unique : évite le cache navigateur d'une ancienne image
  const chemin = `${id}/${Date.now()}.${TYPES_IMAGE[fichier.mimetype]}`;
  const { error: erreurEnvoi } = await supabase.storage
    .from('materials')
    .upload(chemin, fichier.buffer, { contentType: fichier.mimetype, upsert: false });
  if (erreurEnvoi) {
    throw new ErreurApi(502, 'STORAGE_ERROR', "L'image n'a pas pu être enregistrée.");
  }

  const { data, error } = await supabase
    .from('materials')
    .update({ image_path: chemin })
    .eq('id', id)
    .select(`${COLONNES_MATERIEL}, categories(id, name, active)`)
    .single();
  if (error) throw error;

  await enregistrerAudit(acteurId, 'MATERIAL_IMAGE_UPDATED', 'material', id, { chemin });
  return versMaterielApi(data);
}
