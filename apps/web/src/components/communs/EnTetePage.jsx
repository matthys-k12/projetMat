/**
 * En-tête de page : titre (un seul h1 par vue) + phrase d'explication à gauche, actions à droite.
 * Tier : présentation.
 */

/**
 * @param {{ titre: import('react').ReactNode, description?: import('react').ReactNode, actions?: import('react').ReactNode }} props
 */
export function EnTetePage({ titre, description, actions }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <h1 className="text-h1">{titre}</h1>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
