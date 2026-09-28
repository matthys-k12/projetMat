/**
 * Client Supabase du navigateur, avec la clé ANON (publique).
 *
 * Tier : présentation.
 * Utilisé par : fonctionnalites/auth (connexion, déconnexion, session) et lib/clientApi.js (token).
 *
 * RÈGLE : ce client sert UNIQUEMENT à l'authentification. Il ne lit ni n'écrit
 * aucune donnée métier : la base est en « deny all » pour la clé anon, et
 * toutes les données passent par l'API (/api/v1).
 */
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
