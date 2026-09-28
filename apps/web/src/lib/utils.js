/**
 * Utilitaire de classes CSS (généré par shadcn/ui).
 * Tier : présentation.
 */
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Fusionne des classes Tailwind en résolvant les conflits (ex. « px-2 » puis « px-4 »).
 * @param {...import('clsx').ClassValue} entrees
 * @returns {string}
 */
export function cn(...entrees) {
  return twMerge(clsx(entrees));
}
