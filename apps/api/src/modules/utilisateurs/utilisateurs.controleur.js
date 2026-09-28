/**
 * Contrôleur de la gestion des comptes (HTTP uniquement).
 *
 * Tier : métier (couche contrôleur). L'identité de l'admin qui agit vient du token
 * (req.utilisateur), pour l'audit et la protection contre l'auto-blocage.
 */
import * as service from './utilisateurs.service.js';

/**
 * GET /admin/users
 * @type {import('express').RequestHandler}
 */
export async function lister(req, res) {
  res.json(await service.listerUtilisateurs(req.donnees.query));
}

/**
 * POST /admin/users — renvoie { utilisateur, motDePasseTemporaire } (affiché une seule fois).
 * @type {import('express').RequestHandler}
 */
export async function creer(req, res) {
  // Aucune mise en cache de la réponse : elle contient un mot de passe
  res.set('Cache-Control', 'no-store');
  res.status(201).json(await service.creerUtilisateur(req.utilisateur.id, req.donnees.body));
}

/**
 * PATCH /admin/users/:id/status
 * @type {import('express').RequestHandler}
 */
export async function changerStatut(req, res) {
  const { id } = req.donnees.params;
  res.json(await service.changerStatutUtilisateur(req.utilisateur.id, id, req.donnees.body.actif));
}

/**
 * PATCH /admin/users/:id/role
 * @type {import('express').RequestHandler}
 */
export async function changerRole(req, res) {
  const { id } = req.donnees.params;
  res.json(await service.changerRoleUtilisateur(req.utilisateur.id, id, req.donnees.body.role));
}

/**
 * POST /admin/users/:id/password-reset — nouveau mot de passe temporaire (affiché une seule fois).
 * @type {import('express').RequestHandler}
 */
export async function reinitialiserMotDePasse(req, res) {
  res.set('Cache-Control', 'no-store');
  res.json(await service.reinitialiserMotDePasse(req.utilisateur.id, req.donnees.params.id));
}
