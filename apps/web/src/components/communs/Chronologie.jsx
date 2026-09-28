/**
 * Chronologie d'une demande (design Timeline) : étapes faites, étape courante, étapes à venir.
 *
 * Tier : présentation. Construit l'affichage à partir de l'historique renvoyé par l'API
 * (trié chronologiquement) ; les étapes futures sont déduites du statut courant.
 */
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ETAPES_CHRONOLOGIE } from '@/lib/constantes';
import { formaterDateHeure, formaterDateRelative } from '@/lib/formatage';

/**
 * @typedef {Object} Etape
 * @property {string} titre
 * @property {string} meta
 * @property {'fait'|'courant'|'avenir'} etat
 * @property {string} [commentaire]
 */

/**
 * Étapes à afficher après l'historique, selon le statut actuel.
 * @param {string} statut
 * @param {string} dateDerniereEtape
 * @returns {Etape[]}
 */
function etapesSuivantes(statut, dateDerniereEtape) {
  if (statut === 'PENDING') {
    return [
      {
        titre: 'En attente de validation',
        meta: `depuis ${formaterDateRelative(dateDerniereEtape).replace('il y a ', '')}`,
        etat: 'courant',
      },
      { titre: 'Approuvée ou refusée', meta: '—', etat: 'avenir' },
      { titre: 'Matériel remis', meta: '—', etat: 'avenir' },
    ];
  }
  if (statut === 'APPROVED') {
    return [{ titre: 'Matériel remis', meta: 'à retirer au service IT', etat: 'courant' }];
  }
  return [];
}

/**
 * Transforme l'historique API en étapes affichables.
 * @param {import('@/fonctionnalites/demandes/api').Demande} demande
 * @returns {Etape[]}
 */
export function construireEtapes(demande) {
  const passees = demande.historique.map((evenement) => {
    const auteur = evenement.auteur ? `par ${evenement.auteur.nomComplet}` : 'Système';
    return {
      titre: ETAPES_CHRONOLOGIE[evenement.nouveauStatut] ?? evenement.nouveauStatut,
      meta: `${formaterDateHeure(evenement.date)} · ${auteur}`,
      etat: 'fait',
      commentaire: evenement.commentaire ?? undefined,
    };
  });
  const derniere = demande.historique.at(-1)?.date ?? demande.dateCreation;
  return [...passees, ...etapesSuivantes(demande.statut, derniere)];
}

/**
 * @param {{ demande: import('@/fonctionnalites/demandes/api').Demande }} props
 */
export function Chronologie({ demande }) {
  const etapes = construireEtapes(demande);
  return (
    <ol className="list-none">
      {etapes.map((etape, index) => (
        <li
          key={`${etape.titre}-${index}`}
          className={cn(
            'relative grid grid-cols-[20px_1fr] gap-3 pb-5 last:pb-0',
            // Trait vertical reliant les étapes (masqué sur la dernière)
            'before:absolute before:bottom-0.5 before:left-[9.5px] before:top-[22px] before:w-px before:bg-border last:before:hidden',
            etape.etat === 'avenir' && 'text-muted-foreground',
          )}
          aria-current={etape.etat === 'courant' ? 'step' : undefined}
        >
          <MarqueEtape etat={etape.etat} />
          <div>
            <div className="text-body font-medium">{etape.titre}</div>
            <div className="mt-0.5 text-caption text-muted-foreground">{etape.meta}</div>
            {etape.commentaire && (
              <p className="mt-1.5 rounded-md border bg-background px-2.5 py-1.5 text-small">
                « {etape.commentaire} »
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * Rond de l'étape : plein avec coche (fait), anneau primary (courant), pointillé (à venir).
 * @param {{ etat: 'fait'|'courant'|'avenir' }} props
 */
function MarqueEtape({ etat }) {
  if (etat === 'fait') {
    return (
      <span className="grid size-5 place-items-center rounded-full border border-foreground bg-foreground text-card">
        <Check className="size-3" strokeWidth={2.5} aria-hidden="true" />
      </span>
    );
  }
  if (etat === 'courant') {
    return (
      <span className="grid size-5 place-items-center rounded-full border-2 border-primary bg-card">
        <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
      </span>
    );
  }
  return <span className="size-5 rounded-full border border-dashed border-input bg-card" />;
}
