/**
 * En-tête de l'application (design AppHeader) : fil d'Ariane, cloche avec pastille, menu du compte.
 * Sur mobile : bouton menu (ouvre le tiroir) + logo, hauteur 56 px.
 * Tier : présentation.
 */
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, ChevronRight, LogOut, Menu, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar } from '@/components/communs/Avatar';
import { useAuth } from '@/fonctionnalites/auth/useAuth';
import { useNombreNonLues } from '@/fonctionnalites/notifications/hooks';
import { Logo } from './NavigationLaterale';

/** Libellé de chaque segment d'URL pour le fil d'Ariane. */
const SEGMENTS = {
  dashboard: 'Tableau de bord',
  materials: 'Matériels',
  requests: 'Demandes',
  new: 'Nouvelle demande',
  notifications: 'Notifications',
  profile: 'Profil',
  admin: 'Administration',
  categories: 'Catégories',
  audit: 'Audit',
  edit: 'Modifier',
};

/**
 * Construit le fil d'Ariane depuis l'URL. Les identifiants (UUID) deviennent « Détail ».
 * @param {string} chemin ex. « /admin/requests/8f…/ »
 * @returns {string[]}
 */
export function construireFilAriane(chemin) {
  const segments = chemin.split('/').filter(Boolean);
  const libelles = segments.map((segment) => SEGMENTS[segment] ?? 'Détail');
  // « /requests » côté utilisateur s'affiche « Mes demandes »
  if (segments[0] === 'requests' && segments.length === 1) return ['Mes demandes'];
  return libelles;
}

/**
 * @param {{ surOuvrirMenu: () => void }} props
 */
export function EnTeteApp({ surOuvrirMenu }) {
  const { profil, seDeconnecter } = useAuth();
  const { data: nonLues = 0 } = useNombreNonLues();
  const emplacement = useLocation();
  const naviguer = useNavigate();
  const fil = construireFilAriane(emplacement.pathname);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b bg-card px-4 lg:h-16 lg:px-8">
      <div className="flex items-center gap-2 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="size-11"
          aria-label="Ouvrir le menu"
          onClick={surOuvrirMenu}
        >
          <Menu className="size-5" />
        </Button>
        <Logo />
      </div>

      <nav
        aria-label="Fil d'Ariane"
        className="hidden items-center gap-1.5 text-small text-muted-foreground lg:flex"
      >
        {fil.map((libelle, index) => {
          const dernier = index === fil.length - 1;
          return (
            <span key={`${libelle}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && <ChevronRight className="size-3.5 text-input" aria-hidden="true" />}
              {dernier ? (
                <b aria-current="page" className="font-medium text-foreground">
                  {libelle}
                </b>
              ) : (
                libelle
              )}
            </span>
          );
        })}
      </nav>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="relative size-11 lg:size-9">
          <Link to="/notifications" aria-label={`Notifications, ${nonLues} non lues`}>
            <Bell />
            {nonLues > 0 && (
              <span className="absolute right-2.5 top-2.5 size-2 rounded-full border-2 border-card bg-destructive lg:right-2 lg:top-2" />
            )}
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex h-9 items-center gap-2 rounded-md pl-1 pr-2 text-small font-medium hover:bg-muted"
            aria-label="Menu du compte"
          >
            <Avatar nom={profil?.nomComplet ?? ''} />
            <span className="hidden sm:inline">{profil?.nomComplet}</span>
            <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="font-medium">{profil?.nomComplet}</div>
              <div className="text-caption text-muted-foreground">{profil?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => naviguer('/profile')}>
              <User aria-hidden="true" /> Profil
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={seDeconnecter}>
              <LogOut aria-hidden="true" /> Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
