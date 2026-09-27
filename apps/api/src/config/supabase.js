/**
 * Client Supabase côté serveur, authentifié avec la clé service_role.
 *
 * Tier : métier → données.
 * Utilisé par : tous les services et le middleware d'authentification.
 *
 * Sécurité : la service_role contourne la RLS. C'est voulu : la base est en
 * « deny all » pour le navigateur, et c'est l'API qui décide qui a le droit
 * de faire quoi (token vérifié + rôle lu dans profiles). Cette clé ne doit
 * JAMAIS quitter le serveur.
 */
import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  // Serveur sans état : pas de session à stocker ni à rafraîchir.
  auth: { persistSession: false, autoRefreshToken: false },
});
