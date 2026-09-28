/**
 * Mise en page des écrans d'authentification (connexion, choix du mot de passe) :
 * une carte centrée sur le fond de l'application.
 * Tier : présentation.
 */
import { Outlet } from 'react-router-dom';

export function MiseEnPageAuth() {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-4">
      <div className="flex w-full max-w-[420px] justify-center rounded-lg border bg-card px-6 py-8 shadow-sm sm:px-8 sm:py-10">
        <Outlet />
      </div>
    </main>
  );
}
