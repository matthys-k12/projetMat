# Input
Champ texte avec libellé, aide et erreur — shadcn `<Input>` dans un `<FormItem>` (`FormLabel`, `FormDescription`, `FormMessage`).

- Toujours un `<label>` visible (`label` 13 medium) au-dessus ; le placeholder n'est qu'un exemple.
- Hauteur 36px (44px en mobile), bordure `border-input` (3.2:1), rayon `radius-sm`, `shadow-sm`.
- Erreur : bordure `danger`, `aria-invalid="true"`, message sous le champ en `danger-text` avec icône `CircleAlert`, relié par `aria-describedby`. Le message dit quoi faire (« Ne peut pas dépasser la quantité totale (10). »).
- Champ obligatoire : astérisque `danger-text` `aria-hidden` + attribut `required`.
- Icône de tête (recherche) : 16px `muted`, padding gauche 36px.
- Mot de passe : bouton icône `Eye`/`EyeOff` à droite avec `aria-label` « Afficher le mot de passe » et `aria-pressed`.
