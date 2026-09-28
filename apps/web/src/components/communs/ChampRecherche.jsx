/**
 * Champ de recherche avec icône, libellé masqué (lecteurs d'écran) et saisie différée.
 *
 * Tier : présentation. La valeur n'est transmise qu'après 300 ms sans frappe,
 * pour ne pas appeler l'API à chaque caractère.
 */
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * @param {{ id: string, libelle: string, placeholder: string, valeur: string, surChangement: (texte: string) => void, className?: string }} props
 */
export function ChampRecherche({ id, libelle, placeholder, valeur, surChangement, className }) {
  const [texte, setTexte] = useState(valeur);

  useEffect(() => {
    const minuteur = setTimeout(() => {
      if (texte !== valeur) surChangement(texte);
    }, 300);
    return () => clearTimeout(minuteur);
  }, [texte, valeur, surChangement]);

  return (
    <div className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <label htmlFor={id} className="sr-only">
        {libelle}
      </label>
      <Input
        id={id}
        type="search"
        className="pl-9"
        placeholder={placeholder}
        value={texte}
        onChange={(evenement) => setTexte(evenement.target.value)}
      />
    </div>
  );
}
