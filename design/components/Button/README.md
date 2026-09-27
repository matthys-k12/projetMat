# Button
Bouton d'action — équivalent direct de shadcn `<Button>` (h-9, px-4, rounded-md, text-sm font-medium).

**Variantes** : `default` → `.ir-btn-primary` (fond `primary`, texte `on-primary`) · `outline` (bordure `border-input`, fond `surface`) · `ghost` · `destructive-outline` (Refuser : bordure `danger`, texte `danger-text`) · `destructive` (confirmation d'une action irréversible uniquement, dans un AlertDialog).
**Tailles** : `default` 36px · `sm` 32px (actions de ligne de tableau) · `lg` 44px (mobile, zones tactiles) · `icon` 36×36.

- Un seul bouton `primary` par vue : l'action principale (« Nouvelle demande », « Envoyer la demande », « Approuver »).
- Libellé = verbe à l'infinitif ou action explicite (« Ajouter à la demande », jamais « OK »).
- Icône Lucide 16px à gauche du libellé, facultative. Bouton icône seule : `aria-label` obligatoire.
- Chargement : `disabled` + `aria-busy="true"` + icône `LoaderCircle` qui tourne + libellé au participe (« Connexion… »).
- Focus : anneau 2px `primary`, offset 2px (`focus-visible:ring-2 ring-primary ring-offset-2`).
- Refuser / Approuver : toujours dans cet ordre, Refuser à gauche en outline danger, Approuver à droite en primary.
