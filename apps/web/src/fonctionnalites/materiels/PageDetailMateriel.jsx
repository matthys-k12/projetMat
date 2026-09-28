/**
 * Fiche d'un matériel (design Ecran04) : visuel 4:3, catégorie, nom, badge, stock,
 * description, sélecteur de quantité et « Ajouter à la demande » (alimente le panier).
 * Tier : présentation.
 */
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Carte } from '@/components/communs/Carte';
import { EtatErreur } from '@/components/communs/EtatErreur';
import { BadgeDisponibilite } from '@/components/communs/BadgeDisponibilite';
import { SelecteurQuantite } from '@/components/communs/SelecteurQuantite';
import { VisuelMateriel } from '@/components/communs/VisuelMateriel';
import { usePanier } from '@/fonctionnalites/demandes/ContextePanier';
import { useMateriel } from './hooks';

export function PageDetailMateriel() {
  const { id } = useParams();
  const requete = useMateriel(id);

  return (
    <>
      <Link to="/materials" className="flex items-center gap-1.5 self-start text-small text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" /> Retour au catalogue
      </Link>
      {requete.isPending && <SqueletteDetail />}
      {requete.isError && (
        <Carte>
          <EtatErreur titre="Matériel introuvable" erreur={requete.error} surReessayer={requete.refetch} />
        </Carte>
      )}
      {requete.isSuccess && <ContenuDetail materiel={requete.data} />}
    </>
  );
}

/**
 * @param {{ materiel: import('./api').Materiel }} props
 */
function ContenuDetail({ materiel }) {
  const { ajouter } = usePanier();
  const naviguer = useNavigate();
  const [quantite, setQuantite] = useState(1);
  const epuise = materiel.quantiteDisponible === 0;

  function ajouterALaDemande() {
    ajouter(
      {
        id: materiel.id,
        nom: materiel.nom,
        categorie: materiel.categorie?.nom ?? null,
        quantiteDisponible: materiel.quantiteDisponible,
      },
      quantite,
    );
    toast.success(`${materiel.nom} ajouté à la demande`, {
      action: { label: 'Voir la demande', onClick: () => naviguer('/requests/new') },
    });
  }

  return (
    <div className="grid items-start gap-6 md:grid-cols-2 lg:gap-8">
      <Carte className="overflow-hidden">
        <VisuelMateriel nom={materiel.nom} categorie={materiel.categorie?.nom} imageUrl={materiel.imageUrl} />
      </Carte>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-small text-muted-foreground">{materiel.categorie?.nom}</span>
          <h1 className="text-h1">{materiel.nom}</h1>
          <div className="flex items-center gap-3">
            <BadgeDisponibilite disponibilite={materiel.disponibilite} />
            <span className="chiffres text-small text-muted-foreground">
              <b className="font-medium text-foreground">{materiel.quantiteDisponible}</b> disponible
              {materiel.quantiteDisponible > 1 ? 's' : ''} sur {materiel.quantiteTotale}
            </span>
          </div>
        </div>

        {materiel.description && <p>{materiel.description}</p>}
        <hr />

        <div className="flex flex-col gap-2">
          <span id="libelle-quantite" className="text-label">
            Quantité
          </span>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SelecteurQuantite
              valeur={quantite}
              surChangement={setQuantite}
              max={materiel.quantiteDisponible}
              idLibelle="libelle-quantite"
              grand
            />
            <Button className="h-11 flex-1" disabled={epuise} onClick={ajouterALaDemande}>
              <Plus aria-hidden="true" /> Ajouter à la demande
            </Button>
          </div>
          <span className="text-caption text-muted-foreground">
            {epuise
              ? 'Ce matériel est momentanément indisponible.'
              : `Maximum ${materiel.quantiteDisponible}, selon le stock disponible.`}
          </span>
        </div>
      </div>
    </div>
  );
}

function SqueletteDetail() {
  return (
    <div aria-busy="true" aria-label="Chargement" className="grid gap-8 md:grid-cols-2">
      <div className="aspect-[4/3] animate-pulse rounded-lg bg-muted" />
      <div className="flex flex-col gap-3">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-20 w-full animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
