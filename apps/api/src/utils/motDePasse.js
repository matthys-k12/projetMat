/**
 * Mots de passe : génération du mot de passe temporaire et règles du mot de passe définitif.
 *
 * Tier : métier. Utilisé par : modules/utilisateurs (création de compte) et modules/auth
 * (changement de mot de passe).
 */
import { randomInt } from 'node:crypto';
import { z } from 'zod';

// Caractères ambigus exclus (0/O, 1/l/I) : le mot de passe est recopié par un humain.
const MAJUSCULES = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const MINUSCULES = 'abcdefghijkmnopqrstuvwxyz';
const CHIFFRES = '23456789';
const SYMBOLES = '!@#$%&*?-_';
const TOUS = MAJUSCULES + MINUSCULES + CHIFFRES + SYMBOLES;

/**
 * Tire un caractère au hasard avec crypto.randomInt (générateur cryptographique,
 * contrairement à Math.random qui est prévisible).
 * @param {string} alphabet
 * @returns {string}
 */
function tirer(alphabet) {
  return alphabet[randomInt(alphabet.length)];
}

/**
 * Génère un mot de passe temporaire fort : 16 caractères, au moins une majuscule,
 * une minuscule, un chiffre et un symbole, dans un ordre aléatoire.
 * @param {number} [longueur]
 * @returns {string}
 */
export function genererMotDePasseTemporaire(longueur = 16) {
  const caracteres = [tirer(MAJUSCULES), tirer(MINUSCULES), tirer(CHIFFRES), tirer(SYMBOLES)];
  while (caracteres.length < longueur) caracteres.push(tirer(TOUS));

  // Mélange de Fisher-Yates (aléatoire cryptographique) : les 4 caractères
  // obligatoires ne restent pas en tête.
  for (let i = caracteres.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]];
  }
  return caracteres.join('');
}

/** Règles du mot de passe choisi par l'utilisateur (mêmes règles côté front). */
export const schemaMotDePasse = z
  .string({ message: 'Le mot de passe est obligatoire.' })
  .min(10, { message: 'Le mot de passe doit contenir au moins 10 caractères.' })
  .max(72, { message: 'Le mot de passe est limité à 72 caractères.' })
  .regex(/[A-Z]/, { message: 'Le mot de passe doit contenir au moins une majuscule.' })
  .regex(/[0-9]/, { message: 'Le mot de passe doit contenir au moins un chiffre.' });
