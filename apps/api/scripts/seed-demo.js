/**
 * Script de démo — crée les comptes et quelques demandes de démonstration.
 *
 * Tier : données (outil d'administration, jamais exécuté par l'application).
 * Usage (depuis la racine) : npm run seed:demo
 * Prérequis : migrations + supabase/seed.sql appliqués ; SUPABASE_URL et
 * SUPABASE_SERVICE_ROLE_KEY dans apps/api/.env. Le script est idempotent :
 * on peut le relancer sans créer de doublons.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const cleServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !cleServiceRole) {
  throw new Error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.');
}

const supabase = createClient(url, cleServiceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * @typedef {Object} UtilisateurDemo
 * @property {string} email
 * @property {string} motDePasse
 * @property {string} prenom
 * @property {string} nom
 * @property {'USER'|'ADMIN'} role
 */

/** @type {UtilisateurDemo[]} */
const UTILISATEURS_DEMO = [
  {
    email: 'admin@itrm.demo',
    motDePasse: 'Admin123!',
    prenom: 'Koffi',
    nom: "N'Guessan",
    role: 'ADMIN',
  },
  { email: 'aya@itrm.demo', motDePasse: 'User123!', prenom: 'Aya', nom: 'Kouassi', role: 'USER' },
  { email: 'yao@itrm.demo', motDePasse: 'User123!', prenom: 'Yao', nom: 'Konan', role: 'USER' },
];

/**
 * Crée le compte s'il n'existe pas, puis fixe son rôle dans profiles.
 * @param {UtilisateurDemo} utilisateur
 * @returns {Promise<string>} l'identifiant du profil
 * @throws si le compte ne peut être ni créé ni retrouvé
 */
async function assurerUtilisateur(utilisateur) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: utilisateur.email,
    password: utilisateur.motDePasse,
    email_confirm: true,
    user_metadata: { first_name: utilisateur.prenom, last_name: utilisateur.nom },
  });

  let id = data.user?.id;
  if (error) {
    // Le compte existe déjà : on retrouve son profil (créé par le trigger on_auth_user_created)
    const { data: profil } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', utilisateur.email)
      .single();
    if (!profil) throw error;
    id = profil.id;
  }

  // Le rôle est attribué côté serveur uniquement, jamais via user_metadata (modifiable par l'utilisateur)
  const { error: erreurRole } = await supabase
    .from('profiles')
    .update({ role: utilisateur.role })
    .eq('id', id);
  if (erreurRole) throw erreurRole;

  console.log(`✔ ${utilisateur.role.padEnd(5)} ${utilisateur.email} / ${utilisateur.motDePasse}`);
  return id;
}

/**
 * @param {string} nom nom exact du matériel (voir supabase/seed.sql)
 * @returns {Promise<string>} identifiant du matériel
 */
async function idMateriel(nom) {
  const { data, error } = await supabase.from('materials').select('id').eq('name', nom).single();
  if (error || !data) throw new Error(`Matériel introuvable : ${nom}`);
  return data.id;
}

/**
 * Appelle une fonction RPC et lève une erreur lisible en cas d'échec.
 * @param {string} fonction nom de la RPC
 * @param {Record<string, unknown>} parametres
 * @returns {Promise<unknown>}
 */
async function rpc(fonction, parametres) {
  const { data, error } = await supabase.rpc(fonction, parametres);
  if (error) throw new Error(`${fonction} : ${error.message} — ${error.details ?? ''}`);
  // create_request déployée renvoie { id, status, reference } (la migration dit uuid) :
  // on ramène toujours l'identifiant seul.
  if (data && typeof data === 'object' && 'id' in data) return data.id;
  return data;
}

async function principal() {
  const adminId = await assurerUtilisateur(UTILISATEURS_DEMO[0]);
  const ayaId = await assurerUtilisateur(UTILISATEURS_DEMO[1]);
  const yaoId = await assurerUtilisateur(UTILISATEURS_DEMO[2]);

  const { count } = await supabase
    .from('requests')
    .select('id', { count: 'exact', head: true })
    .in('user_id', [ayaId, yaoId]);
  if ((count ?? 0) > 0) {
    console.log('Demandes de démo déjà présentes.');
    return;
  }

  const portable = await idMateriel('Dell Latitude 5440');
  const souris = await idMateriel('Souris Logitech MX Master 3S');
  const ecran = await idMateriel('Écran Dell 24" P2423');
  const adaptateur = await idMateriel('Adaptateur USB-C multiport');
  const clavier = await idMateriel('Clavier Logitech MX Keys');
  const station = await idMateriel("Station d'accueil Dell WD19");

  // 1. Approuvée puis remise
  const demande1 = await rpc('create_request', {
    p_user_id: ayaId,
    p_reason: 'Remplacement de mon ordinateur portable, en panne depuis lundi.',
    p_items: [
      { material_id: portable, quantity: 1 },
      { material_id: souris, quantity: 1 },
    ],
  });
  await rpc('approve_request', {
    p_request_id: demande1,
    p_admin_id: adminId,
    p_comment: 'À récupérer au service IT.',
  });
  await rpc('fulfill_request', { p_request_id: demande1, p_admin_id: adminId });

  // 2. En attente
  await rpc('create_request', {
    p_user_id: ayaId,
    p_reason: 'Second écran pour le suivi des tableaux de bord financiers.',
    p_items: [
      { material_id: ecran, quantity: 1 },
      { material_id: adaptateur, quantity: 1 },
    ],
  });

  // 3. Refusée
  const demande3 = await rpc('create_request', {
    p_user_id: yaoId,
    p_reason: "Claviers pour l'équipe support pendant la période de forte activité.",
    p_items: [{ material_id: clavier, quantity: 3 }],
  });
  await rpc('reject_request', {
    p_request_id: demande3,
    p_admin_id: adminId,
    p_comment: "Les demandes groupées doivent passer par le responsable d'équipe.",
  });

  // 4. Approuvée, pas encore remise
  const demande4 = await rpc('create_request', {
    p_user_id: yaoId,
    p_reason: 'Station d’accueil pour brancher mon portable aux écrans du bureau.',
    p_items: [{ material_id: station, quantity: 1 }],
  });
  await rpc('approve_request', { p_request_id: demande4, p_admin_id: adminId });

  console.log('✔ 4 demandes de démo : remise, en attente, refusée, approuvée.');
}

principal().catch((erreur) => {
  console.error(erreur);
  process.exit(1);
});
