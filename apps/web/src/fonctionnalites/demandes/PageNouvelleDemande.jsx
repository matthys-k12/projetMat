/**
 * Création d'une demande (design Ecran05 / Mobile05).
 *
 * Tier : présentation. Les lignes viennent du panier (ContextePanier). Le stock
 * affiché est relu dans le catalogue à jour, pas dans le panier (il a pu changer).
 * La validation (schemas.js) est la même que côté API ; l'API et la base
 * revérifient tout de toute façon.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { EnTetePage } from '@/components/communs/EnTetePage';
import { Carte, EnTeteCarte } from '@/components/communs/Carte';
import { EtatErreur } from '@/components/communs/EtatErreur';
import { ChampFormulaire } from '@/components/communs/ChampFormulaire';
import { useCatalogueComplet } from '@/fonctionnalites/materiels/hooks';
import { pluriel } from '@/lib/formatage';
import { usePanier } from './ContextePanier';
import { useCreerDemande } from './hooks';
import { LigneArticle } from './LigneArticle';
import { ResumeDemande } from './ResumeDemande';
import { MOTIF_MAX, extraireErreurs, schemaNouvelleDemande } from './schemas';

export function PageNouvelleDemande() {
  const naviguer = useNavigate();
  const panier = usePanier();
  const catalogue = useCatalogueComplet();
  const creation = useCreerDemande();
  const [motif, setMotif] = useState('');
  const [envoiTente, setEnvoiTente] = useState(false);

  // Stock à jour : on remplace celui mémorisé dans le panier par celui du catalogue
  const lignes = panier.lignes.map((ligne) => {
    const aJour = catalogue.data?.find((m) => m.id === ligne.materiel?.id);
    if (!aJour) return ligne;
    return {
      ...ligne,
      materiel: { ...ligne.materiel, quantiteDisponible: aJour.quantiteDisponible },
    };
  });

  const validation = schemaNouvelleDemande.safeParse({
    motif,
    lignes: lignes.map((l) => ({
      materielId: l.materiel?.id ?? '',
      quantite: l.quantite,
      quantiteDisponible: l.materiel?.quantiteDisponible ?? 0,
    })),
  });
  const erreurs = extraireErreurs(validation.error);
  // Les erreurs de stock s'affichent tout de suite ; celles du motif après la première tentative
  const nombreErreurs =
    Object.keys(erreurs.parLigne).length + (envoiTente && erreurs.motif ? 1 : 0);

  async function envoyer() {
    setEnvoiTente(true);
    if (!validation.success) return;
    try {
      const demande = await creation.mutateAsync({
        motif: validation.data.motif,
        articles: validation.data.lignes.map((l) => ({
          materielId: l.materielId,
          quantite: l.quantite,
        })),
      });
      toast.success(`Demande ${demande.reference} envoyée`);
      panier.vider();
      naviguer(`/requests/${demande.id}`);
    } catch (erreur) {
      toast.error(erreur.message);
    }
  }

  if (catalogue.isError) {
    return (
      <Carte>
        <EtatErreur erreur={catalogue.error} surReessayer={catalogue.refetch} />
      </Carte>
    );
  }

  return (
    <>
      <EnTetePage
        titre="Nouvelle demande"
        description="Ajoutez un ou plusieurs matériels et expliquez votre besoin."
      />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <Carte>
            <EnTeteCarte titre="Matériels">
              <span className="text-small text-muted-foreground">
                {pluriel(lignes.length, 'ligne')}
              </span>
            </EnTeteCarte>
            {lignes.length === 0 && (
              <p className="px-5 py-6 text-muted-foreground">
                Aucun matériel pour l&apos;instant. Ajoutez-en depuis le catalogue ou ci-dessous.
              </p>
            )}
            {lignes.map((ligne, index) => (
              <LigneArticle
                key={ligne.cle}
                ligne={ligne}
                index={index}
                catalogue={catalogue.data ?? []}
                idsDejaChoisis={lignes.map((l) => l.materiel?.id).filter(Boolean)}
                erreur={erreurs.parLigne[index]}
                surChangerMateriel={(m) =>
                  panier.modifier(ligne.cle, {
                    materiel: {
                      id: m.id,
                      nom: m.nom,
                      categorie: m.categorie?.nom ?? null,
                      quantiteDisponible: m.quantiteDisponible,
                    },
                  })
                }
                surChangerQuantite={(quantite) => panier.modifier(ligne.cle, { quantite })}
                surSupprimer={() => panier.supprimer(ligne.cle)}
              />
            ))}
            <div className="border-t px-5 py-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-primary"
                onClick={panier.ajouterLigneVide}
              >
                <Plus aria-hidden="true" /> Ajouter un matériel
              </Button>
            </div>
          </Carte>

          <Carte className="p-5">
            <ChampFormulaire
              id="motif"
              libelle="Motif de la demande"
              obligatoire
              erreur={envoiTente ? erreurs.motif : undefined}
              aide="Soyez précis : cela accélère la validation."
            >
              {(attributs) => (
                <Textarea
                  {...attributs}
                  rows={4}
                  maxLength={MOTIF_MAX}
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                />
              )}
            </ChampFormulaire>
            <div
              className="chiffres mt-1 text-right text-caption text-muted-foreground"
              aria-live="polite"
            >
              {motif.length} / {MOTIF_MAX}
            </div>
          </Carte>
        </div>

        <ResumeDemande
          lignes={lignes}
          nombreErreurs={nombreErreurs}
          envoiEnCours={creation.isPending}
          surEnvoyer={envoyer}
        />
      </div>
    </>
  );
}
