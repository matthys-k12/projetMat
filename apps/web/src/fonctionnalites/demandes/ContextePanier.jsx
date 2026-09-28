/**
 * Panier de la future demande : lignes { materiel, quantite }, conservées dans sessionStorage.
 *
 * Tier : présentation. Alimenté par « Ajouter à la demande » (détail matériel)
 * et modifié dans la page « Nouvelle demande ». sessionStorage : le panier
 * survit à un rechargement de page mais disparaît à la fermeture de l'onglet.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CLE_STOCKAGE = 'itrm.panier';

/**
 * @typedef {Object} MaterielPanier
 * @property {string} id
 * @property {string} nom
 * @property {string|null} categorie
 * @property {number} quantiteDisponible
 */

/**
 * @typedef {Object} LignePanier
 * @property {string} cle identifiant local de la ligne (stable pendant l'édition)
 * @property {MaterielPanier|null} materiel null tant qu'aucun matériel n'est choisi
 * @property {number} quantite
 */

/** @type {import('react').Context<ReturnType<typeof useValeurPanier>|null>} */
const ContextePanier = createContext(null);

/** @returns {LignePanier[]} */
function lireStockage() {
  try {
    return JSON.parse(sessionStorage.getItem(CLE_STOCKAGE) ?? '[]');
  } catch {
    return [];
  }
}

function nouvelleCle() {
  return Math.random().toString(36).slice(2, 10);
}

/** Logique du panier (séparée du composant pour rester lisible). */
function useValeurPanier() {
  const [lignes, setLignes] = useState(lireStockage);

  useEffect(() => {
    sessionStorage.setItem(CLE_STOCKAGE, JSON.stringify(lignes));
  }, [lignes]);

  /**
   * Ajoute un matériel ; s'il est déjà présent, on additionne (pas de doublon),
   * sans dépasser le stock disponible.
   * @param {MaterielPanier} materiel
   * @param {number} quantite
   */
  const ajouter = useCallback((materiel, quantite) => {
    setLignes((actuelles) => {
      const existante = actuelles.find((ligne) => ligne.materiel?.id === materiel.id);
      if (!existante) return [...actuelles, { cle: nouvelleCle(), materiel, quantite }];
      return actuelles.map((ligne) =>
        ligne === existante
          ? { ...ligne, materiel, quantite: Math.min(ligne.quantite + quantite, materiel.quantiteDisponible) }
          : ligne,
      );
    });
  }, []);

  const ajouterLigneVide = useCallback(() => {
    setLignes((actuelles) => [...actuelles, { cle: nouvelleCle(), materiel: null, quantite: 1 }]);
  }, []);

  /** @param {string} cle @param {Partial<LignePanier>} modifications */
  const modifier = useCallback((cle, modifications) => {
    setLignes((actuelles) => actuelles.map((l) => (l.cle === cle ? { ...l, ...modifications } : l)));
  }, []);

  /** @param {string} cle */
  const supprimer = useCallback((cle) => {
    setLignes((actuelles) => actuelles.filter((l) => l.cle !== cle));
  }, []);

  const vider = useCallback(() => setLignes([]), []);

  return useMemo(
    () => ({ lignes, ajouter, ajouterLigneVide, modifier, supprimer, vider }),
    [lignes, ajouter, ajouterLigneVide, modifier, supprimer, vider],
  );
}

/**
 * @param {{ children: import('react').ReactNode }} props
 */
export function FournisseurPanier({ children }) {
  const valeur = useValeurPanier();
  return <ContextePanier.Provider value={valeur}>{children}</ContextePanier.Provider>;
}

/** Accès au panier depuis n'importe quel composant. */
export function usePanier() {
  const valeur = useContext(ContextePanier);
  if (!valeur) throw new Error('usePanier doit être utilisé dans <FournisseurPanier>.');
  return valeur;
}
