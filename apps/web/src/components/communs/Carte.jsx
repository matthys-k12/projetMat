/**
 * Carte (design : rounded-lg border bg-card shadow-sm, en-tête px-5 py-4 border-b).
 * Tier : présentation.
 */
import { cn } from '@/lib/utils';

/**
 * @param {{ as?: import('react').ElementType, className?: string, children: import('react').ReactNode } & Record<string, unknown>} props
 */
export function Carte({ as: Balise = 'section', className, children, ...reste }) {
  return (
    <Balise className={cn('rounded-lg border bg-card shadow-sm', className)} {...reste}>
      {children}
    </Balise>
  );
}

/**
 * En-tête de carte : titre à gauche, complément (compteur, lien, filtres) à droite.
 * @param {{ titre?: import('react').ReactNode, children?: import('react').ReactNode, className?: string }} props
 */
export function EnTeteCarte({ titre, children, className }) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-4 border-b px-5 py-4', className)}>
      {titre && <h2 className="text-h3">{titre}</h2>}
      {children}
    </div>
  );
}

/**
 * @param {{ className?: string, children: import('react').ReactNode }} props
 */
export function CorpsCarte({ className, children }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}

/**
 * Alerte (erreur ou avertissement) : icône + texte, rôle alert pour les lecteurs d'écran.
 * @param {{ ton?: 'danger'|'warning', icone: import('react').ElementType, children: import('react').ReactNode, className?: string }} props
 */
export function Alerte({ ton = 'danger', icone: Icone, children, className }) {
  const classes =
    ton === 'danger'
      ? 'border-destructive-border bg-destructive-subtle text-destructive-text'
      : 'border-warning-border bg-warning-subtle text-warning-text';
  return (
    <div role="alert" className={cn('flex items-start gap-2.5 rounded-md border px-3.5 py-3 text-small', classes, className)}>
      <Icone className="mt-px size-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
