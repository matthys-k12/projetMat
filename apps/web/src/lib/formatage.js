/**
 * Formatage des dates en français (JJ/MM/AAAA, HH:MM, dates relatives).
 *
 * Tier : présentation. Utilisé par : tableaux, détails, chronologie, notifications.
 */
import {
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
  isToday,
  isYesterday,
} from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * @param {string|Date} date
 * @returns {string} ex. « 27/09/2026 »
 */
export function formaterDate(date) {
  return format(new Date(date), 'dd/MM/yyyy');
}

/**
 * @param {string|Date} date
 * @returns {string} ex. « 27/09/2026 · 09:14 »
 */
export function formaterDateHeure(date) {
  return format(new Date(date), 'dd/MM/yyyy · HH:mm');
}

/**
 * @param {string|Date} date
 * @returns {string} ex. « 27 septembre 2026 à 09:14 »
 */
export function formaterDateLongue(date) {
  return format(new Date(date), "d MMMM yyyy 'à' HH:mm", { locale: fr });
}

/**
 * Date relative pour les notifications et « dernière mise à jour ».
 * @param {string|Date} date
 * @returns {string} ex. « à l'instant », « il y a 2 h », « hier à 17:02 », « 12/09/2026 »
 */
export function formaterDateRelative(date) {
  const valeur = new Date(date);
  const secondes = (Date.now() - valeur.getTime()) / 1000;

  if (secondes < 60) return "à l'instant";
  if (isToday(valeur)) {
    const duree = formatDistanceToNowStrict(valeur, { locale: fr });
    return `il y a ${duree.replace(' heures', ' h').replace(' heure', ' h')}`;
  }
  if (isYesterday(valeur)) return `hier à ${format(valeur, 'HH:mm')}`;
  if (differenceInCalendarDays(new Date(), valeur) < 7) {
    return `il y a ${differenceInCalendarDays(new Date(), valeur)} jours`;
  }
  return formaterDate(valeur);
}

/**
 * Initiales d'une personne pour l'avatar.
 * @param {string} nomComplet ex. « Aya Kouassi »
 * @returns {string} ex. « AK »
 */
export function initiales(nomComplet) {
  return nomComplet
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0].toUpperCase())
    .join('');
}

/**
 * Accord simple du pluriel.
 * @param {number} nombre
 * @param {string} singulier
 * @param {string} [pluriel]
 * @returns {string} ex. « 3 articles »
 */
export function pluriel(nombre, singulier, pluriel = `${singulier}s`) {
  return `${nombre} ${nombre > 1 ? pluriel : singulier}`;
}
