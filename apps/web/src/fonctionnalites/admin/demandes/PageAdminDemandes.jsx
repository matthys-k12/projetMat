/**
 * Gestion des demandes (design Ecran10) : recherche (référence ou demandeur),
 * filtres statut / période, tableau dense avec avatars, pagination.
 * Tier : présentation.
 */
import { useSearchParams } from 'react-router-dom';
import { subDays, format } from 'date-fns';
import { ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EnTetePage } from '@/components/communs/EnTetePage';
import { Carte } from '@/components/communs/Carte';
import { EtatVide } from '@/components/communs/EtatVide';
import { EtatErreur } from '@/components/communs/EtatErreur';
import { Pagination } from '@/components/communs/Pagination';
import { ChampRecherche } from '@/components/communs/ChampRecherche';
import { SqueletteListe } from '@/fonctionnalites/demandes/ListeDemandes';
import { STATUTS_DEMANDE } from '@/lib/constantes';
import { useDemandesAdmin } from './hooks';
import { TableauDemandesAdmin } from './TableauDemandesAdmin';

const PERIODES = [
  { valeur: 'toutes', libelle: 'Toutes les dates', jours: null },
  { valeur: '7', libelle: '7 derniers jours', jours: 7 },
  { valeur: '30', libelle: '30 derniers jours', jours: 30 },
  { valeur: '90', libelle: '90 derniers jours', jours: 90 },
];

export function PageAdminDemandes() {
  const [parametresUrl, setParametresUrl] = useSearchParams();
  const statut = parametresUrl.get('statut') ?? 'tous';
  const periode = parametresUrl.get('periode') ?? 'toutes';
  const recherche = parametresUrl.get('search') ?? '';
  const page = Number(parametresUrl.get('page') ?? '1');

  const jours = PERIODES.find((p) => p.valeur === periode)?.jours;
  const requete = useDemandesAdmin({
    page,
    limit: 15,
    status: statut === 'tous' ? undefined : statut,
    search: recherche || undefined,
    from: jours ? format(subDays(new Date(), jours), 'yyyy-MM-dd') : undefined,
  });

  /** @param {Record<string, string>} modifications */
  function modifier(modifications) {
    const suivants = { statut, periode, search: recherche, page: '1', ...modifications };
    const parDefaut = { statut: 'tous', periode: 'toutes', search: '', page: '1' };
    const nettoyes = Object.entries(suivants).filter(([cle, valeur]) => valeur !== parDefaut[cle]);
    setParametresUrl(Object.fromEntries(nettoyes));
  }

  return (
    <>
      <EnTetePage
        titre="Demandes"
        description="Approuvez, refusez ou marquez comme remises les demandes des collaborateurs."
      />
      <Carte>
        <div className="flex flex-col gap-3 border-b px-4 py-3 md:flex-row md:flex-wrap md:items-center md:justify-between md:px-5">
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
            <ChampRecherche
              id="recherche-demandes"
              libelle="Rechercher par référence ou demandeur"
              placeholder="Référence ou demandeur…"
              valeur={recherche}
              surChangement={(search) => modifier({ search })}
              className="md:w-[260px] [&_input]:h-11 md:[&_input]:h-9"
            />
            <Select value={statut} onValueChange={(valeur) => modifier({ statut: valeur })}>
              <SelectTrigger className="h-11 bg-card md:h-9 md:w-[200px]" aria-label="Statut">
                <span className="truncate">
                  <span className="text-muted-foreground">Statut : </span>
                  <SelectValue />
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous</SelectItem>
                {Object.entries(STATUTS_DEMANDE).map(([code, style]) => (
                  <SelectItem key={code} value={code}>
                    {style.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={periode} onValueChange={(valeur) => modifier({ periode: valeur })}>
              <SelectTrigger className="h-11 bg-card md:h-9 md:w-[240px]" aria-label="Période">
                <span className="truncate">
                  <span className="text-muted-foreground">Période : </span>
                  <SelectValue />
                </span>
              </SelectTrigger>
              <SelectContent>
                {PERIODES.map((p) => (
                  <SelectItem key={p.valeur} value={p.valeur}>
                    {p.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setParametresUrl({})}>
            Réinitialiser
          </Button>
        </div>

        {requete.isPending && <SqueletteListe lignes={8} />}
        {requete.isError && <EtatErreur erreur={requete.error} surReessayer={requete.refetch} />}
        {requete.isSuccess && requete.data.data.length === 0 && (
          <EtatVide icone={ClipboardList} titre="Aucune demande" description="Aucune demande ne correspond à ces filtres." />
        )}
        {requete.isSuccess && requete.data.data.length > 0 && (
          <>
            <TableauDemandesAdmin demandes={requete.data.data} />
            <Pagination meta={requete.data.meta} libelle="demandes" surChangement={(p) => modifier({ page: String(p) })} />
          </>
        )}
      </Carte>
    </>
  );
}

