/**
 * Dialog de refus (design Ecran11AdminRefus) : motif obligatoire, erreur affichée à la validation.
 * Tier : présentation. React Hook Form + zod (même règle que l'API et la base).
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ChampFormulaire } from '@/components/communs/ChampFormulaire';
import { schemaRefus, COMMENTAIRE_MAX } from './schemas';
import { useRefuserDemande } from './hooks';

/**
 * @param {{ demande: import('@/fonctionnalites/demandes/api').Demande }} props
 */
export function DialogueRefus({ demande }) {
  const [ouvert, setOuvert] = useState(false);
  const refus = useRefuserDemande();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schemaRefus), defaultValues: { commentaire: '' } });

  /** @param {{ commentaire: string }} valeurs */
  async function soumettre(valeurs) {
    try {
      await refus.mutateAsync({ id: demande.id, commentaire: valeurs.commentaire });
      toast.success(`Demande ${demande.reference} refusée`);
      setOuvert(false);
      reset();
    } catch (erreur) {
      toast.error(erreur.message);
    }
  }

  return (
    <Dialog open={ouvert} onOpenChange={setOuvert}>
      <DialogTrigger asChild>
        <Button variant="dangerOutline" className="h-11 flex-1 sm:h-9 sm:flex-none">
          <X aria-hidden="true" /> Refuser
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[480px]">
        <form onSubmit={handleSubmit(soumettre)} noValidate className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Refuser la demande {demande.reference}</DialogTitle>
            <DialogDescription>
              {demande.demandeur?.nomComplet} recevra une notification avec le motif indiqué
              ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <ChampFormulaire
            id="motif-refus"
            libelle="Motif du refus"
            obligatoire
            erreur={errors.commentaire?.message}
          >
            {(attributs) => (
              <Textarea
                {...attributs}
                rows={4}
                maxLength={COMMENTAIRE_MAX}
                placeholder="Expliquez la raison du refus…"
                {...register('commentaire')}
              />
            )}
          </ChampFormulaire>
          <div className="chiffres -mt-2 text-right text-caption text-muted-foreground">
            {watch('commentaire').length} / {COMMENTAIRE_MAX}
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={refus.isPending}>
              {refus.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              Refuser la demande
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
