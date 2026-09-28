/**
 * Fournisseurs globaux de l'application.
 *
 * Tier : présentation. Utilisé par : App.jsx.
 * - QueryClient (TanStack Query) : cache des données de l'API ;
 * - FournisseurAuth : session Supabase + profil chargé via GET /auth/me ;
 * - ContextePanier : lignes de la future demande (sessionStorage) ;
 * - Toaster (sonner) : notifications éphémères en bas à droite.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { FournisseurAuth } from '@/fonctionnalites/auth/ContexteAuth';
import { FournisseurPanier } from '@/fonctionnalites/demandes/ContextePanier';

const clientRequetes = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Une erreur 4xx (404, 403…) ne se corrige pas en réessayant
      retry: (nombreEssais, erreur) => erreur?.statut >= 500 && nombreEssais < 2,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * @param {{ children: import('react').ReactNode }} props
 */
export function Fournisseurs({ children }) {
  return (
    <QueryClientProvider client={clientRequetes}>
      <FournisseurAuth>
        <FournisseurPanier>{children}</FournisseurPanier>
      </FournisseurAuth>
      <Toaster position="bottom-right" closeButton toastOptions={{ className: 'text-sm' }} />
    </QueryClientProvider>
  );
}
