/**
 * Contrôleur de santé.
 *
 * Tier : métier (couche contrôleur : HTTP uniquement, aucune règle métier).
 */

/**
 * GET /health — répond 200 si le processus Node tourne.
 * @type {import('express').RequestHandler}
 */
export function lireSante(_req, res) {
  res.json({ statut: 'ok', service: 'it-request-manager-api', date: new Date().toISOString() });
}
