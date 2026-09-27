/**
 * Erreur métier transportant un statut HTTP et un code stable.
 *
 * Tier : métier.
 * Utilisé par : services, middlewares ; interceptée par middlewares/gestionErreurs.js.
 */
export class ErreurApi extends Error {
  /**
   * @param {number} statutHttp statut HTTP à renvoyer (404, 409…)
   * @param {string} code code stable lisible par le front (ex. REQUEST_NOT_FOUND)
   * @param {string} message message en français, affichable tel quel
   * @param {unknown} [details] contexte complémentaire (erreurs de validation…)
   */
  constructor(statutHttp, code, message, details) {
    super(message);
    this.name = 'ErreurApi';
    this.statutHttp = statutHttp;
    this.code = code;
    this.details = details;
  }

  /** @param {string} [message] */
  static introuvable(message = 'Ressource introuvable.') {
    return new ErreurApi(404, 'NOT_FOUND', message);
  }

  /** @param {string} [message] */
  static nonAuthentifie(message = 'Authentification requise.') {
    return new ErreurApi(401, 'UNAUTHORIZED', message);
  }

  /** @param {string} [message] */
  static interdit(message = "Vous n'avez pas les droits pour cette action.") {
    return new ErreurApi(403, 'FORBIDDEN', message);
  }
}
