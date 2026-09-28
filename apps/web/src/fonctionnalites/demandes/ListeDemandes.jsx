/**
 * Liste de demandes : tableau à partir de md, cartes-liens en dessous (design Mobile06).
 * Tier : présentation. Utilisée par le tableau de bord et « Mes demandes ».
 */
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BadgeStatut } from '@/components/communs/BadgeStatut';
import { formaterDate, formaterDateRelative, pluriel } from '@/lib/formatage';

const CLASSES_TH =
  'h-10 bg-background px-4 text-left text-caption font-medium text-muted-foreground first:pl-5 last:pr-5';
const CLASSES_TD = 'h-[52px] border-t px-4 first:pl-5 last:pr-5';

/**
 * @param {{ demandes: import('./api').Demande[] }} props
 */
export function ListeDemandes({ demandes }) {
  return (
    <>
      <table className="hidden w-full md:table">
        <thead>
          <tr>
            <th className={CLASSES_TH}>Référence</th>
            <th className={CLASSES_TH}>Date</th>
            <th className={`${CLASSES_TH} text-right`}>Nb matériels</th>
            <th className={CLASSES_TH}>Statut</th>
            <th className={CLASSES_TH}>Dernière mise à jour</th>
            <th className={CLASSES_TH}>
              <span className="sr-only">Action</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {demandes.map((demande) => (
            <tr key={demande.id} className="hover:bg-background">
              <td className={CLASSES_TD}>
                <span className="whitespace-nowrap font-mono text-small font-medium">
                  {demande.reference}
                </span>
              </td>
              <td className={`${CLASSES_TD} chiffres`}>{formaterDate(demande.dateCreation)}</td>
              <td className={`${CLASSES_TD} chiffres text-right`}>{demande.nombreArticles}</td>
              <td className={CLASSES_TD}>
                <BadgeStatut statut={demande.statut} />
              </td>
              <td className={`${CLASSES_TD} chiffres text-muted-foreground`}>
                {formaterDateRelative(demande.dateMiseAJour)}
              </td>
              <td className={`${CLASSES_TD} w-px text-right`}>
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    to={`/requests/${demande.id}`}
                    aria-label={`Voir la demande ${demande.reference}`}
                  >
                    Voir
                  </Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y md:hidden">
        {demandes.map((demande) => (
          <li key={demande.id}>
            <Link
              to={`/requests/${demande.id}`}
              className="flex min-h-touch items-center gap-3 px-4 py-3 hover:bg-background"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="whitespace-nowrap font-mono text-small font-medium">
                    {demande.reference}
                  </span>
                  <BadgeStatut statut={demande.statut} />
                </div>
                <span className="chiffres text-caption text-muted-foreground">
                  {formaterDate(demande.dateCreation)} ·{' '}
                  {pluriel(demande.nombreArticles, 'matériel')}
                </span>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Squelette de chargement de la liste (mêmes hauteurs de ligne). */
export function SqueletteListe({ lignes = 5 }) {
  return (
    <div aria-busy="true" aria-label="Chargement" className="divide-y">
      {Array.from({ length: lignes }, (_, index) => (
        <div key={index} className="flex h-[52px] items-center gap-6 px-5">
          <div className="h-4 w-36 animate-pulse rounded bg-muted" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          <div className="ml-auto h-5 w-20 animate-pulse rounded-full bg-muted" />
        </div>
      ))}
    </div>
  );
}
