# DataTable
Tableau de données — shadcn `<Table>` + TanStack Table, dans une `Card` sans padding.

- En-têtes : `caption` medium `muted` sur `background`, hauteur 40px. Lignes 52px (48px en `is-dense` pour l'admin), séparateur `border`, survol `background`.
- Référence en mono medium ; nombres alignés à droite en tabular-nums ; dates JJ/MM/AAAA.
- Colonne d'action à droite, `sm` ghost (« Voir ») ou outline (« Examiner » pour ce qui attend une décision).
- Barre de filtres dans le `card-head`, pagination dans le `card-foot`.
- En mobile (< 768px), chaque ligne devient une carte-lien de 64px min (référence, date · nb, badge, chevron).
