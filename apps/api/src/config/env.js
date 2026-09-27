/**
 * Lecture et validation des variables d'environnement.
 *
 * Tier : métier (configuration du serveur).
 * Utilisé par : config/supabase.js, app.js, server.js.
 *
 * Pourquoi valider au démarrage : une variable manquante doit arrêter l'API
 * immédiatement avec un message clair, plutôt que de provoquer une erreur
 * obscure à la première requête.
 */
import 'dotenv/config';
import { z } from 'zod';

const schemaEnv = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  SUPABASE_URL: z.string().url({ message: 'SUPABASE_URL doit être une URL valide' }),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(20, { message: 'SUPABASE_SERVICE_ROLE_KEY est manquante' }),
  WEB_URL: z.string().url().default('http://localhost:5173'),
});

/**
 * @typedef {Object} Env
 * @property {'development'|'production'|'test'} NODE_ENV
 * @property {number} PORT
 * @property {string} SUPABASE_URL
 * @property {string} SUPABASE_SERVICE_ROLE_KEY
 * @property {string} WEB_URL
 */

/**
 * Valide process.env et arrête le processus si la configuration est invalide.
 * @returns {Env}
 */
function lireEnv() {
  const resultat = schemaEnv.safeParse(process.env);
  if (!resultat.success) {
    console.error('Configuration invalide. Vérifiez apps/api/.env (voir .env.example) :');
    for (const probleme of resultat.error.issues) {
      console.error(`  - ${probleme.path.join('.')} : ${probleme.message}`);
    }
    process.exit(1);
  }
  return resultat.data;
}

/** @type {Env} */
export const env = lireEnv();

export const estEnDeveloppement = env.NODE_ENV === 'development';
