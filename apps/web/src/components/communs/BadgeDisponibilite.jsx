/**
 * Badge de disponibilité d'un matériel : « Disponible », « Stock faible », « Indisponible ».
 * Tier : présentation.
 */
import { DISPONIBILITES } from '@/lib/constantes';
import { Pastille } from './BadgeStatut';

/**
 * @param {{ disponibilite: 'disponible'|'stock_faible'|'indisponible', className?: string }} props
 */
export function BadgeDisponibilite({ disponibilite, className }) {
  const style = DISPONIBILITES[disponibilite];
  if (!style) return null;
  return <Pastille {...style} className={className} />;
}
