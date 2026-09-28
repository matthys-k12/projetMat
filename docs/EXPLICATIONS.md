# Guide pour l'oral — IT Request Manager

Ce document explique le projet en français simple, fichier par fichier, pour pouvoir le
présenter et répondre aux questions.

---

## 1. Parcours complet d'une demande : du clic à la base, puis retour à l'écran

**Point de départ** : Aya a ajouté un « Adaptateur USB-C » depuis la fiche matériel. Le panier
est gardé dans `ContextePanier.jsx` (et dans `sessionStorage`, pour survivre à un rechargement).

### Côté navigateur (tier présentation)

1. **`apps/web/src/fonctionnalites/demandes/PageNouvelleDemande.jsx`**
   Affiche les lignes du panier et le motif. À chaque rendu, le formulaire est validé par
   `schemas.js` (zod) : au moins un matériel, pas de doublon, quantité entre 1 et le stock,
   motif de 10 à 1000 caractères. Le stock affiché est relu dans le catalogue à jour, pas dans
   le panier (il a pu changer depuis).
2. Clic sur **« Envoyer la demande »** (`ResumeDemande.jsx`) → fonction `envoyer()` : si la
   validation passe, elle appelle `creation.mutateAsync(...)`.
3. **`demandes/hooks.js` → `useCreerDemande()`** : une mutation TanStack Query qui appelle
   `api.creerDemande(corps)`.
4. **`demandes/api.js` → `creerDemande()`** : `appelerApi('/requests', { methode: 'POST', corps })`.
5. **`lib/clientApi.js` → `appelerApi()`** : récupère le token de la session Supabase
   (`supabase.auth.getSession()`), ajoute `Authorization: Bearer <token>`, envoie le JSON
   `{ motif, articles: [{ materielId, quantite }] }`.

### Côté serveur (tier métier)

6. **`apps/api/src/app.js`** : `helmet` (en-têtes de sécurité), `cors` (seul le front est
   autorisé), `express.json({ limit: '100kb' })`, puis le routeur `/api/v1`.
