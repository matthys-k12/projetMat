# StatusBadge
Badge de statut — pastille 6px + libellé, jamais la couleur seule. Base shadcn `<Badge variant="outline">` avec pastille.

| Statut | Ton | Pastille | Libellé / fond |
| --- | --- | --- | --- |
| En attente | warning | `warning` | `warning-text` sur `warning-subtle` |
| Approuvée | primary | `primary` | `primary-text` sur `primary-subtle` |
| Remise | success | `success` | `success-text` sur `success-subtle` |
| Refusée | danger | `danger` | `danger-text` sur `danger-subtle` |
| Annulée | neutral | `neutral-dot` | `muted-strong` sur `subtle` |
| Disponible / Stock faible / Indisponible | success / warning / neutral | idem | idem |

- Props : `status` (`PENDING`, `APPROVED`, `DELIVERED`, `REFUSED`, `CANCELLED`, `AVAILABLE`, `LOW_STOCK`, `OUT_OF_STOCK`). Le composant fournit libellé et ton : ne jamais passer une couleur.
- Hauteur 22px, rayon `radius-full`, texte `caption` medium.
- Audit : badge `neutral` sans sémantique de couleur (l'action n'est pas un statut).
- Les couleurs vives (`warning`, `success`) ne servent qu'à la pastille : en texte elles échouent au contraste AA sur leur fond.
