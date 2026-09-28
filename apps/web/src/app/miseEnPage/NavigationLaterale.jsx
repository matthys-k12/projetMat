/**
 * Navigation latérale (design SidebarNav) : logo, liens, groupe Administration, profil et déconnexion.
 *
 * Tier : présentation. Utilisée par MiseEnPageApp, dans la sidebar fixe (≥ 1024 px)
 * et dans le tiroir mobile (items plus hauts : 44 px).
 *
 * Le groupe « Administration » n'est affiché qu'aux ADMIN : c'est du confort
 * visuel, la vraie sécurité est dans l'API (403 pour un USER sur /admin/*).
 */
import { NavLink } from 'react-router-dom';
import {
  Bell,
  Boxes,
  ClipboardList,
  FileText,
  FolderTree,
  History,
  Laptop,
  LayoutDashboard,
  LogOut,
  Package,
  User,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/fonctionnalites/auth/useAuth';
import { useNombreNonLues } from '@/fonctionnalites/notifications/hooks';

const LIENS_UTILISATEUR = [
  { vers: '/dashboard', libelle: 'Tableau de bord', icone: LayoutDashboard },
  { vers: '/materials', libelle: 'Matériels', icone: Package },
  { vers: '/requests', libelle: 'Mes demandes', icone: FileText },
  { vers: '/notifications', libelle: 'Notifications', icone: Bell, compteur: true },
];

const LIENS_ADMIN = [
  { vers: '/admin/dashboard', libelle: 'Dashboard', icone: LayoutDashboard },
  { vers: '/admin/requests', libelle: 'Demandes', icone: ClipboardList },
  { vers: '/admin/materials', libelle: 'Matériels', icone: Boxes },
  { vers: '/admin/categories', libelle: 'Catégories', icone: FolderTree },
  { vers: '/admin/users', libelle: 'Utilisateurs', icone: Users },
  { vers: '/admin/audit', libelle: 'Audit', icone: History },
];

/** Logo construit en code (aucun fichier de marque fourni). */
export function Logo() {
  return (
    <div className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight">
      <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
        <Laptop className="size-4" aria-hidden="true" />
      </span>
      IT Request
    </div>
  );
}

/**
 * @param {{ lien: { vers: string, libelle: string, icone: import('react').ElementType, compteur?: boolean }, mobile: boolean, surNavigation?: () => void, nonLues?: number }} props
 */
function LienNavigation({ lien, mobile, surNavigation, nonLues }) {
  const Icone = lien.icone;
  return (
    <NavLink
      to={lien.vers}
      onClick={surNavigation}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-2.5 rounded-md px-2.5 text-sm font-medium',
          mobile ? 'h-11' : 'h-9',
          isActive
            ? 'bg-muted text-foreground'
            : 'text-muted-strong hover:bg-background hover:text-foreground',
        )
      }
    >
      <Icone
        className="size-4 text-muted-foreground group-aria-[current=page]:text-foreground"
        aria-hidden="true"
      />
      <span>{lien.libelle}</span>
      {lien.compteur && nonLues > 0 && (
        <span
          className="chiffres ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground"
          aria-label={`${nonLues} non lues`}
        >
          {nonLues}
        </span>
      )}
    </NavLink>
  );
}

/**
 * @param {{ mobile?: boolean, surNavigation?: () => void }} props
 */
export function NavigationLaterale({ mobile = false, surNavigation }) {
  const { estAdmin, seDeconnecter } = useAuth();
  const { data: nonLues = 0 } = useNombreNonLues();

  return (
    <div className="flex h-full flex-col px-3 pb-3">
      <div className="flex h-16 shrink-0 items-center px-2">
        <Logo />
      </div>

      <nav aria-label="Navigation principale" className="flex flex-col gap-0.5">
        {LIENS_UTILISATEUR.map((lien) => (
          <LienNavigation
            key={lien.vers}
            lien={lien}
            mobile={mobile}
            surNavigation={surNavigation}
            nonLues={nonLues}
          />
        ))}
      </nav>

      {estAdmin && (
        <>
          <div className="px-2 pb-1.5 pt-4 text-caption font-medium text-muted-foreground">
            Administration
          </div>
          <nav aria-label="Administration" className="flex flex-col gap-0.5">
            {LIENS_ADMIN.map((lien) => (
              <LienNavigation
                key={lien.vers}
                lien={lien}
                mobile={mobile}
                surNavigation={surNavigation}
              />
            ))}
          </nav>
        </>
      )}

      <div className="mt-auto flex flex-col gap-0.5 border-t pt-3">
        <LienNavigation
          lien={{ vers: '/profile', libelle: 'Profil', icone: User }}
          mobile={mobile}
          surNavigation={surNavigation}
        />
        <button
          type="button"
          onClick={seDeconnecter}
          className={cn(
            'flex items-center gap-2.5 rounded-md px-2.5 text-sm font-medium text-muted-strong hover:bg-background hover:text-foreground',
            mobile ? 'h-11' : 'h-9',
          )}
        >
          <LogOut className="size-4 text-muted-foreground" aria-hidden="true" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}
