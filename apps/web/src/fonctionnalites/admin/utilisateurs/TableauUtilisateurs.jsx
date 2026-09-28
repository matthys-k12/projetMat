/**
 * Tableau des comptes : identité, rôle (modifiable), statut (interrupteur avec confirmation),
 * réinitialisation du mot de passe (nouveau mot de passe temporaire, affiché une seule fois).
 *
 * Tier : présentation. Sur sa propre ligne, l'admin ne peut ni se désactiver, ni changer
 * son rôle, ni réinitialiser son mot de passe : les contrôles sont désactivés (l'API le
 * refuse de toute façon, 409).
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar } from '@/components/communs/Avatar';
import { Pastille } from '@/components/communs/BadgeStatut';
import { formaterDate } from '@/lib/formatage';
import { useAuth } from '@/fonctionnalites/auth/useAuth';
import {
  useChangerRoleUtilisateur,
  useChangerStatutUtilisateur,
  useReinitialiserMotDePasse,
} from './hooks';
import { DialogueMotDePasseTemporaire } from './DialogueMotDePasseTemporaire';

const TH =
  'h-10 bg-background px-4 text-left text-caption font-medium text-muted-foreground first:pl-5 last:pr-5';
const TD = 'h-12 border-t px-4 first:pl-5 last:pr-5';

const EN_ATTENTE = {
  libelle: 'Mot de passe à définir',
  classes: 'bg-warning-subtle text-warning-text border-warning-border',
  pastille: 'bg-warning',
};

/**
 * @param {{ utilisateurs: import('./api').Utilisateur[] }} props
 */
export function TableauUtilisateurs({ utilisateurs }) {
  const { profil } = useAuth();
  const statut = useChangerStatutUtilisateur();
  const role = useChangerRoleUtilisateur();
  const reinitialisation = useReinitialiserMotDePasse();
  // Compte dont on demande confirmation avant de changer le statut
  const [aConfirmer, setAConfirmer] = useState(null);
  // Compte dont on demande confirmation avant de réinitialiser le mot de passe
  const [aReinitialiser, setAReinitialiser] = useState(null);
  // Résultat de la réinitialisation : mot de passe temporaire à afficher une seule fois
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState(null);

  async function confirmerStatut() {
    const { utilisateur, actif } = aConfirmer;
    try {
      await statut.mutateAsync({ id: utilisateur.id, actif });
      toast.success(`Compte de ${utilisateur.nomComplet} ${actif ? 'réactivé' : 'désactivé'}`);
    } catch (erreur) {
      toast.error(erreur.message);
    }
    setAConfirmer(null);
  }

  async function confirmerReinitialisation() {
    try {
      setNouveauMotDePasse(await reinitialisation.mutateAsync(aReinitialiser.id));
    } catch (erreur) {
      toast.error(erreur.message);
    }
    setAReinitialiser(null);
  }

  async function changerRole(utilisateur, nouveauRole) {
    try {
      await role.mutateAsync({ id: utilisateur.id, role: nouveauRole });
      toast.success(
        `${utilisateur.nomComplet} est maintenant ${nouveauRole === 'ADMIN' ? 'administrateur' : 'collaborateur'}`,
      );
    } catch (erreur) {
      toast.error(erreur.message);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr>
            <th className={TH}>Collaborateur</th>
            <th className={TH}>Rôle</th>
            <th className={TH}>Créé le</th>
            <th className={TH}>Statut</th>
            <th className={TH}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {utilisateurs.map((u) => {
            const moi = u.id === profil?.id;
            return (
              <tr key={u.id} className="hover:bg-background">
                <td className={TD}>
                  <span className="flex items-center gap-2.5">
                    <Avatar nom={u.nomComplet} />
                    <span className="flex flex-col">
                      <span className="font-medium">
                        {u.nomComplet}
                        {moi && <span className="font-normal text-muted-foreground"> (vous)</span>}
                      </span>
                      <span className="text-caption text-muted-foreground">{u.email}</span>
                    </span>
                    {u.doitChangerMotDePasse && <Pastille {...EN_ATTENTE} className="ml-2" />}
                  </span>
                </td>
                <td className={TD}>
                  <Select
                    value={u.role}
                    disabled={moi || role.isPending}
                    onValueChange={(r) => changerRole(u, r)}
                  >
                    <SelectTrigger
                      className="h-8 w-[160px] bg-card"
                      aria-label={`Rôle de ${u.nomComplet}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">Collaborateur</SelectItem>
                      <SelectItem value="ADMIN">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className={`${TD} chiffres text-muted-foreground`}>
                  {formaterDate(u.dateCreation)}
                </td>
                <td className={TD}>
                  <span className="flex items-center gap-2.5">
                    <Switch
                      checked={u.actif}
                      disabled={moi || statut.isPending}
                      onCheckedChange={(actif) => setAConfirmer({ utilisateur: u, actif })}
                      aria-label={`Compte actif : ${u.nomComplet}`}
                    />
                    <span className="text-small">{u.actif ? 'Actif' : 'Désactivé'}</span>
                  </span>
                </td>
                <td className={`${TD} text-right`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={moi || !u.actif || reinitialisation.isPending}
                    onClick={() => setAReinitialiser(u)}
                    aria-label={`Réinitialiser le mot de passe de ${u.nomComplet}`}
                  >
                    <KeyRound aria-hidden="true" /> Réinitialiser
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <AlertDialog open={Boolean(aConfirmer)} onOpenChange={(etat) => !etat && setAConfirmer(null)}>
        <AlertDialogContent className="max-w-[440px]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {aConfirmer?.actif ? 'Réactiver' : 'Désactiver'} le compte de{' '}
              {aConfirmer?.utilisateur.nomComplet} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {aConfirmer?.actif
                ? 'Le collaborateur pourra de nouveau se connecter.'
                : 'Le collaborateur ne pourra plus se connecter. Ses demandes et son historique sont conservés.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmerStatut}>
              {aConfirmer?.actif ? 'Réactiver le compte' : 'Désactiver le compte'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(aReinitialiser)}
        onOpenChange={(etat) => !etat && setAReinitialiser(null)}
      >
        <AlertDialogContent className="max-w-[440px]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Réinitialiser le mot de passe de {aReinitialiser?.nomComplet} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Son mot de passe actuel cessera de fonctionner. Un mot de passe temporaire vous
              sera affiché une seule fois ; il devra le remplacer à sa prochaine connexion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmerReinitialisation}>
              Réinitialiser le mot de passe
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DialogueMotDePasseTemporaire
        reinitialisation
        resultat={nouveauMotDePasse}
        surFermer={() => setNouveauMotDePasse(null)}
      />
    </div>
  );
}
