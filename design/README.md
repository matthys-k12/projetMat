IT Request Manager — *Gestion simple et centralisée des demandes de matériel informatique.* Une application SaaS B2B sobre, dense et lisible, dans l'esprit de Linear, Vercel Dashboard et Stripe Dashboard. Ce système décrit les fondations, les composants (alignés sur shadcn/ui) et les 15 écrans du produit, en desktop 1440px et en mobile 390px.

## Principes

- **Chaque couleur a une fonction.** Le produit est neutre (slate) ; `primary` désigne l'action et le focus ; `success`, `warning`, `danger` ne servent qu'aux statuts et aux erreurs. Aucune couleur décorative.
- **La structure vient des bordures, pas des ombres.** Une seule ombre (`shadow-sm`), des bordures `border` 1px, beaucoup d'espace `background` entre les surfaces.
- **Densité maîtrisée.** Texte courant en `body` 14/20, tableaux à 52px par ligne (48px pour l'admin), contrôles à 36px (44px en mobile).
- **Interdits** : grilles de cartes KPI colorées, dégradés, néons, glassmorphism, ombres portées lourdes, illustrations génériques, emoji.

## Contenu et ton

- Interface 100 % en français, vouvoiement, phrases courtes. Majuscule initiale uniquement (« Nouvelle demande », pas « Nouvelle Demande »).
- Les boutons disent ce qu'ils font : « Ajouter à la demande », « Envoyer la demande », « Conserver la demande » / « Annuler la demande ». Jamais « OK », « Oui », « Valider » seul.
- Les erreurs expliquent et proposent : « Quantité supérieure au stock disponible (3). », « Le motif du refus est obligatoire. », « E-mail ou mot de passe incorrect ».
- Les confirmations nomment l'objet : « Demande REQ-2026-000013 envoyée ».
- Références au format `REQ-AAAA-NNNNNN`, en mono (`reference`). Dates `JJ/MM/AAAA`, heures `HH:MM`, dates relatives pour les notifications (« il y a 2 h », « hier à 17:02 »).
- Vocabulaire des statuts, figé : **En attente**, **Approuvée**, **Remise**, **Refusée**, **Annulée** ; **Disponible**, **Stock faible**, **Indisponible**. L'onglet de filtre des approuvées s'intitule « Acceptées ».

## Couleur

- Fond de page `background`, surfaces `surface`, séparateurs `border`, texte `text`, secondaire `muted`.
- Sur `subtle` (navigation active, segmented control, badge neutre), le texte secondaire est `muted-strong` : `muted` y tombe à 4.34:1.
- `primary` : un seul bouton plein par vue, les liens, l'anneau de focus, la courbe du graphique, le point non lu.
- Couleurs de statut : la teinte vive (`warning`, `success`, `danger`) colore la **pastille** ; le **libellé** utilise la variante `-text`, seule à passer AA sur les fonds `-subtle`. Voir `StatusBadge`.
- `panel` (#0F172A) n'apparaît que sur le panneau droit de l'écran de connexion.
- Les champs utilisent `border-input` (#8391A6, 3.2:1) et non `border` (1.23:1) : c'est le seul écart volontaire par rapport à la palette de départ, pour respecter WCAG 1.4.11.

## Typographie

- Inter (Google Fonts, 400/500/600) partout ; chiffres en `tabular-nums` dans les tableaux et KPI.
- Échelle : `heading-1` 24/32 (titre de page, un par vue) · `heading-2` 20/28 · `heading-3` 16/24 (titres de cartes et dialogs) · `body` 14/20 · `small` 13/18 · `caption` 12/16 · `label` 13 medium.
- Les références de demande utilisent `reference` (JetBrains Mono 13 medium).

## Espace, rayons, ombre

- Grille de 4px : `space-1` 4 · `space-2` 8 · `space-3` 12 · `space-4` 16 · `space-6` 24 · `space-8` 32 · `space-12` 48.
- Padding du contenu desktop `space-8`, écart entre sections `space-6`, padding de carte 20px (16px en compact), marge mobile `space-4`.
- `radius-sm` 6px pour boutons, champs, navigation ; `radius-lg` 10px pour cartes, dialogs, toasts ; `radius-full` pour badges et avatars.
- `shadow-sm` uniquement.

## Layout

- **Desktop 1440px** : sidebar fixe `sidebar-width` 248px (fond `surface`, bordure droite) + header `header-height` 64px (fil d'Ariane, cloche avec pastille, menu avatar). Contenu : padding 32px, largeur max `content-max`.
- En-tête de page : `heading-1` + une phrase `muted` à gauche, actions à droite (outline puis primary).
- Pages de détail : colonne principale + colonne droite de 340px (résumé sticky ou timeline).
- **Mobile 390px** : header 56px avec bouton menu (drawer 300px), titre de page dans le contenu, tableaux transformés en listes de cartes-liens, barre d'action collée en bas pour l'action principale, toutes les cibles tactiles ≥ `touch-target` 44px.

## Accessibilité

- Contraste WCAG AA vérifié pour chaque paire texte/fond indiquée dans les notes des tokens.
- Focus visible partout : anneau 2px `primary`, offset 2px (`focus-visible:ring-2 ring-primary ring-offset-2`).
- Chaque champ a un `<label>` visible ; les erreurs s'affichent sous le champ, reliées par `aria-describedby`, avec `aria-invalid`.
- Un statut n'est jamais porté par la couleur seule : pastille + libellé.
- Boutons icône seule : `aria-label` explicite (« Supprimer Dell Latitude 5440 », « Notifications, 3 non lues »).
- Toasts : `role="status"` (succès) ou `role="alert"` (erreur). Dialogs : focus piégé, Échap pour fermer.
- Animations (skeleton, spinner) coupées avec `prefers-reduced-motion`.

## Iconographie

- Lucide (`lucide-react`), trait 2px, 16px dans les contrôles et la navigation, 20px dans les toasts et états vides, `currentColor`.
- Icônes clés : `Laptop` (logo), `LayoutDashboard`, `Package`, `FileText`, `Bell`, `ClipboardList`, `Boxes`, `FolderTree`, `History`, `User`, `LogOut`, `Search`, `Plus`, `Minus`, `Trash2`, `Eye`/`EyeOff`, `CircleCheck`, `CircleAlert`, `TriangleAlert`, `Inbox`, `Upload`.
- Pas de photo produit fournie : les visuels 4:3 du catalogue affichent l'icône Lucide de la catégorie (`Laptop`, `Monitor`, `Mouse`, `Headphones`, `Cable`, `HardDrive`) en `muted` sur `subtle`, à remplacer par de vraies photos détourées sur fond clair.
- Logo : aucun fichier de marque fourni ; le logo est le carré `primary` + `Laptop` + « IT Request » en Inter semibold, construit en code (voir `SidebarNav`).

## Écrans

Les maquettes haute fidélité sont dans les groupes **Écrans · Utilisateur**, **Écrans · Administration**, **Écrans · Mobile 390** et **États** : connexion, tableau de bord, catalogue, détail matériel, nouvelle demande, mes demandes, détail demande, notifications, et pour l'admin dashboard, demandes, détail demande, matériels, formulaire matériel, catégories, audit. Les états skeleton, vide, erreur et toast y sont représentés. La section « Intégration » donne les variables CSS et la configuration Tailwind prêtes à coller.
