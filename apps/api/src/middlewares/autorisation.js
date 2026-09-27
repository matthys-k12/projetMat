/**
 * Middleware d'autorisation par rôle.
 *
 * Tier : métier (couche « middlewares »).
 * Utilisé par : app.js, qui protège tout le routeur /admin avec exigerRole('ADMIN').
 * Prérequis : le middleware d'authentification a rempli req.utilisateur.
 */
import { ErreurApi } from '../utils/ErreurApi.js';

/**
 * Crée un middleware qui refuse (403) tout utilisateur n'ayant pas l'un des rôles donnés.
 *
 * C'est ici que se trouve la vraie sécurité des écrans d'administration :
 * masquer le menu côté front n'est que du confort visuel.
 *
 * @param {...('USER'|'ADMIN')} rolesAutorises
 * @returns {import('express').RequestHandler}
 */
export function exigerRole(...rolesAutorises) {
  return (req, _res, next) => {
    if (!req.utilisateur) {
      throw ErreurApi.nonAuthentifie();
    }
    if (!rolesAutorises.includes(req.utilisateur.role)) {
      throw ErreurApi.interdit('Action réservée aux administrateurs.');
    }
    next();
  };
}
