# Timeline
Historique vertical d'une demande — composant maison (`<ol>`).

- Jalons : Demande créée → En attente → Approuvée (ou Refusée / Annulée) → Matériel remis.
- Terminé : disque `text` avec coche ; en cours : anneau 2px `primary` + point ; à venir : cercle pointillé, texte `muted`.
- Méta en `caption` : « JJ/MM/AAAA · HH:MM · par Prénom Nom ».
- Refus : le jalon « Refusée » affiche le motif en dessous, en `small`.
