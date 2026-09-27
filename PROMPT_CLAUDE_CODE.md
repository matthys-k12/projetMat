# Mission Claude Code — IT Request Manager, de A à Z

Projet présenté lors d'un **entretien technique**. Il reste environ 4 heures. Je dois pouvoir **expliquer chaque fichier à l'oral** : la lisibilité et les commentaires comptent autant que les fonctionnalités.
Priorité absolue : un périmètre P0 **fini, propre et démontrable**, plutôt qu'un projet large et cassé.

---

## 0. Avant d'écrire du code

1. Lis `CLAUDE.md`, `supabase/migrations/*.sql` et `supabase/seed.sql`. **La base est déjà créée et déployée sur Supabase.** Ne modifie jamais une migration existante. Si un changement de schéma est indispensable, crée une nouvelle migration datée et explique pourquoi dans le récapitulatif.
2. Lis la maquette dans `design/` :
   - `design/README.md` : principes, ton, vocabulaire, accessibilité ;
   - `design/implementation.md` : `globals.css` et configuration Tailwind prêts à l'emploi ;
   - `design/tokens.json` ;
   - pour chaque écran, `design/components/<Nom>/README.md` et `preview.html` (`Ecran01…15`, `Mobile00…07`, `Etat…`), et les composants (`StatusBadge`, `SidebarNav`, `Timeline`, `QuantityStepper`, `DataTable`…).

   **Le rendu final doit être fidèle à ces maquettes.**
3. Mets à jour `CLAUDE.md`. La stack change (voir §1), mais le contrat base de données, les RPC, les codes d'erreur et le format de réponse restent intacts.
4. Affiche un plan court, puis enchaîne sans attendre ma validation.

---

## 1. Stack imposée — JavaScript uniquement, aucun TypeScript

