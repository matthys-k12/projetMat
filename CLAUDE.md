# CLAUDE.md — IT Request Manager

Projet d'entretien technique. Priorité absolue : **un P0 fini, propre et démontrable** plutôt qu'un projet large et cassé. Chaque fichier doit pouvoir être expliqué à l'oral.

## Architecture (3 tiers, monolithe modulaire, JavaScript uniquement)

```
apps/web  (React + Vite, JSX)     → tier présentation
   │  HTTP / REST / JSON  (Authorization: Bearer <supabase access_token>)
apps/api  (Express 5, ESM)        → tier métier : validation, autorisations, règles
   │  supabase-js avec SERVICE_ROLE (serveur uniquement)
supabase/ (PostgreSQL + Auth + Storage) → tier données
```

**Pourquoi Express et pas NestJS** : Express est plus simple à expliquer en JavaScript ; l'architecture en couches (route → middlewares → contrôleur → service → Supabase) y est rendue explicite à la main ; NestJS apporte peu sans TypeScript (décorateurs, injection typée).

Règles non négociables :
- **Aucun fichier `.ts` / `.tsx`.** La forme des données est documentée en JSDoc (`@typedef`, `@param`, `@returns`).
- Le front utilise le SDK Supabase **uniquement pour l'authentification** (`signInWithPassword`, `signOut`, `getSession`, `onAuthStateChange`). Toute donnée métier passe par l'API `/api/v1`.
- `SUPABASE_SERVICE_ROLE_KEY` n'existe que dans `apps/api/.env`. Jamais dans `apps/web`, jamais dans git.
- RLS activé sur toutes les tables sans policy : anon/authenticated n'accèdent à rien directement.
- Le rôle vient de `public.profiles.role`, **jamais** de `user_metadata`. L'identité vient uniquement de `req.utilisateur` (le token), jamais du body ni de la query.
- Toute évolution du schéma = nouvelle migration dans `supabase/migrations/`. Ne jamais modifier une migration déjà appliquée.
- Pas de microservices.

## Langue du code

- **Français** : noms de fichiers, fonctions, variables, composants, hooks, commentaires, messages d'erreur, logs, libellés de tests.
- **Anglais (contrat figé)** : tables et colonnes SQL, noms des RPC, statuts techniques (`PENDING`…), URLs de l'API (`/api/v1/requests`…).
- Le JSON renvoyé par l'API est en **camelCase français** (`quantiteDisponible`, `categorie`, `dateCreation`, `statut`), converti dans `apps/api/src/utils/convertisseurs.js`.

## Structure

```
apps/api/src/
  server.js  app.js (exportée pour les tests)
  config/        env.js (zod), supabase.js (client service_role)
  middlewares/   authentification.js, autorisation.js, validation.js, gestionErreurs.js
  utils/         ErreurApi.js, pagination.js, convertisseurs.js, journalAudit.js
  modules/<m>/   <m>.routes.js → <m>.controleur.js → <m>.service.js (+ <m>.schemas.js)
                 auth, materiels, categories, demandes (+ machineEtat.js), notifications, tableauDeBord, audit, sante
  docs/openapi.yaml   servi sur /api/docs
apps/api/tests/  Vitest + Supertest (Supabase mocké)
apps/api/scripts/seed-demo.js

apps/web/src/
  app/           routeur.jsx, fournisseurs.jsx, miseEnPage/
  components/ui  shadcn (JSX)   components/communs  BadgeStatut, EtatVide, EtatErreur, EnTetePage, Pagination…
  fonctionnalites/<f>/  api.js (HTTP), hooks.js (TanStack Query), schemas.js (zod), pages et composants
  lib/           clientApi.js, supabase.js (clé ANON), formatage.js, constantes.js, utils.js
```

## Base de données (déjà déployée, dans supabase/migrations)

Tables : profiles, categories, materials, requests, request_items, request_status_history, notifications, audit_logs.
`materials.is_low_stock` est une colonne générée (filtrable directement).

