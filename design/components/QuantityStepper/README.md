# QuantityStepper
Sélecteur de quantité − / valeur / + — composant maison (deux `Button` ghost + `<output aria-live>`), 36px desktop, 44px mobile (`is-lg`).

- Props : `value`, `min` (1), `max` (stock disponible), `onChange`.
- Au-delà du stock : bordure `danger`, bouton + désactivé, message « Quantité supérieure au stock disponible (N). ».
- La valeur est aussi saisissable au clavier (input numérique masqué derrière l'output).