**Monorepo** : npm workspaces, avec `apps/api` et `apps/web`. Le `package.json` racine contient les scripts `dev` (lance l'API et le web ensemble avec `concurrently`), `test`, `lint` et `build`.

**Backend (`apps/api`)**
- Node.js 20+ et Express 5, en JavaScript avec modules ES (`"type": "module"`).
- `@supabase/supabase-js` avec la clé service_role, côté serveur uniquement.
- `zod` pour la validation.
- `helmet`, `cors`, `morgan`, `dotenv`.
- Swagger : `swagger-ui-express` avec `yaml`, qui sert `docs/openapi.yaml` sur `/api/docs`.
- Tests : Vitest et Supertest.

**Frontend (`apps/web`)**
- React et Vite, en **JSX** : aucun fichier `.ts` ni `.tsx`.
- React Router.
- **Tailwind CSS v3.4**, avec shadcn/ui en JSX. Initialise-le via `npx shadcn@2.3.0 init`, la dernière version compatible Tailwind v3, avec `"tsx": false`.
- TanStack Query, React Hook Form et Zod.
- `lucide-react`, `sonner` pour les toasts, `date-fns` avec la locale `fr`.
- Recharts, uniquement pour le dashboard admin.
- Tests : Vitest et React Testing Library.

**Autres consignes**
- Pour documenter la forme des données sans TypeScript, utilise **JSDoc** (`@typedef`, `@param`, `@returns`).
- Convertis `apps/api/scripts/seed-demo.ts` en `apps/api/scripts/seed-demo.js`, avec la même logique, puis supprime la version `.ts`.
- Ajoute dans `CLAUDE.md` une ligne justifiant Express : il est plus simple à expliquer en JavaScript, l'architecture en couches est rendue explicite à la main, et NestJS apporte peu sans TypeScript.

---

## 2. Règles d'écriture du code (le plus important)

**Français partout où c'est possible :**
- noms de fichiers, fonctions, variables, composants et hooks ;
- commentaires, messages d'erreur, logs ;
- libellés des tests (`describe` et `it` en français).

Exemples : `demandes.service.js`, `approuverDemande()`, `const demandeTrouvee`, `<PageCatalogue />`, `useMesDemandes()`.

**Ce qui reste en anglais, parce que c'est un contrat déjà fixé :**
- les tables et colonnes SQL ;
- les noms des RPC ;
- les statuts techniques (`PENDING`, `APPROVED`…) ;
- les URLs de l'API (`/api/v1/requests`…).

**Le JSON renvoyé par l'API est en camelCase français** (`quantiteDisponible`, `categorie`, `dateCreation`, `statut`). La conversion se fait dans `utils/convertisseurs.js`, avec une fonction par entité, par exemple `versMaterielApi(ligne)`.

**Commentaires :**
- **En-tête de chaque fichier** : son rôle, le tier concerné (présentation, métier ou données), qui l'utilise.
- **JSDoc en français sur chaque fonction** : ce qu'elle fait, ses paramètres, sa valeur de retour, les erreurs possibles.
- **Commente le POURQUOI** : sécurité, transaction, verrou, validation, choix d'architecture. Ne commente pas les évidences.

**Style :**
- Du code simple et lisible plutôt qu'astucieux : fonctions courtes, pas d'abstraction inutile, pas de ternaires imbriqués.
- ESLint et Prettier configurés.
- Aucun secret dans le code ni dans git. Fournis des fichiers `.env.example` commentés.

---

## 3. Backend — `apps/api`

**Architecture en couches**, à rappeler dans les en-têtes de fichiers :
`route → middlewares (authentification, rôle, validation) → contrôleur (HTTP) → service (règles métier) → Supabase / RPC PostgreSQL`

```
apps/api/
  src/
    server.js                  démarre le serveur HTTP
    app.js                     crée l'app Express (sécurité, JSON, routes, erreurs) — exportée pour les tests
    config/
      env.js                   lit et valide les variables d'environnement avec zod, arrête l'app si invalide
      supabase.js              client Supabase service_role (serveur uniquement)
    middlewares/
      authentification.js      vérifie le token Bearer (supabase.auth.getUser), charge le profil,
                               refuse si absent ou inactif → req.utilisateur = { id, email, role, prenom, nom }
      autorisation.js          exigerRole('ADMIN') → 403 sinon
      validation.js            valider({ body, query, params }) avec zod → erreurs lisibles en français
      gestionErreurs.js        format d'erreur unique + traduction des codes RPC/PostgreSQL en statuts HTTP
    utils/
      ErreurApi.js             classe d'erreur métier (statutHttp, code, message)
      pagination.js            page/limite → .range() Supabase ; construit { data, meta }
      convertisseurs.js        ligne SQL (snake_case) → objet API (camelCase français)
      journalAudit.js          enregistrerAudit(acteurId, action, typeEntite, idEntite, metadonnees)
    modules/
      auth/  materiels/  categories/  demandes/  notifications/  tableauDeBord/  audit/  sante/
        <module>.routes.js  <module>.controleur.js  <module>.service.js  <module>.schemas.js
      demandes/machineEtat.js  transitions autorisées, utilisées avant l'appel RPC
    docs/openapi.yaml
  tests/
  scripts/seed-demo.js
  .env.example                 PORT, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WEB_URL
```

**Endpoints** (préfixe `/api/v1`, tous protégés sauf `/health` et `/docs`)

```
GET    /health

GET    /auth/me
POST   /auth/logout

GET    /materials                       ?page&limit&search&category&availability&sort
GET    /materials/:id
GET    /categories                      catégories actives (pour les filtres)

POST   /requests
GET    /requests/me                     ?page&limit&status&search
GET    /requests/:id
PATCH  /requests/:id/cancel

GET    /notifications                   ?page&limit
GET    /notifications/unread-count
PATCH  /notifications/:id/read
PATCH  /notifications/read-all

GET    /dashboard/user

— ADMIN uniquement —
GET    /admin/dashboard
GET    /admin/requests                  ?page&limit&status&search&from&to&userId
GET    /admin/requests/:id
PATCH  /admin/requests/:id/approve      { commentaire? }
PATCH  /admin/requests/:id/reject       { commentaire }  obligatoire
PATCH  /admin/requests/:id/fulfill
GET    /admin/materials                 inclut les inactifs
POST   /admin/materials
GET    /admin/materials/:id
PUT    /admin/materials/:id
PATCH  /admin/materials/:id/status      { actif }
POST   /admin/materials/:id/image       (P2) multer mémoire, 2 Mo, png/jpeg/webp → bucket "materials"
GET    /admin/categories
POST   /admin/categories
PUT    /admin/categories/:id
PATCH  /admin/categories/:id/status
GET    /admin/audit                     ?page&limit&action&entityType
```

**Règles métier et de sécurité côté API**

*Identité et rôles*
- L'identité vient **uniquement** de `req.utilisateur`, donc du token, jamais du body ni de la query.
- Le rôle est lu dans `profiles.role`, jamais dans `user_metadata`.

*Écritures sur les demandes*
- Elles passent **obligatoirement** par les RPC `create_request`, `approve_request`, `reject_request`, `cancel_request` et `fulfill_request`. Transaction, verrous `FOR UPDATE`, historique, notification et audit sont faits en base.
- Le service Node vérifie d'abord la transition avec `machineEtat.js`, ce qui donne une erreur rapide et testable. La base reste la garantie finale.
- Explique ce double contrôle en commentaire.

*Accès aux demandes*
- `GET /requests/:id` pour un USER : si la demande n'est pas à lui, renvoie **404**, pas 403, pour ne pas révéler son existence.

*Détail d'une demande*
- Il contient les articles avec leur matériel, le commentaire admin et l'historique trié chronologiquement avec le nom de l'auteur.
- Pour l'admin, ajoute aussi le stock actuel de chaque matériel.

*Catalogue utilisateur*
- Seuls les matériels actifs appartenant à une catégorie active sont visibles.
- Le filtre `availability` accepte `disponible`, `stock_faible` ou `indisponible` (utilise `is_low_stock`).

*Matériels et catégories côté admin*
- Écritures via supabase-js, avec une ligne d'audit à chaque fois : `MATERIAL_CREATED`, `MATERIAL_UPDATED`, `STOCK_UPDATED`, `MATERIAL_STATUS_CHANGED`, `CATEGORY_CREATED`…
- Validation zod : quantités ≥ 0 et quantité disponible ≤ quantité totale.

*Recherche admin*
- Recherche par référence ou par nom du demandeur, via une jointure `profiles!inner`.

*Formats de réponse*
- Pagination partout, avec `limit` plafonné à 50. Réponse : `{ data, meta: { page, limite, total, totalPages } }`, en utilisant `count: 'exact'`.
- Erreurs : `{ statusCode, code, message, details? }`, avec des messages en **français lisible**. Une table de traduction des codes RPC se trouve dans `gestionErreurs.js`, avec le mapping de `CLAUDE.md`. Pas de stack trace hors développement.

*Sécurité HTTP*
- `helmet`, CORS limité à `WEB_URL`, JSON limité à 100 ko.

---

## 4. Frontend — `apps/web`

```
apps/web/src/
  main.jsx  App.jsx
  app/
    routeur.jsx                toutes les routes + gardes
    fournisseurs.jsx           QueryClient, FournisseurAuth, Toaster
    miseEnPage/                MiseEnPageApp (sidebar + header + tiroir mobile), MiseEnPageAuth
  components/
    ui/                        shadcn (générés, en .jsx)
    communs/                   BadgeStatut, BadgeDisponibilite, EtatVide, EtatErreur, EnTetePage,
                               Pagination, CarteIndicateur, Chronologie, SelecteurQuantite, ChampFormulaire
  fonctionnalites/
    auth/            ContexteAuth.jsx, useAuth.js, GardeConnexion.jsx, GardeAdmin.jsx, PageConnexion.jsx
    tableauDeBord/   PageTableauDeBord.jsx
    materiels/       PageCatalogue.jsx, PageDetailMateriel.jsx, CarteMateriel.jsx
    demandes/        ContextePanier.jsx, PageNouvelleDemande.jsx, PageMesDemandes.jsx, PageDetailDemande.jsx
    notifications/   PageNotifications.jsx
    profil/          PageProfil.jsx
    admin/           tableauDeBord/  demandes/  materiels/  categories/  audit/
    (chaque dossier : api.js = appels HTTP, hooks.js = TanStack Query, schemas.js = zod, puis pages et composants)
  lib/
    clientApi.js     fetch vers VITE_API_URL, ajoute « Authorization: Bearer », lit le format d'erreur,
                     sur 401 → déconnexion + redirection /login
    supabase.js      client Supabase avec la clé ANON — UNIQUEMENT pour l'authentification
    formatage.js     dates JJ/MM/AAAA, HH:MM, dates relatives en français
    constantes.js    statuts techniques → libellés français et variantes de badge
    utils.js         cn()
.env.example         VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

**Routes**
- Publique : `/login`.
- Utilisateur connecté : `/dashboard`, `/materials`, `/materials/:id`, `/requests`, `/requests/new`, `/requests/:id`, `/notifications`, `/profile`.
- Admin : `/admin/dashboard`, `/admin/requests`, `/admin/requests/:id`, `/admin/materials`, `/admin/materials/new`, `/admin/materials/:id/edit`, `/admin/categories`, `/admin/audit`.
- `/` redirige vers `/dashboard`. Ajoute une page 404.

**Règles frontend**

*Fidélité à la maquette*
- Reprends le `globals.css` et la config Tailwind de `design/implementation.md`, en convertissant `tailwind.config.ts` en `tailwind.config.js`.
- Polices : Inter et JetBrains Mono (pour les références).
- Reproduis chaque écran d'après `design/components/Ecran…`, `Mobile…` et `Etat…`.
- Respecte le vocabulaire imposé (« En attente », « Approuvée », « Remise », « Refusée », « Annulée » ; l'onglet des approuvées s'appelle « Acceptées »).

*Authentification*
- Le SDK Supabase ne sert qu'à `signInWithPassword`, `signOut`, `getSession` et `onAuthStateChange`. Toutes les données passent par `clientApi.js`.
- Le profil et le rôle sont chargés via `GET /auth/me`.
- Le menu Administration n'apparaît que pour ADMIN. Écris en commentaire que c'est du confort visuel : la vraie sécurité est dans l'API.

*États et retours utilisateur*
- Chaque écran de données gère trois états : chargement (Skeleton), vide (EtatVide) et erreur (EtatErreur avec un bouton « Réessayer »).
- Mutations :
  - toast nommant l'objet (« Demande REQ-2026-000013 envoyée ») ;
  - invalidation des requêtes concernées ;
  - bouton désactivé avec spinner pendant l'envoi.
- Confirmations :
  - AlertDialog pour annuler une demande ou pour approuver ;
  - Dialog avec motif obligatoire pour refuser.

*Nouvelle demande*
- Un panier est conservé dans `ContextePanier` et dans `sessionStorage`, et alimenté par « Ajouter à la demande » depuis le détail d'un matériel.
- On peut ajouter, modifier et supprimer des lignes.
- Validations : pas de doublon, quantité entre 1 et le stock disponible, motif de 10 à 1000 caractères.
- Un résumé reste visible (sticky). Après succès, on vide le panier et on redirige vers le détail de la demande.

*Formulaires*
- React Hook Form avec Zod, messages en français, `aria-invalid` et `aria-describedby`.

*Responsive*
- Sidebar à partir de 1024px, tiroir (Sheet) en dessous.
- Tableaux transformés en cartes sous `md`.
- Cibles tactiles de 44px minimum.
- Barre d'action collée en bas sur mobile.

*Notifications*
- Compteur de non-lues rafraîchi toutes les 30 s.

*Accessibilité*
- Suivre `design/README.md` : focus visible, statut jamais porté par la couleur seule, `aria-label` sur les boutons icônes.

---

## 5. Tests (minimum exigé)

**API**
- `machineEtat.test.js` : toutes les transitions autorisées et interdites.
- Tests des middlewares, avec Supabase mocké : sans token → 401, token invalide → 401, USER sur `/admin/*` → 403.
- `gestionErreurs.test.js` : `INSUFFICIENT_STOCK` → 409 avec message français, `REQUEST_NOT_FOUND` → 404, etc.
- `validation` : une demande vide ou une quantité à 0 est rejetée.
- Supertest sur `GET /api/v1/health`.

**Web**
- `BadgeStatut` affiche bien le libellé français.
- Le schéma zod de la nouvelle demande fonctionne.
- La validation du formulaire de `PageConnexion` fonctionne.

`npm test` à la racine doit lancer tous les tests.

---

## 6. Documentation

**`README.md` à la racine :**
- présentation du projet ;
- schéma de l'architecture 3 tiers ;
- stack et justification des choix ;
- installation pas à pas, variables d'environnement, lancement ;
- comptes de démo ;
- endpoints principaux et lien vers Swagger ;
- choix techniques : RPC transactionnelles, service_role côté serveur uniquement, RLS en deny all, séquence pour les références ;
- limites et évolutions possibles.

**`docs/EXPLICATIONS.md`, mon guide pour l'oral, en français simple :**
1. Le parcours complet d'une demande, **fichier par fichier**, du clic sur « Envoyer la demande » jusqu'à la ligne en base, puis retour à l'écran.
2. Le parcours d'une approbation, et pourquoi le stock ne peut jamais devenir négatif même si deux admins approuvent en même temps (verrous, transaction, contrainte CHECK).
3. Le fonctionnement de l'authentification et des rôles, et pourquoi le navigateur ne peut pas contourner les règles.
4. L'organisation des dossiers et le rôle de chaque couche.
5. Dix questions probables d'un recruteur, avec des réponses courtes.

**`apps/api/docs/openapi.yaml`** : complet et cohérent avec le code.

---

## 7. Ordre d'exécution et points de contrôle

Travaille étape par étape. À la fin de chaque étape :
- lance le lint, le build et les tests ;
- corrige ce qui casse ;
- fais un commit git avec un message conventionnel en français, par exemple `feat(api): approbation des demandes` ;
- enchaîne l'étape suivante.

1. **Socle** : monorepo, `.env.example`, ESLint/Prettier, `CLAUDE.md` mis à jour, `seed-demo.js`.
2. **API** : config, middlewares, erreurs, auth, matériels, catégories, demandes (user et admin), tableau de bord, notifications, audit, Swagger.
   Vérifie ensuite avec de vrais appels `curl` et les comptes de démo : connexion, création d'une demande, approbation, contrôle du stock décrémenté, tentative de double approbation (doit renvoyer 409).
3. **Socle front** : Vite, Tailwind et tokens, shadcn, mise en page, authentification, `clientApi`, gardes.
4. **Front utilisateur** : dashboard, catalogue, détail matériel, nouvelle demande, mes demandes, détail et annulation, notifications, profil.
5. **Front admin** : dashboard, demandes et détail (approuver, refuser, remettre), matériels et formulaire, catégories, audit.
6. **Finalisation** : tests, README, `EXPLICATIONS.md`, passe finale responsive et accessibilité.

**Priorités si le temps manque :**
- **P0** : auth, catalogue, nouvelle demande, mes demandes, détail et annulation, admin demandes avec approbation et refus, admin matériels.
- **P1** : catégories, remise, dashboards, notifications.
- **P2** : audit, graphiques, upload d'image.

Ne commence **jamais** un P2 avant que tout le P0 fonctionne de bout en bout.

---

## 8. Définition de « terminé »

- `npm install` puis `npm run dev` à la racine lancent l'API (port 3000) et le web (port 5173).
- Je peux me connecter avec `aya@itrm.demo / User123!` et `admin@itrm.demo / Admin123!` et dérouler toute la démo sans erreur dans la console.
- Aucun fichier `.ts` ni `.tsx`. Aucune clé service_role dans `apps/web` ni dans git.
- Les tests passent et le build front réussit.

Termine par un **récapitulatif** :
- ce qui est fait, ce qui ne l'est pas ;
- comment lancer le projet ;
- un **script de démo de 5 minutes** : quoi montrer, dans quel ordre, avec quel compte.
