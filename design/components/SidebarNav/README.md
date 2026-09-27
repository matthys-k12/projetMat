# SidebarNav
Navigation latérale fixe 248px, fond `surface`, bordure droite `border` — shadcn `<Sidebar>`.

- Logo : carré 28px `primary`, icône Lucide `Laptop` 16px `on-primary`, texte « IT Request » semibold.
- Items 36px, icône 16px, `muted-strong` ; actif : fond `subtle`, texte `text`, `aria-current="page"`.
- Groupe « Administration » (libellé `caption` medium `muted`) visible pour le rôle ADMIN uniquement.
- Compteur des notifications non lues : pastille `primary` avec `aria-label` (« 3 non lues »).
- Profil et Déconnexion ancrés en bas, séparés par une bordure.
- Mobile : même contenu dans un drawer (`<Sheet side="left">`, 300px), items 44px.
