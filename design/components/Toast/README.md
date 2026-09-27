# Toast
Notification éphémère — shadcn `<Sonner>` (toast), en bas à droite, 356px.

- Fond `surface`, bordure `border`, `shadow-sm` ; seule l'icône porte la couleur (`CircleCheck` `success`, `CircleAlert` `danger`).
- Titre = résultat factuel avec l'objet (« Demande REQ-2026-000013 envoyée »), description = suite.
- Succès : `role="status"`, 5 s. Erreur : `role="alert"`, reste jusqu'à fermeture.
