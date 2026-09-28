/**
 * Formulaire matériel, création et modification (design Ecran13) : trois sections
 * (informations, stock, statut), erreurs inline + résumé, zone d'image.
 * Tier : présentation. React Hook Form + zod ; l'API revalide tout.
 */
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, CircleAlert, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EnTetePage } from '@/components/communs/EnTetePage';
import { Alerte, Carte } from '@/components/communs/Carte';
import { ChampFormulaire } from '@/components/communs/ChampFormulaire';
import { EtatErreur } from '@/components/communs/EtatErreur';
import { useCategoriesAdmin } from '@/fonctionnalites/admin/categories/hooks';
import { pluriel } from '@/lib/formatage';
import { useCreerMateriel, useMaterielAdmin, useModifierMateriel } from './hooks';
import { schemaMateriel, VALEURS_VIDES } from './schemas';
import { ZoneImage } from './ZoneImage';

/**
 * Section du formulaire : titre et explication à gauche, champs à droite.
 * @param {{ titre: string, description?: string, children: import('react').ReactNode }} props
 */
function Section({ titre, description, children }) {
  return (
    <div className="grid gap-4 border-b p-5 last:border-b-0 md:grid-cols-[220px_1fr] md:gap-6">
      <div>
        <h2 className="text-h3">{titre}</h2>
        {description && <p className="mt-1 text-small text-muted-foreground">{description}</p>}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

export function PageFormulaireMateriel() {
  const { id } = useParams();
  const edition = Boolean(id);
  const existant = useMaterielAdmin(id);

  if (edition && existant.isPending) return <div aria-busy="true" className="h-96 animate-pulse rounded-lg bg-muted" />;
  if (edition && existant.isError) {
    return <Carte><EtatErreur titre="Matériel introuvable" erreur={existant.error} surReessayer={existant.refetch} /></Carte>;
  }
  return <Formulaire materiel={existant.data} />;
}

/**
 * @param {{ materiel?: import('@/fonctionnalites/materiels/api').Materiel }} props
 */
function Formulaire({ materiel }) {
  const naviguer = useNavigate();
  const { data: categories = [] } = useCategoriesAdmin();
  const creation = useCreerMateriel();
  const modification = useModifierMateriel();

  const { register, control, handleSubmit, watch, reset, formState: { errors, isSubmitted } } = useForm({
    resolver: zodResolver(schemaMateriel),
    defaultValues: VALEURS_VIDES,
  });

  useEffect(() => {
    if (!materiel) return;
    reset({
      nom: materiel.nom,
      categorieId: materiel.categorie?.id ?? '',
      description: materiel.description ?? '',
      quantiteTotale: materiel.quantiteTotale,
      quantiteDisponible: materiel.quantiteDisponible,
      stockMinimum: materiel.stockMinimum,
      actif: materiel.actif,
    });
  }, [materiel, reset]);

  async function soumettre(valeurs) {
    const corps = { ...valeurs, description: valeurs.description || null };
    try {
      const resultat = materiel
        ? await modification.mutateAsync({ id: materiel.id, corps })
        : await creation.mutateAsync(corps);
      toast.success(`${resultat.nom} ${materiel ? 'modifié' : 'créé'}`);
      naviguer(materiel ? '/admin/materials' : `/admin/materials/${resultat.id}/edit`);
    } catch (erreur) {
      toast.error(erreur.message);
    }
  }

  const nombreErreurs = Object.keys(errors).length;
  const enCours = creation.isPending || modification.isPending;
  const seuil = watch('stockMinimum');

  return (
    <>
      <Link to="/admin/materials" className="flex items-center gap-1.5 self-start text-small text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" /> Matériels
      </Link>
      <EnTetePage
        titre={materiel ? `Modifier ${materiel.nom}` : 'Ajouter un matériel'}
        description="Le matériel sera visible dans le catalogue dès qu'il est actif."
      />
      {isSubmitted && nombreErreurs > 0 && (
        <Alerte icone={CircleAlert} className="max-w-[880px]">
          <b className="font-medium">{pluriel(nombreErreurs, 'champ')} à corriger.</b> Vérifiez les champs signalés ci-dessous.
        </Alerte>
      )}

      <Carte as="form" className="max-w-[880px]" noValidate onSubmit={handleSubmit(soumettre)}>
        <Section titre="Informations" description="Nom et description affichés aux collaborateurs.">
          <ChampFormulaire id="nom" libelle="Nom" obligatoire erreur={errors.nom?.message}>
            {(a) => <Input {...a} {...register('nom')} />}
          </ChampFormulaire>
          <ChampFormulaire id="categorie" libelle="Catégorie" obligatoire erreur={errors.categorieId?.message}>
            {(a) => (
              <Controller
                control={control}
                name="categorieId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger {...a} className="bg-card">
                      <SelectValue placeholder="Choisir une catégorie…" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nom}{c.actif ? '' : ' (inactive)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </ChampFormulaire>
          <ChampFormulaire id="description" libelle="Description" erreur={errors.description?.message}>
            {(a) => <Textarea {...a} rows={3} maxLength={2000} {...register('description')} />}
          </ChampFormulaire>
          <ZoneImage materiel={materiel} />
        </Section>

        <Section titre="Stock" description="Une alerte est levée sous le seuil.">
          <div className="grid gap-4 sm:grid-cols-3">
            <ChampFormulaire id="quantiteTotale" libelle="Quantité totale" erreur={errors.quantiteTotale?.message}>
              {(a) => <Input {...a} type="number" min={0} className="chiffres" {...register('quantiteTotale')} />}
            </ChampFormulaire>
            <ChampFormulaire id="quantiteDisponible" libelle="Quantité disponible" erreur={errors.quantiteDisponible?.message}>
              {(a) => <Input {...a} type="number" min={0} className="chiffres" {...register('quantiteDisponible')} />}
            </ChampFormulaire>
            <ChampFormulaire id="stockMinimum" libelle="Seuil d'alerte" erreur={errors.stockMinimum?.message} aide={`Stock faible à partir de ${seuil}.`}>
              {(a) => <Input {...a} type="number" min={0} className="chiffres" {...register('stockMinimum')} />}
            </ChampFormulaire>
          </div>
        </Section>

        <Section titre="Statut">
          <Controller
            control={control}
            name="actif"
            render={({ field }) => (
              <div className="flex items-start gap-3">
                <Switch id="actif" checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" aria-describedby="actif-aide" />
                <div>
                  <label htmlFor="actif" className="text-label">{field.value ? 'Actif' : 'Inactif'}</label>
                  <div id="actif-aide" className="text-small text-muted-foreground">
                    Visible dans le catalogue et disponible à la demande.
                  </div>
                </div>
              </div>
            )}
          />
        </Section>

        <div className="flex justify-end gap-2 border-t px-5 py-3">
          <Button type="button" variant="outline" onClick={() => naviguer('/admin/materials')}>
            Annuler
          </Button>
          <Button type="submit" disabled={enCours}>
            {enCours && <Loader2 className="animate-spin" aria-hidden="true" />}
            Enregistrer le matériel
          </Button>
        </div>
      </Carte>
    </>
  );
}
