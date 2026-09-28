/**
 * Tableau des comptes : identité, rôle (modifiable), statut (interrupteur avec confirmation).
 *
 * Tier : présentation. Sur sa propre ligne, l'admin ne peut ni se désactiver ni changer
 * son rôle : les contrôles sont désactivés (l'API le refuse de toute façon, 409).
 */
import { useState } from 'react';
import { toast } from 'sonner';
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
import { useChangerRoleUtilisateur, useChangerStatutUtilisateur } from './hooks';

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
  // Compte dont on demande confirmation avant de changer le statut
  const [aConfirmer, setAConfirmer] = useState(null);

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
      <table className="w-full min-w-[760px]">
        <thead>
          <tr>
            <th className={TH}>Collaborateur</th>
            <th className={TH}>Rôle</th>
            <th className={TH}>Créé le</th>
            <th className={TH}>Statut</th>
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
    </div>
  );
}