7. **`middlewares/authentification.js`** : lit le token, appelle `supabase.auth.getUser(token)`
   (Supabase vérifie la signature et l'expiration), charge le profil dans `profiles`, refuse si
   absent ou désactivé, puis remplit `req.utilisateur = { id, email, role, prenom, nom }`.
8. **`modules/demandes/demandes.routes.js`** : `POST /` → `valider({ body: schemaCreationDemande })`.
9. **`middlewares/validation.js`** : zod revalide le corps (on ne fait jamais confiance au
   navigateur). En cas d'erreur : 422 avec un message français par champ.
10. **`demandes.controleur.js` → `creer()`** : appelle le service avec `req.utilisateur`
    (l'identité vient **du token**, jamais du corps de la requête).
11. **`demandes.service.js` → `creerDemande()`** : appelle la RPC
    `create_request(p_user_id, p_reason, p_items)`.

### Côté base (tier données)

12. **`create_request`** (fonction PL/pgSQL) : vérifie que le compte est actif, le motif, les
    quantités, l'absence de doublon, la disponibilité des matériels ; insère la demande (la
    référence `REQ-2026-000013` vient d'une SEQUENCE), ses articles, la première ligne
    d'historique (`PENDING`) et une ligne d'audit. **Tout dans une seule transaction.**

### Retour à l'écran

13. Le service relit la demande complète (`lireDemande`) et le contrôleur répond **201** avec
    le JSON converti en français par `utils/convertisseurs.js`.
14. Dans `PageNouvelleDemande.jsx` : toast « Demande REQ-2026-000013 envoyée », panier vidé,
    redirection vers `/requests/:id`. `useCreerDemande` a invalidé les requêtes `['demandes']`
    et `['materiels']` : les listes et compteurs se rechargent automatiquement.

Si la base refuse (ex. stock épuisé entre-temps), elle lève `INSUFFICIENT_STOCK` ;
`middlewares/gestionErreurs.js` la traduit en **409** « Stock insuffisant. Casque… : demandé 1,
disponible 0. », que le front affiche dans un toast d'erreur.

---

## 2. Parcours d'une approbation, et pourquoi le stock ne devient jamais négatif

**Chemin** : `PageAdminDetailDemande.jsx` → `ActionsDecision.jsx` (AlertDialog de
confirmation) → `admin/demandes/hooks.js` (`useApprouverDemande`) → `PATCH
/admin/requests/:id/approve` → `authentification` → `exigerRole('ADMIN')` → `valider` →
`demandes.controleur.js` → `demandes.service.js` → `approuverDemande()`.

Dans le service :
1. `lireEtatDemande(id)` lit le statut actuel ;
2. `verifierTransition(statut, 'APPROVED')` (`machineEtat.js`) : si la demande n'est plus en
   attente → **409** tout de suite, sans appeler la base ;
3. appel de la RPC **`approve_request`**.

Dans la base, `approve_request` fait, **dans une seule transaction** :
1. vérifie que l'acteur est un admin actif ;
2. **verrouille la demande** (`SELECT … FOR UPDATE`) et revérifie la transition ;
3. **verrouille les lignes de stock** des matériels concernés, triées par `id` (même ordre pour
   tout le monde → pas d'interblocage) ;
4. vérifie le stock **sous verrou** ; s'il manque → exception `INSUFFICIENT_STOCK` → ROLLBACK ;
5. décrémente le stock, passe la demande à `APPROVED`, écrit historique, audit et notification.

**Deux admins qui cliquent en même temps** : le premier prend les verrous ; le second attend.
Quand le premier valide, le second reprend la main et **relit** la demande : elle est déjà
`APPROVED` → `INVALID_TRANSITION` → 409. S'il s'agit de deux demandes différentes sur le même
matériel, le second voit le stock déjà décrémenté → `INSUFFICIENT_STOCK` → 409.

**Troisième filet** : la contrainte `CHECK (available_quantity >= 0)` sur `materials`. Même
avec un bug dans la fonction, PostgreSQL refuserait d'écrire un stock négatif.

Pourquoi le contrôle Node **et** le contrôle SQL ? Le contrôle Node donne une erreur rapide et
facile à tester unitairement ; le contrôle SQL, sous verrou, est la seule garantie contre les
accès simultanés (entre la lecture Node et la RPC, un autre admin a pu agir).

---

## 3. Authentification, rôles, et pourquoi le navigateur ne peut pas tricher

1. **Connexion** (`PageConnexion.jsx` → `ContexteAuth.jsx`) : `supabase.auth.signInWithPassword`
   avec la clé **anon**. Supabase renvoie un `access_token` (JWT signé, durée courte).
2. **Profil** : le front appelle `GET /auth/me` ; le rôle affiché vient de la base.
3. **Chaque requête** : `clientApi.js` ajoute le token ; sur 401, déconnexion et retour à `/login`.
4. **Côté API** : `authentification.js` vérifie le token **auprès de Supabase** puis lit
   `profiles.role` ; `autorisation.js` (`exigerRole('ADMIN')`) protège **tout** le routeur `/admin`.

Pourquoi c'est sûr :
- **Modifier le JavaScript** (afficher le menu admin) ne sert à rien : l'API répond 403.
- **Modifier `user_metadata`** (possible pour un utilisateur) ne change pas son rôle : le rôle
  est lu dans `profiles`, que seul le serveur peut écrire.
- **Appeler Supabase directement** avec la clé anon : RLS activée sans policy et droits
  révoqués → aucune table lisible, aucune RPC exécutable.
- **Voler la clé service_role** : impossible depuis le navigateur, elle n'existe que dans
  `apps/api/.env` (jamais dans le front, jamais dans git).
- **Voir la demande d'un autre** : `GET /requests/:id` répond **404** (et non 403) pour ne pas
  révéler qu'elle existe.

---

## 4. Organisation des dossiers et rôle de chaque couche

```
apps/api/src/
  server.js / app.js     démarrage / assemblage (app exportée pour les tests Supertest)
  config/                env.js (variables validées par zod, arrêt si invalide), supabase.js
  middlewares/           authentification, autorisation (rôle), validation (zod), gestionErreurs
  utils/                 ErreurApi, pagination, convertisseurs (SQL → JSON français), journalAudit
  modules/<module>/      routes → contrôleur → service (+ schémas zod)
apps/web/src/
  app/                   routeur, fournisseurs (QueryClient, auth, panier, toasts), mise en page
  components/ui          composants shadcn (générés)
  components/communs     BadgeStatut, EtatVide, EtatErreur, Chronologie, SelecteurQuantite…
  fonctionnalites/<f>/   api.js (HTTP) → hooks.js (TanStack Query) → pages et composants
  lib/                   clientApi, supabase (auth), formatage (dates FR), constantes (libellés)
supabase/migrations      schéma, fonctions RPC, sécurité (RLS)
```

| Couche | Responsabilité | N'a PAS le droit de… |
|---|---|---|
| Route | associer une URL à une chaîne de middlewares | contenir de la logique |
| Middleware | authentifier, vérifier le rôle, valider | accéder aux données métier |
| Contrôleur | lire la requête validée, appeler le service, répondre | contenir des règles métier |
| Service | règles métier, appels Supabase / RPC | connaître Express (req/res) |
| RPC SQL | transaction, verrous, cohérence finale | — |
| Front `api.js` | appels HTTP | gérer le cache |
| Front `hooks.js` | cache, invalidation après mutation | faire du HTML |
| Front pages | affichage, états chargement / vide / erreur | appeler `fetch` directement |

---

## 5. Dix questions probables et réponses courtes

1. **Pourquoi Express et pas NestJS ?**
   En JavaScript sans TypeScript, NestJS perd l'essentiel de son intérêt (décorateurs, injection
   typée). Express rend les couches explicites et simples à expliquer.

2. **Pourquoi des fonctions SQL plutôt que du code Node pour approuver ?**
   supabase-js ne permet pas de transaction multi-requêtes. Une fonction PL/pgSQL est une
   transaction : stock, statut, historique, notification et audit sont validés ou annulés ensemble.

3. **Que se passe-t-il si deux admins approuvent la même demande en même temps ?**
   Verrou `FOR UPDATE` : le second attend, relit la demande déjà approuvée et reçoit un 409.

4. **Comment évitez-vous un stock négatif ?**
   Trois barrières : vérification sous verrou dans la RPC, contrainte `CHECK >= 0`, et un
   pré-contrôle visuel côté admin (« Stock actuel » en rouge).

5. **Où est la sécurité : front ou back ?**
   Dans l'API et la base. Le front masque des menus par confort ; l'API vérifie token, rôle
   (lu en base) et données ; la base est fermée par RLS.

6. **Pourquoi valider avec zod à la fois dans le front et dans l'API ?**
   Le front pour un retour immédiat à l'utilisateur ; l'API parce qu'on ne fait jamais
   confiance au client (quelqu'un peut appeler l'API avec curl).

7. **Pourquoi renvoyer 404 et pas 403 pour la demande d'un autre ?**
   Un 403 confirmerait que la référence existe ; 404 ne révèle rien.

8. **Comment la référence REQ-2026-000013 est-elle générée ?**
   Par une SEQUENCE PostgreSQL : unique même sous forte concurrence. Des trous sont possibles
   après un rollback, c'est accepté.

9. **Comment testez-vous sans toucher à la vraie base ?**
   Le client Supabase est remplacé par un faux (`tests/fauxSupabase.js`) avec `vi.mock` ;
   Supertest appelle l'app Express en mémoire, sans ouvrir de port.

10. **Qu'amélioreriez-vous avec plus de temps ?**
    Réaligner les fichiers de migration sur la base déployée, rendre l'audit des matériels
    atomique (RPC), ajouter Playwright et une CI GitHub Actions, notifications temps réel.
