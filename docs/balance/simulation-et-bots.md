# Limites de la simulation — et ce que le bot « strategic » modélise

## Ce que j’avais mal compris (et corrigé)

Les premières simulations utilisaient un bot **greedy** : à chaque pli, il calcule la meilleure combo immédiate avec les communes et pose ces cartes. Ce modèle **ignore** :

1. **La pose séquentielle face cachée** — les joueurs qui posent après voient les **badges spéciale** (★) sur les piles déjà posées, sans connaître la carte.
2. **Le Bluff social** — poser une spéciale visible peut faire **peur** et inciter les suivants à ne pas engager leurs cartes fortes.
3. **La construction long terme** — garder en main des cartes qui forment une suite, une couleur, ou un 1-6-13 Prismale sur les **prochains tours**, pas seulement ce pli.

D’où la fausse conclusion « Bluff morte à 0 % » : c’était vrai **pour greedy**, pas pour le jeu PRISME tel que vous le décrivez.

## Bot `strategic` — ce qu’il modélise

| Dimension | Comportement |
|-----------|--------------|
| **Ordre de pose** | Sait qui a déjà posé (`playOrder`, piles visibles). |
| **Pression table** | Compte les spéciales visibles chez les joueurs précédents (`tablePressure`). |
| **Bluff intimidant** | Bonus fort pour poser Bluff **tôt** (idéalement seul, badge visible). |
| **Prudence** | Sous pression, pénalise les grosses poses et les cartes hautes ; favorise Gèle. |
| **Réserve long terme** | Pénalise de jouer des cartes qui servent à une construction future (même couleur, valeurs proches, 1-6-13). |
| **Temporisation** | Si les communes ne servent pas ce tour, préfère garder les cartes structurantes. |

Ce n’est **pas** une IA humaine (pas de dialogue, pas de lecture fine des adversaires), mais une **approximation** des deux axes que vous mentionnez : psychologie séquentielle + planification multi-tours.

## Commandes

```bash
# Bot greedy (ancien — optimiste myope)
npm run simulate -- --bot greedy --games 500 --players 4

# Bot strategic (pose séquentielle + bluff + réserve)
npm run simulate -- --bot strategic --games 500 --players 4

# Comparer les deux sur livret et iter5
npm run simulate:compare-bots -- --games 300 --players 4
```

## Résultats indicatifs (livret, 100 parties, seed 99, bot strategic)

- **Bluff posé ~54 %** des plis (vs ~0 % greedy) — cohérent avec le rôle social.
- Écarts de score toujours élevés — la **capture de points** reste le levier n°1 ; le bot social ne corrige pas seul le snowball structurel.
- Les conclusions d’équilibrage **iter 5 (capture allégée)** restent pertinentes, mais les règles « fun » (Bluff, construction) se mesurent mieux avec `--bot strategic`.

## Prochaines étapes possibles

1. **Playtest humain hot-seat** — seuls les humains ressentent vraiment la peur du badge ★.
2. **Bot plus fin** — modéliser « ajuster sa pose » (plusieurs passes UI) ; mémoire par adversaire.
3. **Re-simuler les 5 itérations** avec `--bot strategic` pour affiner PRISME v2.
4. **Simulation tracée** — document Markdown tour par tour avec commentaires agents :

```bash
npm run simulate:ai -- --seed 4242 --variant iter5 --agents strategic,greedy,strategic,greedy --trace 1
```

Voir `docs/simulations/` pour les comptes rendus générés.
