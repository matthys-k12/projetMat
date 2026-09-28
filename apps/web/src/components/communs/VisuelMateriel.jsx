/**
 * Visuel d'un matériel : photo si disponible, sinon icône Lucide de la catégorie
 * sur fond « subtle » (design README § Iconographie).
 * Tier : présentation.
 */
import {
  Cable,
  Headphones,
  HardDrive,
  Keyboard,
  Laptop,
  Monitor,
  Mouse,
  Package,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/** Icône par mot-clé de catégorie (comparaison sans accents ni majuscules). */
const ICONES = [
  ['portable', Laptop],
  ['fixe', HardDrive],
  ['ecran', Monitor],
  ['clavier', Keyboard],
  ['souris', Mouse],
  ['telephone', Smartphone],
  ['casque', Headphones],
  ['audio', Headphones],
  ['adaptateur', Cable],
  ['connectique', Cable],
];

/**
 * @param {string|null|undefined} categorie
 * @returns {import('react').ElementType}
 */
export function iconeCategorie(categorie) {
  const nom = (categorie ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const trouve = ICONES.find(([motCle]) => nom.includes(motCle));
  return trouve ? trouve[1] : Package;
}

/**
 * @param {{ nom: string, categorie?: string|null, imageUrl?: string|null, taille?: 'miniature'|'grand', className?: string }} props
 */
export function VisuelMateriel({ nom, categorie, imageUrl, taille = 'grand', className }) {
  const Icone = iconeCategorie(categorie);
  const classes =
    taille === 'miniature' ? 'h-[30px] w-10 shrink-0 rounded-sm' : 'aspect-[4/3] w-full';

  if (imageUrl) {
    return (
      <img src={imageUrl} alt={nom} className={cn(classes, 'bg-muted object-contain', className)} />
    );
  }
  return (
    <div
      className={cn(classes, 'grid place-items-center bg-muted text-muted-foreground', className)}
    >
      <Icone
        aria-hidden="true"
        className={taille === 'miniature' ? 'size-4' : 'size-14'}
        strokeWidth={taille === 'miniature' ? 2 : 1.25}
      />
    </div>
  );
}
