/**
 * Route de santé : permet de vérifier que l'API répond (supervision, démo).
 *
 * Tier : métier. Route publique (déclarée AVANT le middleware d'authentification dans app.js).
 */
import { Router } from 'express';
import { lireSante } from './sante.controleur.js';

export const routesSante = Router();

routesSante.get('/', lireSante);
