/**
 * Routes d'authentification (/api/v1/auth).
 *
 * Tier : métier. Chaîne : route → authentification (globale) → contrôleur → service.
 * La connexion elle-même se fait côté front avec Supabase Auth ; l'API ne fait
 * que vérifier le token et exposer le profil.
 */
import { Router } from 'express';
import { deconnecter, lireMoi } from './auth.controleur.js';

export const routesAuth = Router();

routesAuth.get('/me', lireMoi);
routesAuth.post('/logout', deconnecter);
