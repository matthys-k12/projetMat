/**
 * Tableau de bord du collaborateur (design Ecran02 / Mobile02) : salutation, 4 KPI,
 * 5 dernières demandes, raccourcis vers le catalogue et la nouvelle demande.
 * Tier : présentation.
 */
import { Link } from 'react-router-dom';
import { FileText, Package, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EnTetePage } from '@/components/communs/EnTetePage';
import { BandeIndicateurs, CarteIndicateur } from '@/components/communs/CarteIndicateur';
import { Carte, EnTeteCarte } from '@/components/communs/Carte';
import { EtatVide } from '@/components/communs/EtatVide';
import { EtatErreur } from '@/components/communs/EtatErreur';
import { useAuth } from '@/fonctionnalites/auth/useAuth';
import { useMesDemandes, useMesStatistiques } from '@/fonctionnalites/demandes/hooks';
import { ListeDemandes, SqueletteListe } from '@/fonctionnalites/demandes/ListeDemandes';
import { pluriel } from '@/lib/formatage';

export function PageTableauDeBord() {
  const { profil } = useAuth();
  const statistiques = useMesStatistiques();
  const dernieres = useMesDemandes({ page: 1 });
  const stats = statistiques.data;

  return (
    <>
      <EnTetePage
        titre={`Bonjour, ${profil?.prenom ?? ''}`}
        description="Voici l'état de vos demandes de matériel."
        actions={
          <>
            <Button variant="outline" asChild className="h-11 flex-1 sm:h-9 sm:flex-none">
              <Link to="/materials">
                <Package aria-hidden="true" /> Parcourir le catalogue
              </Link>
            </Button>
            <Button asChild className="h-11 flex-1 sm:h-9 sm:flex-none">
              <Link to="/requests/new">
                <Plus aria-hidden="true" /> Nouvelle demande
              </Link>
            </Button>
          </>
        }
      />

      <BandeIndicateurs>
        <CarteIndicateur libelle="Total" valeur={stats?.total ?? '–'} precision="demandes envoyées" />
        <CarteIndicateur
          libelle="En attente"
          pastille="bg-warning"
          valeur={stats?.enAttente ?? '–'}
          precision="en cours de traitement"
        />
        <CarteIndicateur
          libelle="Approuvées"
          pastille="bg-primary"
          valeur={stats ? stats.approuvees + stats.remises : '–'}
          precision={stats ? `dont ${pluriel(stats.remises, 'remise')}` : undefined}
        />
        <CarteIndicateur
          libelle="Refusées"
          pastille="bg-destructive"
          valeur={stats?.refusees ?? '–'}
          precision={stats ? `sur ${pluriel(stats.total, 'demande')}` : undefined}
        />
      </BandeIndicateurs>

      <Carte>
        <EnTeteCarte titre="Dernières demandes">
          <Link to="/requests" className="text-small text-primary hover:underline">
            Voir toutes les demandes
          </Link>
        </EnTeteCarte>
        <ContenuDernieres requete={dernieres} />
      </Carte>
    </>
  );
}

/**
 * Chargement / erreur / vide / liste des 5 dernières demandes.
 * @param {{ requete: ReturnType<typeof useMesDemandes> }} props
 */
function ContenuDernieres({ requete }) {
  if (requete.isPending) return <SqueletteListe />;
  if (requete.isError) return <EtatErreur erreur={requete.error} surReessayer={requete.refetch} />;
  if (requete.data.data.length === 0) {
    return (
      <EtatVide
        icone={FileText}
        titre="Aucune demande pour le moment"
        description="Vos demandes de matériel apparaîtront ici."
        actions={
          <Button asChild>
            <Link to="/requests/new">
              <Plus aria-hidden="true" /> Nouvelle demande
            </Link>
          </Button>
        }
      />
    );
  }
  return <ListeDemandes demandes={requete.data.data.slice(0, 5)} />;
}
