/**
 * Utilitaire de classes CSS (généré par shadcn/ui, complété).
 * Tier : présentation.
 */
import { clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge doit connaître les tailles de texte du design system
 * (text-caption, text-small…). Sinon il les prend pour des couleurs et supprime
 * « text-caption » dès qu'une couleur comme « text-success-text » la suit.
 */
const fusionner = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['h1', 'h2', 'h3', 'body', 'small', 'caption', 'label'] }],
    },
  },
});

/**
 * Fusionne des classes Tailwind en résolvant les conflits (ex. « px-2 » puis « px-4 »).
 * @param {...import('clsx').ClassValue} entrees
 * @returns {string}
 */
export function cn(...entrees) {
  return fusionner(clsx(entrees));
}
