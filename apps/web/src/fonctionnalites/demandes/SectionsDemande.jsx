/**
 * Blocs réutilisés par le détail d'une demande (collaborateur et admin) :
 * tableau des matériels, note de l'administrateur, carte « Suivi ».
 * Tier : présentation.
 */
import { CircleAlert } from 'lucide-react';
import { Carte, CorpsCarte, EnTeteCarte } from '@/components/communs/Carte';
import { Avatar } from '@/components/communs/Avatar';
import { Chronologie } from '@/components/communs/Chronologie';
import { VisuelMateriel } from '@/components/communs/VisuelMateriel';
import { formaterDateHeure, pluriel } from '@/lib/formatage';
import { cn } from '@/lib/utils';

/**
 * Tableau des matériels demandés. avecStock : colonne « Stock actuel » (admin),
 * en rouge si insuffisant pour une demande encore en attente.
 * @param {{ demande: import('./api').Demande, avecStock?: boolean, children?: import('react').ReactNode }} props
 */
export function TableauMateriels({ demande, avecStock = false, children }) {
  const enAttente = demande.statut === 'PENDING';
  return (
    <Carte>
      <EnTeteCarte titre="Matériels demandés">
        <span className="text-small text-muted-foreground">{pluriel(demande.articles.length, 'article')}</span>
      </EnTeteCarte>
      <ul className="divide-y">
        {demande.articles.map((article) => {
          const stock = article.materiel.quantiteDisponible;
          const insuffisant = avecStock && enAttente && stock < article.quantite;
          return (
            <li key={article.id} className="flex min-h-[52px] items-center gap-3 px-4 py-2 md:px-5">
              <VisuelMateriel
                nom={article.materiel.nom}
                categorie={article.materiel.categorie}
                imageUrl={article.materiel.imageUrl}
                taille="miniature"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-medium">{article.materiel.nom}</span>
                <span className="text-caption text-muted-foreground">{article.materiel.categorie}</span>
              </div>
              <div className="chiffres text-right">
                <div>× {article.quantite}</div>
                {avecStock && (
                  <div className={cn('text-caption', insuffisant ? 'font-medium text-destructive-text' : 'text-muted-foreground')}>
                    {insuffisant && <CircleAlert className="mr-1 inline size-3" aria-hidden="true" />}
                    Stock actuel : {stock}
                    {insuffisant && ' (insuffisant)'}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {children}
    </Carte>
  );
}

/**
 * Commentaire de l'administrateur, attribué à l'auteur de la dernière décision.
 * @param {{ demande: import('./api').Demande }} props
 */
export function NoteAdministrateur({ demande }) {
  if (!demande.commentaireAdmin) return null;
  const decision = [...demande.historique].reverse().find((e) => e.auteur?.role === 'ADMIN');
  const auteur = decision?.auteur?.nomComplet ?? 'Administrateur';

  return (
    <section className="flex gap-3 rounded-lg border bg-background p-4" aria-label="Commentaire de l'administrateur">
      <Avatar nom={auteur} grand />
      <div>
        <div className="flex flex-wrap items-center gap-x-2">
          <span className="font-medium">{auteur}</span>
          <span className="text-caption text-muted-foreground">
            Administrateur{decision ? ` · ${formaterDateHeure(decision.date)}` : ''}
          </span>
        </div>
        <p className="mt-1">{demande.commentaireAdmin}</p>
      </div>
    </section>
  );
}

/**
 * @param {{ demande: import('./api').Demande }} props
 */
export function CarteSuivi({ demande }) {
  return (
    <Carte as="aside">
      <EnTeteCarte titre="Suivi" />
      <CorpsCarte>
        <Chronologie demande={demande} />
      </CorpsCarte>
    </Carte>
  );
}
