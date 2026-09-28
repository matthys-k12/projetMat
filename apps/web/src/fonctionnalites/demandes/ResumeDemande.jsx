/**
 * Résumé de la nouvelle demande : liste des articles, totaux, erreurs, bouton d'envoi.
 * Desktop : carte collante à droite (design Ecran05) ; mobile : barre d'envoi collée en bas (Mobile05).
 * Tier : présentation.
 */
import { CircleAlert, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alerte } from '@/components/communs/Carte';
import { cn } from '@/lib/utils';
import { pluriel } from '@/lib/formatage';

/**
 * @param {{
 *   lignes: import('./ContextePanier').LignePanier[],
 *   nombreErreurs: number,
 *   envoiEnCours: boolean,
 *   surEnvoyer: () => void,
 * }} props
 */
export function ResumeDemande({ lignes, nombreErreurs, envoiEnCours, surEnvoyer }) {
  const choisies = lignes.filter((ligne) => ligne.materiel);
  const totalArticles = choisies.reduce((somme, ligne) => somme + ligne.quantite, 0);
  const bloque = envoiEnCours || nombreErreurs > 0 || choisies.length === 0;

  const boutonEnvoi = (
    <Button className="h-11 w-full lg:h-9" disabled={bloque} onClick={surEnvoyer}>
      {envoiEnCours && <Loader2 className="animate-spin" aria-hidden="true" />}
      {envoiEnCours ? 'Envoi…' : 'Envoyer la demande'}
    </Button>
  );
  const alerte = nombreErreurs > 0 && (
    <Alerte icone={CircleAlert}>{pluriel(nombreErreurs, 'erreur')} à corriger avant l&apos;envoi.</Alerte>
  );

  return (
    <>
      <aside className="sticky top-24 hidden rounded-lg border bg-card shadow-sm lg:block">
        <h2 className="border-b px-5 py-4 text-h3">Résumé</h2>
        <ul className="px-5 py-2">
          {choisies.map((ligne) => {
            const depasse = ligne.quantite > ligne.materiel.quantiteDisponible;
            return (
              <li key={ligne.cle} className="flex justify-between gap-3 py-2 text-small">
                <span className="min-w-0">{ligne.materiel.nom}</span>
                <span className={cn('chiffres', depasse && 'font-medium text-destructive-text')}>× {ligne.quantite}</span>
              </li>
            );
          })}
          {choisies.length === 0 && <li className="py-2 text-small text-muted-foreground">Aucun matériel choisi.</li>}
        </ul>
        <div className="flex flex-col gap-3 border-t p-5">
          <div className="flex justify-between text-small">
            <span className="text-muted-foreground">Matériels différents</span>
            <span className="chiffres">{choisies.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Total articles</span>
            <span className="chiffres font-semibold">{totalArticles}</span>
          </div>
          {alerte}
          {boutonEnvoi}
          <p className="text-center text-caption text-muted-foreground">
            Un administrateur traitera votre demande sous 48 h ouvrées.
          </p>
        </div>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-10 flex flex-col gap-2 border-t bg-card p-4 lg:hidden">
        {alerte}
        <div className="flex items-center justify-between text-small">
          <span className="text-muted-foreground">{pluriel(choisies.length, 'matériel')}</span>
          <span className="chiffres font-semibold">{pluriel(totalArticles, 'article')}</span>
        </div>
        {boutonEnvoi}
      </div>
    </>
  );
}
