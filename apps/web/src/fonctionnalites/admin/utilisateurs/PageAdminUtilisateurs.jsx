/**
 * Gestion des comptes (/admin/users) : liste filtrable, création d'un collaborateur,
 * activation / désactivation, changement de rôle.
 *
 * Tier : présentation. Il n'y a pas d'inscription libre : c'est ici, et seulement
 * ici, que les accès sont attribués.
 */
import { useState } from 'react';
import { UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EnTetePage } from '@/components/communs/EnTetePage';
import { Carte } from '@/components/communs/Carte';
import { EtatVide } from '@/components/communs/EtatVide';
import { EtatErreur } from '@/components/communs/EtatErreur';
import { Pagination } from '@/components/communs/Pagination';
import { ChampRecherche } from '@/components/communs/ChampRecherche';
import { SqueletteListe } from '@/fonctionnalites/demandes/ListeDemandes';
import { pluriel } from '@/lib/formatage';
import { useUtilisateurs } from './hooks';
import { TableauUtilisateurs } from './TableauUtilisateurs';
import { DialogueCreationUtilisateur } from './DialogueCreationUtilisateur';
import { DialogueMotDePasseTemporaire } from './DialogueMotDePasseTemporaire';

export function PageAdminUtilisateurs() {
  const [recherche, setRecherche] = useState('');
  const [role, setRole] = useState('tous');
  const [statut, setStatut] = useState('tous');
  const [page, setPage] = useState(1);
  const [creationOuverte, setCreationOuverte] = useState(false);
  // Résultat de la création : { utilisateur, motDePasseTemporaire } — affiché une seule fois
  const [compteCree, setCompteCree] = useState(null);

  const requete = useUtilisateurs({
    page,
    search: recherche || undefined,
    role: role === 'tous' ? undefined : role,
    active: statut === 'tous' ? undefined : String(statut === 'actifs'),
  });

  /** Change un filtre et revient à la première page. */
  function filtrer(modifier) {
    return (valeur) => {
      modifier(valeur);
      setPage(1);
    };
  }

  return (
    <>
      <EnTetePage
        titre="Utilisateurs"
        description={
          requete.data
            ? `${pluriel(requete.data.meta.total, 'compte')}. Pas d'inscription libre : les accès sont attribués ici.`
            : ' '
        }
        actions={
          <Button onClick={() => setCreationOuverte(true)}>
            <UserPlus aria-hidden="true" /> Ajouter un collaborateur
          </Button>
        }
      />
      <Carte>
        <div className="flex flex-col gap-3 border-b px-4 py-3 md:flex-row md:px-5">
          <ChampRecherche
            id="recherche-utilisateurs"
            libelle="Rechercher un utilisateur"
            placeholder="Nom ou e-mail…"
            valeur={recherche}
            surChangement={filtrer(setRecherche)}
            className="md:w-[280px] [&_input]:h-11 md:[&_input]:h-9"
          />
          <Select value={role} onValueChange={filtrer(setRole)}>
            <SelectTrigger className="h-11 bg-card md:h-9 md:w-[220px]" aria-label="Rôle">
              <span className="truncate">
                <span className="text-muted-foreground">Rôle : </span>
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous</SelectItem>
              <SelectItem value="USER">Collaborateurs</SelectItem>
              <SelectItem value="ADMIN">Administrateurs</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statut} onValueChange={filtrer(setStatut)}>
            <SelectTrigger className="h-11 bg-card md:h-9 md:w-[200px]" aria-label="Statut">
              <span className="truncate">
                <span className="text-muted-foreground">Statut : </span>
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous</SelectItem>
              <SelectItem value="actifs">Actifs</SelectItem>
              <SelectItem value="inactifs">Désactivés</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {requete.isPending && <SqueletteListe />}
        {requete.isError && <EtatErreur erreur={requete.error} surReessayer={requete.refetch} />}
        {requete.isSuccess && requete.data.data.length === 0 && (
          <EtatVide
            icone={Users}
            titre="Aucun compte"
            description="Aucun compte ne correspond à ces filtres."
          />
        )}
        {requete.isSuccess && requete.data.data.length > 0 && (
          <>
            <TableauUtilisateurs utilisateurs={requete.data.data} />
            <Pagination meta={requete.data.meta} libelle="comptes" surChangement={setPage} />
          </>
        )}
      </Carte>

      <DialogueCreationUtilisateur
        ouvert={creationOuverte}
        surFermer={() => setCreationOuverte(false)}
        surCree={(resultat) => {
          setCreationOuverte(false);
          setCompteCree(resultat);
        }}
      />
      <DialogueMotDePasseTemporaire resultat={compteCree} surFermer={() => setCompteCree(null)} />
    </>
  );
}
