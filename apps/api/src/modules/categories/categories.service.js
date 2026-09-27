/**
 * Service des catégories : lecture pour tous, écriture pour l'admin.
 *
 * Tier : métier → données. Chaque écriture admin est tracée dans audit_logs.
 */
import { supabase } from '../../config/supabase.js';
import { versCategorieApi } from '../../utils/convertisseurs.js';
import { enregistrerAudit } from '../../utils/journalAudit.js';
import { ErreurApi } from '../../utils/ErreurApi.js';

// materials(count) : PostgREST compte les matériels liés sans les charger.
const COLONNES = 'id, name, description, active, created_at, materials(count)';

/**
 * Liste les catégories triées par nom.
 * @param {boolean} inclureInactives true pour l'admin
 * @returns {Promise<import('../../utils/convertisseurs.js').CategorieApi[]>}
 */
export async function listerCategories(inclureInactives) {
  let requete = supabase.from('categories').select(COLONNES).order('name');
  if (!inclureInactives) requete = requete.eq('active', true);

  const { data, error } = await requete;
  if (error) throw error;
  return data.map(versCategorieApi);
}

/**
 * Crée une catégorie.
 * @param {string} acteurId admin qui crée
 * @param {{ nom: string, description: string|null }} donnees
 * @returns {Promise<import('../../utils/convertisseurs.js').CategorieApi>}
 * @throws 409 si le nom existe déjà (contrainte UNIQUE)
 */
export async function creerCategorie(acteurId, donnees) {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name: donnees.nom, description: donnees.description })
    .select(COLONNES)
    .single();
  if (error) throw error;

  await enregistrerAudit(acteurId, 'CATEGORY_CREATED', 'category', data.id, { nom: data.name });
  return versCategorieApi(data);
}

/**
 * Modifie le nom et la description d'une catégorie.
 * @param {string} acteurId
 * @param {string} id
 * @param {{ nom: string, description: string|null }} donnees
 * @throws {ErreurApi} 404 si la catégorie n'existe pas
 */
export async function modifierCategorie(acteurId, id, donnees) {
  const { data, error } = await supabase
    .from('categories')
    .update({ name: donnees.nom, description: donnees.description })
    .eq('id', id)
    .select(COLONNES)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw ErreurApi.introuvable('Catégorie introuvable.');

  await enregistrerAudit(acteurId, 'CATEGORY_UPDATED', 'category', id, { nom: data.name });
  return versCategorieApi(data);
}

/**
 * Active ou désactive une catégorie. Désactiver masque ses matériels du catalogue
 * (le catalogue exige une catégorie active) sans rien supprimer : on garde l'historique.
 * @param {string} acteurId
 * @param {string} id
 * @param {boolean} actif
 * @throws {ErreurApi} 404 si la catégorie n'existe pas
 */
export async function changerStatutCategorie(acteurId, id, actif) {
  const { data, error } = await supabase
    .from('categories')
    .update({ active: actif })
    .eq('id', id)
    .select(COLONNES)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw ErreurApi.introuvable('Catégorie introuvable.');

  await enregistrerAudit(acteurId, 'CATEGORY_STATUS_CHANGED', 'category', id, { actif });
  return versCategorieApi(data);
}
