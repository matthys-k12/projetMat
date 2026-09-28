/**
 * Zone de dépôt d'image (design DropZone) : clic ou glisser-déposer, PNG/JPEG/WebP, 2 Mo.
 *
 * Tier : présentation. L'image est envoyée à l'API (multer → bucket Supabase « materials »),
 * jamais directement au Storage depuis le navigateur. Disponible une fois le matériel créé.
 */
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';
import { VisuelMateriel } from '@/components/communs/VisuelMateriel';
import { cn } from '@/lib/utils';
import { useTeleverserImage } from './hooks';

const TYPES_ACCEPTES = ['image/png', 'image/jpeg', 'image/webp'];
const TAILLE_MAX = 2 * 1024 * 1024;

/**
 * @param {{ materiel?: import('@/fonctionnalites/materiels/api').Materiel }} props
 */
export function ZoneImage({ materiel }) {
  const champ = useRef(null);
  const [survol, setSurvol] = useState(false);
  const envoi = useTeleverserImage();

  /** Vérifie le fichier côté navigateur (l'API revérifie) puis l'envoie. @param {File|undefined} fichier */
  async function envoyer(fichier) {
    if (!fichier || !materiel) return;
    if (!TYPES_ACCEPTES.includes(fichier.type))
      return toast.error('Format accepté : PNG, JPEG ou WebP.');
    if (fichier.size > TAILLE_MAX) return toast.error("L'image ne doit pas dépasser 2 Mo.");
    try {
      await envoi.mutateAsync({ id: materiel.id, fichier });
      toast.success(`Image de ${materiel.nom} enregistrée`);
    } catch (erreur) {
      toast.error(erreur.message);
    }
  }

  if (!materiel) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-label">Image</span>
        <p className="rounded-lg border border-dashed border-input bg-background p-4 text-small text-muted-foreground">
          Enregistrez d&apos;abord le matériel pour pouvoir ajouter une image.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span id="libelle-image" className="text-label">
        Image
      </span>
      <div className="flex flex-col gap-3 sm:flex-row">
        {materiel.imageUrl && (
          <VisuelMateriel
            nom={materiel.nom}
            imageUrl={materiel.imageUrl}
            className="w-40 rounded-md border"
          />
        )}
        <div
          role="button"
          tabIndex={0}
          aria-labelledby="libelle-image"
          aria-describedby="aide-image"
          onClick={() => champ.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && champ.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setSurvol(true);
          }}
          onDragLeave={() => setSurvol(false)}
          onDrop={(e) => {
            e.preventDefault();
            setSurvol(false);
            envoyer(e.dataTransfer.files[0]);
          }}
          className={cn(
            'flex flex-1 cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-input bg-background p-6 text-center',
            survol && 'border-primary bg-primary-subtle',
          )}
        >
          <span className="grid size-10 place-items-center rounded-md border bg-card text-muted-strong">
            {envoi.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" aria-hidden="true" />
            )}
          </span>
          <span className="text-small">
            <b className="font-medium text-primary">Choisir un fichier</b> ou glisser-déposer ici
          </span>
          <span id="aide-image" className="text-caption text-muted-foreground">
            PNG, JPEG ou WebP, format 4:3 conseillé, 2 Mo maximum
          </span>
        </div>
      </div>
      <input
        ref={champ}
        type="file"
        accept={TYPES_ACCEPTES.join(',')}
        className="hidden"
        onChange={(e) => envoyer(e.target.files?.[0])}
      />
    </div>
  );
}
