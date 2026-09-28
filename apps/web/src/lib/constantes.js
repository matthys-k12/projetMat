/**
 * Libellés français et variantes visuelles des statuts (vocabulaire figé par design/README.md).
 *
 * Tier : présentation. Utilisé par : BadgeStatut, BadgeDisponibilite, onglets, chronologie, audit.
 * Les statuts techniques (PENDING…) sont le contrat de l'API ; seul l'affichage est traduit ici.
 */

/**
 * Pour chaque statut de demande : libellé, classes du badge et couleur de la pastille.
 * Le libellé utilise la variante « -text » (seule à passer AA sur le fond « -subtle »),
 * la couleur vive ne sert qu'à la pastille.
 */
export const STATUTS_DEMANDE = {
  PENDING: {
    libelle: 'En attente',
    classes: 'bg-warning-subtle text-warning-text border-warning-border',
    pastille: 'bg-warning',
  },
  APPROVED: {
    libelle: 'Approuvée',
    classes: 'bg-primary-subtle text-primary-text border-primary-border',
    pastille: 'bg-primary',
  },
  FULFILLED: {
    libelle: 'Remise',
    classes: 'bg-success-subtle text-success-text border-success-border',
    pastille: 'bg-success',
  },
  REJECTED: {
    libelle: 'Refusée',
    classes: 'bg-destructive-subtle text-destructive-text border-destructive-border',
    pastille: 'bg-destructive',
  },
  CANCELLED: {
    libelle: 'Annulée',
    classes: 'bg-muted text-muted-strong border-border',
    pastille: 'bg-neutral-dot',
  },
};

/** Disponibilité d'un matériel (valeurs renvoyées par l'API). */
export const DISPONIBILITES = {
  disponible: {
    libelle: 'Disponible',
    classes: 'bg-success-subtle text-success-text border-success-border',
    pastille: 'bg-success',
  },
  stock_faible: {
    libelle: 'Stock faible',
    classes: 'bg-warning-subtle text-warning-text border-warning-border',
    pastille: 'bg-warning',
  },
  indisponible: {
    libelle: 'Indisponible',
    classes: 'bg-muted text-muted-strong border-border',
    pastille: 'bg-neutral-dot',
  },
};

/**
 * Onglets de « Mes demandes ». « Acceptées » regroupe les approuvées ET les remises
 * (une demande remise a forcément été acceptée).
 */
export const ONGLETS_DEMANDES = [
  { valeur: 'toutes', libelle: 'Toutes', statuts: undefined, cleStat: 'total' },
  { valeur: 'attente', libelle: 'En attente', statuts: 'PENDING', cleStat: 'enAttente' },
  { valeur: 'acceptees', libelle: 'Acceptées', statuts: 'APPROVED,FULFILLED', cleStat: 'acceptees' },
  { valeur: 'refusees', libelle: 'Refusées', statuts: 'REJECTED', cleStat: 'refusees' },
  { valeur: 'annulees', libelle: 'Annulées', statuts: 'CANCELLED', cleStat: 'annulees' },
  { valeur: 'remises', libelle: 'Remises', statuts: 'FULFILLED', cleStat: 'remises' },
];

/** Titre de chaque étape dans la chronologie d'une demande. */
export const ETAPES_CHRONOLOGIE = {
  PENDING: 'Demande créée',
  APPROVED: 'Approuvée',
  REJECTED: 'Refusée',
  CANCELLED: 'Annulée par le demandeur',
  FULFILLED: 'Matériel remis',
};

/** Libellés des actions du journal d'audit. */
export const ACTIONS_AUDIT = {
  REQUEST_CREATED: 'Demande créée',
  REQUEST_APPROVED: 'Demande approuvée',
  REQUEST_REJECTED: 'Demande refusée',
  REQUEST_CANCELLED: 'Demande annulée',
  REQUEST_FULFILLED: 'Matériel remis',
  MATERIAL_CREATED: 'Matériel créé',
  MATERIAL_UPDATED: 'Matériel modifié',
  STOCK_UPDATED: 'Stock modifié',
  MATERIAL_STATUS_CHANGED: 'Statut du matériel modifié',
  MATERIAL_IMAGE_UPDATED: 'Image du matériel modifiée',
  CATEGORY_CREATED: 'Catégorie créée',
  CATEGORY_UPDATED: 'Catégorie modifiée',
  CATEGORY_STATUS_CHANGED: 'Statut de la catégorie modifié',
};

/** Libellés des types de ressource du journal d'audit. */
export const TYPES_ENTITE = {
  request: 'Demande',
  material: 'Matériel',
  category: 'Catégorie',
};
