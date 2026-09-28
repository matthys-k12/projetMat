/**
 * Routes d'authentification (/api/v1/auth).
 *
 * Tier : métier. Chaîne : route → authentification (globale) → validation → contrôleur → service.
 * La connexion elle-même se fait côté front avec Supabase Auth ; l'API vérifie le token,
 * expose le profil et permet de remplacer le mot de passe.
 *
 * Deux routeurs :
 * - routesAuthPubliques : monté AVANT le middleware d'authentification (mot de passe oublié :
 *   par définition, l'utilisateur n'a pas de session) ;
 * - routesAuth : exige un token valide.
 */
import { Router } from 'express';
import { valider } from '../../middlewares/validation.js';
import { schemaChangementMotDePasse, schemaDemandeReinitialisation } from './auth.schemas.js';
import {
  changerMotDePasse,
  deconnecter,
  demanderReinitialisation,
  lireMoi,
} from './auth.controleur.js';

export const routesAuthPubliques = Router();
routesAuthPubliques.post(
  '/password/forgot',
  valider({ body: schemaDemandeReinitialisation }),
  demanderReinitialisation,
);

export const routesAuth = Router();
routesAuth.get('/me', lireMoi);
routesAuth.post('/logout', deconnecter);
routesAuth.post('/password', valider({ body: schemaChangementMotDePasse }), changerMotDePasse);
