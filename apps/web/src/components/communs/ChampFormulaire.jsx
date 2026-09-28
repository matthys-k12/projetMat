/**
 * Champ de formulaire accessible : libellé visible, aide, erreur reliée par aria-describedby.
 *
 * Tier : présentation. L'enfant (Input, Textarea…) reçoit id, aria-invalid et
 * aria-describedby via une fonction de rendu, pour rester explicite.
 */
import { CircleAlert } from 'lucide-react';

/**
 * @param {{
 *   id: string,
 *   libelle: string,
 *   obligatoire?: boolean,
 *   erreur?: string,
 *   aide?: import('react').ReactNode,
 *   children: (attributs: { id: string, 'aria-invalid': boolean|undefined, 'aria-describedby': string|undefined }) => import('react').ReactNode,
 * }} props
 */
export function ChampFormulaire({ id, libelle, obligatoire, erreur, aide, children }) {
  const idErreur = `${id}-erreur`;
  const idAide = `${id}-aide`;
  const decrit = [erreur ? idErreur : null, aide ? idAide : null].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-label">
        {libelle}
        {obligatoire && (
          <span className="text-destructive-text" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {children({
        id,
        'aria-invalid': erreur ? true : undefined,
        'aria-describedby': decrit || undefined,
      })}
      {erreur && <MessageErreur id={idErreur}>{erreur}</MessageErreur>}
      {aide && !erreur && (
        <span id={idAide} className="text-caption text-muted-foreground">
          {aide}
        </span>
      )}
    </div>
  );
}

/**
 * Message d'erreur sous un champ (icône + texte danger).
 * @param {{ id?: string, children: import('react').ReactNode }} props
 */
export function MessageErreur({ id, children }) {
  return (
    <p id={id} className="flex items-center gap-1.5 text-caption font-medium text-destructive-text">
      <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}
