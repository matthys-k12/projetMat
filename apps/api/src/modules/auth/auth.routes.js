/**
 * Routes d'authentification (/api/v1/auth).
 *
 * Tier : métier. Chaîne : route → authentification (globale) → validation → contrôleur → service.
 * La connexion elle-même se fait côté front avec Supabase Auth ; l'API vérifie le token,
 * expose le profil et permet de remplacer le mot de passe temporaire.
 */
import { Router } from 'express';
import { valider } from '../../middlewares/validation.js';
import { schemaChangementMotDePasse } from './auth.schemas.js';
import { changerMotDePasse, deconnecter, lireMoi } from './auth.controleur.js';

export const routesAuth = Router();

routesAuth.get('/me', lireMoi);
routesAuth.post('/logout', deconnecter);
routesAuth.post('/password', valider({ body: schemaChangementMotDePasse }), changerMotDePasse);
