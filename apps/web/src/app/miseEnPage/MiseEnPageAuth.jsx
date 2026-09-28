/**
 * Mise en page de la connexion (design Ecran01Connexion) : formulaire à gauche,
 * panneau sombre à droite avec trois bénéfices produit (masqué sur mobile).
 * Tier : présentation.
 */
import { Outlet } from 'react-router-dom';

const BENEFICES = [
  {
    titre: 'Un catalogue à jour',
    texte: 'Consultez le matériel disponible et son stock réel avant de demander.',
  },
  {
    titre: 'Une demande, plusieurs matériels',
    texte: 'Regroupez portable, écran et accessoires dans une seule demande motivée.',
  },
  {
    titre: 'Un suivi transparent',
    texte: 'Chaque étape est horodatée : approbation, refus motivé, remise du matériel.',
  },
];

export function MiseEnPageAuth() {
  return (
    <div className="grid min-h-screen bg-card lg:grid-cols-2">
      <main className="grid place-items-center p-4 sm:p-12">
        <Outlet />
      </main>
      <aside className="hidden flex-col justify-between bg-panel px-16 py-12 text-panel-foreground lg:flex">
        <div className="text-caption text-panel-muted">IT Request Manager</div>
        <div className="max-w-[440px]">
          <p className="mb-8 text-h2">
            Gestion simple et centralisée des demandes de matériel informatique.
          </p>
          <ul className="flex flex-col gap-6">
            {BENEFICES.map((benefice, index) => (
              <li key={benefice.titre} className="grid grid-cols-[32px_1fr] gap-3">
                <span className="font-mono text-caption leading-6 text-panel-muted">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <div className="text-h3">{benefice.titre}</div>
                  <div className="mt-1 text-panel-muted">{benefice.texte}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-caption text-panel-muted">© 2026 IT Request Manager</div>
      </aside>
    </div>
  );
}
