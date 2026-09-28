/**
 * Tableau dense des demandes (admin) : référence, demandeur avec avatar, date, articles,
 * statut, « Examiner ». Sous md : cartes-liens.
 * Tier : présentation.
 */
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/communs/Avatar';
import { BadgeStatut } from '@/components/communs/BadgeStatut';
import { formaterDate, pluriel } from '@/lib/formatage';

const TH =
  'h-10 bg-background px-4 text-left text-caption font-medium text-muted-foreground first:pl-5 last:pr-5';
const TD = 'h-12 border-t px-4 first:pl-5 last:pr-5';

/**
 * @param {{ demandes: import('@/fonctionnalites/demandes/api').Demande[] }} props
 */
export function TableauDemandesAdmin({ demandes }) {
  return (
    <>
      <table className="hidden w-full md:table">
        <thead>
          <tr>
            <th className={TH}>Référence</th>
            <th className={TH}>Demandeur</th>
            <th className={TH}>Date</th>
            <th className={`${TH} text-right`}>Articles</th>
            <th className={TH}>Statut</th>
            <th className={TH}>
              <span className="sr-only">Action</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {demandes.map((demande) => (
            <tr key={demande.id} className="hover:bg-background">
              <td className={TD}>
                <span className="whitespace-nowrap font-mono text-small font-medium">
                  {demande.reference}
                </span>
              </td>
              <td className={TD}>
                <span className="flex items-center gap-2.5">
                  <Avatar nom={demande.demandeur?.nomComplet ?? '?'} />
                  <span className="flex flex-col">
                    <span className="font-medium">{demande.demandeur?.nomComplet}</span>
                    <span className="text-caption text-muted-foreground">
                      {demande.demandeur?.email}
                    </span>
                  </span>
                </span>
              </td>
              <td className={`${TD} chiffres`}>{formaterDate(demande.dateCreation)}</td>
              <td className={`${TD} chiffres text-right`}>{demande.nombreArticles}</td>
              <td className={TD}>
                <BadgeStatut statut={demande.statut} />
              </td>
              <td className={`${TD} w-px text-right`}>
                <Button variant="outline" size="sm" asChild>
                  <Link
                    to={`/admin/requests/${demande.id}`}
                    aria-label={`Examiner ${demande.reference}`}
                  >
                    Examiner
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
              to={`/admin/requests/${demande.id}`}
              className="flex min-h-touch items-center gap-3 px-4 py-3"
            >
              <Avatar nom={demande.demandeur?.nomComplet ?? '?'} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="whitespace-nowrap font-mono text-small font-medium">
                    {demande.reference}
                  </span>
                  <BadgeStatut statut={demande.statut} />
                </div>
                <span className="text-caption text-muted-foreground">
                  {demande.demandeur?.nomComplet} · {formaterDate(demande.dateCreation)} ·{' '}
                  {pluriel(demande.nombreArticles, 'article')}
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
