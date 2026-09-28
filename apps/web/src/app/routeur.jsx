/**
 * Toutes les routes de l'application et leurs gardes.
 *
 * Tier : présentation.
 * - Publique : /login
 * - Connecté (GardeConnexion) : tableau de bord, catalogue, demandes, notifications, profil
 * - ADMIN (GardeAdmin, confort visuel — l'API protège réellement /admin) : /admin/*
 */
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MiseEnPageApp } from './miseEnPage/MiseEnPageApp';
import { MiseEnPageAuth } from './miseEnPage/MiseEnPageAuth';
import { PageIntrouvable } from './PageIntrouvable';
import { GardeConnexion } from '@/fonctionnalites/auth/GardeConnexion';
import { GardeAdmin } from '@/fonctionnalites/auth/GardeAdmin';
import { PageConnexion } from '@/fonctionnalites/auth/PageConnexion';
import { PageTableauDeBord } from '@/fonctionnalites/tableauDeBord/PageTableauDeBord';
import { PageCatalogue } from '@/fonctionnalites/materiels/PageCatalogue';
import { PageDetailMateriel } from '@/fonctionnalites/materiels/PageDetailMateriel';
import { PageNouvelleDemande } from '@/fonctionnalites/demandes/PageNouvelleDemande';
import { PageMesDemandes } from '@/fonctionnalites/demandes/PageMesDemandes';
import { PageDetailDemande } from '@/fonctionnalites/demandes/PageDetailDemande';
import { PageNotifications } from '@/fonctionnalites/notifications/PageNotifications';
import { PageProfil } from '@/fonctionnalites/profil/PageProfil';
import { PageAdminTableauDeBord } from '@/fonctionnalites/admin/tableauDeBord/PageAdminTableauDeBord';
import { PageAdminDemandes } from '@/fonctionnalites/admin/demandes/PageAdminDemandes';
import { PageAdminDetailDemande } from '@/fonctionnalites/admin/demandes/PageAdminDetailDemande';
import { PageAdminMateriels } from '@/fonctionnalites/admin/materiels/PageAdminMateriels';
import { PageFormulaireMateriel } from '@/fonctionnalites/admin/materiels/PageFormulaireMateriel';
import { PageAdminCategories } from '@/fonctionnalites/admin/categories/PageAdminCategories';
import { PageAdminAudit } from '@/fonctionnalites/admin/audit/PageAdminAudit';

export function Routeur() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MiseEnPageAuth />}>
          <Route path="/login" element={<PageConnexion />} />
        </Route>

        <Route element={<GardeConnexion />}>
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
            </Route>

            <Route path="*" element={<PageIntrouvable />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
