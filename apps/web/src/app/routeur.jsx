/**
 * Toutes les routes de l'application et leurs gardes.
 *
 * Tier : présentation.
 * - Publique : /login
 * - Connecté (GardeConnexion) : tableau de bord, catalogue, demandes, notifications, profil,
 *   /change-password (forcée tant que le mot de passe temporaire n'est pas remplacé)
 * - ADMIN (GardeAdmin, confort visuel — l'API protège réellement /admin) : /admin/*
 */
import { lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MiseEnPageApp } from './miseEnPage/MiseEnPageApp';
import { MiseEnPageAuth } from './miseEnPage/MiseEnPageAuth';
import { PageIntrouvable } from './PageIntrouvable';
import { GardeConnexion } from '@/fonctionnalites/auth/GardeConnexion';
import { GardeAdmin } from '@/fonctionnalites/auth/GardeAdmin';
import { PageConnexion } from '@/fonctionnalites/auth/PageConnexion';
import { PageChangementMotDePasse } from '@/fonctionnalites/auth/PageChangementMotDePasse';
import { PageTableauDeBord } from '@/fonctionnalites/tableauDeBord/PageTableauDeBord';
import { PageCatalogue } from '@/fonctionnalites/materiels/PageCatalogue';
import { PageDetailMateriel } from '@/fonctionnalites/materiels/PageDetailMateriel';
import { PageNouvelleDemande } from '@/fonctionnalites/demandes/PageNouvelleDemande';
import { PageMesDemandes } from '@/fonctionnalites/demandes/PageMesDemandes';
import { PageDetailDemande } from '@/fonctionnalites/demandes/PageDetailDemande';
import { PageNotifications } from '@/fonctionnalites/notifications/PageNotifications';
import { PageProfil } from '@/fonctionnalites/profil/PageProfil';

/**
 * Chargement différé d'une page (code splitting) : les écrans d'administration
 * et Recharts ne sont téléchargés que par les administrateurs qui les ouvrent.
 * @param {() => Promise<Record<string, import('react').ComponentType>>} importer
 * @param {string} nom nom de l'export de la page
 */
function charger(importer, nom) {
  return lazy(() => importer().then((module) => ({ default: module[nom] })));
}

const PageAdminTableauDeBord = charger(
  () => import('@/fonctionnalites/admin/tableauDeBord/PageAdminTableauDeBord'),
  'PageAdminTableauDeBord',
);
const PageAdminDemandes = charger(
  () => import('@/fonctionnalites/admin/demandes/PageAdminDemandes'),
  'PageAdminDemandes',
);
const PageAdminDetailDemande = charger(
  () => import('@/fonctionnalites/admin/demandes/PageAdminDetailDemande'),
  'PageAdminDetailDemande',
);
const PageAdminMateriels = charger(
  () => import('@/fonctionnalites/admin/materiels/PageAdminMateriels'),
  'PageAdminMateriels',
);
const PageFormulaireMateriel = charger(
  () => import('@/fonctionnalites/admin/materiels/PageFormulaireMateriel'),
  'PageFormulaireMateriel',
);
const PageAdminCategories = charger(
  () => import('@/fonctionnalites/admin/categories/PageAdminCategories'),
  'PageAdminCategories',
);
const PageAdminAudit = charger(
  () => import('@/fonctionnalites/admin/audit/PageAdminAudit'),
  'PageAdminAudit',
);
const PageAdminUtilisateurs = charger(
  () => import('@/fonctionnalites/admin/utilisateurs/PageAdminUtilisateurs'),
  'PageAdminUtilisateurs',
);

export function Routeur() {
  return (
    // Options « future » : adopte dès maintenant le comportement de React Router v7 (supprime les avertissements)
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route element={<MiseEnPageAuth />}>
          <Route path="/login" element={<PageConnexion />} />
        </Route>

        <Route element={<GardeConnexion />}>
          {/* Choix du mot de passe définitif : même mise en page que la connexion */}
          <Route element={<MiseEnPageAuth />}>
            <Route path="/change-password" element={<PageChangementMotDePasse />} />
          </Route>

          <Route element={<MiseEnPageApp />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<PageTableauDeBord />} />
            <Route path="/materials" element={<PageCatalogue />} />
            <Route path="/materials/:id" element={<PageDetailMateriel />} />
            <Route path="/requests" element={<PageMesDemandes />} />
            <Route path="/requests/new" element={<PageNouvelleDemande />} />
            <Route path="/requests/:id" element={<PageDetailDemande />} />
            <Route path="/notifications" element={<PageNotifications />} />
            <Route path="/profile" element={<PageProfil />} />

            <Route path="/admin" element={<GardeAdmin />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<PageAdminTableauDeBord />} />
              <Route path="requests" element={<PageAdminDemandes />} />
              <Route path="requests/:id" element={<PageAdminDetailDemande />} />
              <Route path="materials" element={<PageAdminMateriels />} />
              <Route path="materials/new" element={<PageFormulaireMateriel />} />
              <Route path="materials/:id/edit" element={<PageFormulaireMateriel />} />
              <Route path="categories" element={<PageAdminCategories />} />
              <Route path="audit" element={<PageAdminAudit />} />
              <Route path="users" element={<PageAdminUtilisateurs />} />
            </Route>

            <Route path="*" element={<PageIntrouvable />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