**Les écritures sur les demandes passent OBLIGATOIREMENT par les fonctions RPC** (atomiques, verrous `FOR UPDATE`, historique, notification, audit inclus) :

| RPC | Paramètres | Retour |
|---|---|---|
| `create_request` | p_user_id, p_reason, p_items `[{material_id, quantity}]` | uuid |
| `approve_request` | p_request_id, p_admin_id, p_comment? | void |
| `reject_request` | p_request_id, p_admin_id, p_comment | void |
| `cancel_request` | p_request_id, p_user_id | void |
| `fulfill_request` | p_request_id, p_admin_id | void |
| `get_user_dashboard_stats` | p_user_id | jsonb |
| `get_admin_dashboard_stats` | — | jsonb |

Les RPC lèvent des exceptions dont le `message` est un code métier (le `details` contient le contexte). Mapping HTTP dans `middlewares/gestionErreurs.js` :

| Code | HTTP |
|---|---|
| REQUEST_NOT_FOUND | 404 |
| FORBIDDEN, USER_NOT_ALLOWED | 403 |
| INVALID_TRANSITION, INSUFFICIENT_STOCK | 409 |
| EMPTY_REQUEST, INVALID_REASON, INVALID_QUANTITY, DUPLICATE_MATERIAL, MATERIAL_UNAVAILABLE, INVALID_COMMENT | 422 |
| code PG 23514 (check violation), 23505 (unique) | 422 / 409 |

Format d'erreur API : `{ statusCode, code, message (FR, lisible), details? }`
Format de liste paginée : `{ data: T[], meta: { page, limite, total, totalPages } }` (limite plafonnée à 50).

La machine d'état est **aussi** codée en JS (`modules/demandes/machineEtat.js`) pour échouer tôt et être testée ; la base reste la garantie finale.
Transitions autorisées : PENDING→APPROVED, PENDING→REJECTED, PENDING→CANCELLED, APPROVED→FULFILLED.

## Auth

1. Front : `supabase.auth.signInWithPassword` → session → `access_token`.
2. `clientApi.js` ajoute `Authorization: Bearer <token>` à chaque requête ; sur 401 → signOut + redirection /login.
3. Middleware `authentification` (sur tout `/api/v1` sauf `/health`) : `supabase.auth.getUser(token)` → charge `profiles` → refuse si absent ou `active = false` → `req.utilisateur = { id, email, role, prenom, nom }`.
4. `exigerRole('ADMIN')` sur tout le routeur `/admin`.
5. Le menu Administration côté front n'est que du confort visuel.

## Conventions

- Code simple : fonctions courtes, pas de ternaires imbriqués, pas d'abstraction inutile.
- En-tête de fichier (rôle, tier, utilisateurs) + JSDoc en français sur chaque fonction ; commenter le POURQUOI.
- Validation zod côté API **et** côté front (mêmes règles : quantité ≥ 1, motif 10–1000 caractères, commentaire de refus obligatoire).
- Libellés de statut centralisés dans `apps/web/src/lib/constantes.js` (« En attente », « Approuvée », « Remise », « Refusée », « Annulée » ; onglet « Acceptées »).
- Query keys TanStack : `['materiels', params]`, `['demandes', 'miennes', params]`, `['demandes', id]`, `['admin', 'demandes', params]`… Invalider après mutation.
- UI fidèle aux maquettes de `design/` (tokens dans `design/implementation.md`).
- Commits conventionnels en français : `feat(api): ...`, `feat(web): ...`, `test: ...`, `docs: ...`.

## Variables d'environnement

`apps/api/.env` : `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PORT=3000`, `WEB_URL=http://localhost:5173`
`apps/web/.env` : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL=http://localhost:3000/api/v1`

## Commandes

```
npm install
npm run dev          # API http://localhost:3000/api/docs + web http://localhost:5173
npm test             # tests API + web
npm run lint
npm run build        # build du front
npm run seed:demo    # comptes et demandes de démo (nécessite apps/api/.env)
supabase db push     # applique les migrations sur le projet lié
```
