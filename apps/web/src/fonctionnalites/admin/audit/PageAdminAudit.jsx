/**
 * Journal d'audit (design Ecran15) : action en badge neutre, utilisateur, ressource, date ;
 * filtres par type d'action et de ressource. Lecture seule.
 * Tier : présentation.
 */
import { useState } from 'react';
import { History } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EnTetePage } from '@/components/communs/EnTetePage';
import { Carte } from '@/components/communs/Carte';
import { Avatar } from '@/components/communs/Avatar';
import { EtatVide } from '@/components/communs/EtatVide';
import { EtatErreur } from '@/components/communs/EtatErreur';
import { Pagination } from '@/components/communs/Pagination';
import { SqueletteListe } from '@/fonctionnalites/demandes/ListeDemandes';
import { ACTIONS_AUDIT, TYPES_ENTITE } from '@/lib/constantes';
import { formaterDateHeure } from '@/lib/formatage';
import { useAudit } from './hooks';

const TH =
  'h-10 bg-background px-4 text-left text-caption font-medium text-muted-foreground first:pl-5 last:pr-5';
const TD = 'h-12 border-t px-4 first:pl-5 last:pr-5';

/**
 * Libellé lisible de la ressource : référence de demande ou nom, sinon type.
 * @param {{ typeEntite: string, metadonnees: Record<string, any> }} ligne
 */
function libelleRessource(ligne) {
  return (
    ligne.metadonnees?.reference ??
    ligne.metadonnees?.nom ??
    TYPES_ENTITE[ligne.typeEntite] ??
    ligne.typeEntite
  );
}

export function PageAdminAudit() {
  const [action, setAction] = useState('toutes');
  const [type, setType] = useState('tous');
  const [page, setPage] = useState(1);
  const requete = useAudit({
    page,
    limit: 20,
    action: action === 'toutes' ? undefined : action,
    entityType: type === 'tous' ? undefined : type,
  });

  return (
    <>
      <EnTetePage
        titre="Audit"
        description="Historique horodaté de toutes les actions. Lecture seule."
      />
      <Carte className="overflow-x-auto">
        <div className="flex flex-col gap-3 border-b px-4 py-3 md:flex-row md:px-5">
          <Select
            value={action}
            onValueChange={(v) => {
              setAction(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-11 bg-card md:h-9 md:w-[280px]" aria-label="Type d'action">
              <span className="truncate">
                <span className="text-muted-foreground">Type d&apos;action : </span>
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="toutes">Toutes</SelectItem>
              {Object.entries(ACTIONS_AUDIT).map(([code, libelle]) => (
                <SelectItem key={code} value={code}>
                  {libelle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={type}
            onValueChange={(v) => {
              setType(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-11 bg-card md:h-9 md:w-[220px]" aria-label="Ressource">
              <span className="truncate">
                <span className="text-muted-foreground">Ressource : </span>
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Toutes</SelectItem>
              {Object.entries(TYPES_ENTITE).map(([code, libelle]) => (
                <SelectItem key={code} value={code}>
                  {libelle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {requete.isPending && <SqueletteListe lignes={8} />}
        {requete.isError && <EtatErreur erreur={requete.error} surReessayer={requete.refetch} />}
        {requete.isSuccess && requete.data.data.length === 0 && (
          <EtatVide
            icone={History}
            titre="Aucune action"
            description="Aucune action ne correspond à ces filtres."
          />
        )}
        {requete.isSuccess && requete.data.data.length > 0 && (
          <>
            <table className="w-full min-w-[720px]">
              <thead>
                <tr>
                  <th className={TH}>Action</th>
                  <th className={TH}>Utilisateur</th>
                  <th className={TH}>Ressource</th>
                  <th className={TH}>Date</th>
                </tr>
              </thead>
              <tbody>
                {requete.data.data.map((ligne) => (
                  <tr key={ligne.id} className="hover:bg-background">
                    <td className={TD}>
                      {/* Badge neutre : une action n'est pas un statut, pas de couleur sémantique */}
                      <span className="inline-flex h-[22px] items-center rounded-full border bg-muted px-2 text-caption font-medium text-muted-strong">
                        {ACTIONS_AUDIT[ligne.action] ?? ligne.action}
                      </span>
                    </td>
                    <td className={TD}>
                      <span className="flex items-center gap-2.5">
                        <Avatar nom={ligne.acteur?.nomComplet ?? 'Système'} />
                        {ligne.acteur?.nomComplet ?? 'Système'}
                      </span>
                    </td>
                    <td className={`${TD} font-mono text-small`}>{libelleRessource(ligne)}</td>
                    <td className={`${TD} chiffres text-muted-foreground`}>
                      {formaterDateHeure(ligne.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination meta={requete.data.meta} libelle="actions" surChangement={setPage} />
          </>
        )}
      </Carte>
    </>
  );
}
