/**
 * Middleware de validation des entrées avec zod.
 *
 * Tier : métier (couche « middlewares »).
 * Utilisé par : les fichiers *.routes.js, avec les schémas des fichiers *.schemas.js.
 *
 * Pourquoi valider avant le contrôleur : le contrôleur et le service reçoivent
 * des données propres et typées (nombres convertis, champs inconnus retirés),
 * et l'utilisateur reçoit un message en français pour chaque champ invalide.
 */
import { ErreurApi } from '../utils/ErreurApi.js';

/**
 * @typedef {Object} SchemasRequete
 * @property {import('zod').ZodTypeAny} [body]
 * @property {import('zod').ZodTypeAny} [query]
 * @property {import('zod').ZodTypeAny} [params]
 */

/**
 * Transforme les erreurs zod en liste lisible { champ, message }.
 * @param {import('zod').ZodError} erreur
 * @returns {{ champ: string, message: string }[]}
 */
export function formaterErreursZod(erreur) {
  return erreur.issues.map((probleme) => ({
    champ: probleme.path.join('.') || '(racine)',
    message: probleme.message,
  }));
}

/**
 * Valide body, query et params. Les valeurs validées remplacent les valeurs brutes
 * dans req.donnees (Express 5 rend req.query en lecture seule).
 *
 * @param {SchemasRequete} schemas
 * @returns {import('express').RequestHandler}
 * @throws {ErreurApi} 422 VALIDATION_ERROR avec le détail des champs
 */
export function valider(schemas) {
  return (req, _res, next) => {
    req.donnees = { body: req.body, query: req.query, params: req.params };

    for (const partie of ['params', 'query', 'body']) {
      const schema = schemas[partie];
      if (!schema) continue;

      const resultat = schema.safeParse(req[partie] ?? {});
      if (!resultat.success) {
        const erreurs = formaterErreursZod(resultat.error);
        throw new ErreurApi(422, 'VALIDATION_ERROR', erreurs[0].message, erreurs);
      }
      req.donnees[partie] = resultat.data;
    }
    next();
  };
}
