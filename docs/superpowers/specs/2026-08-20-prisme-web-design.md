# PRISME — Prototype web d’équilibrage

Date : 2026-08-20  
Statut : design validé (chat)

## Objectif

Prototype web jouable localement pour tester et ajuster les règles du jeu de cartes **PRISME**, sans réseau ni comptes. Priorité : fidélité au livret + panneau d’équilibrage pour changer les paramètres à chaud (nouvelle partie).

## Contexte produit

- 2 à 6 joueurs, hot-seat (un seul écran, humains qui se passent l’ordinateur).
- Pas d’IA, pas de multijoueur réseau dans cette version.
- Règles de base = livret fourni ; les écarts doivent être configurables, pas codés en dur.

## Stack

- **React + Vite + TypeScript**
- Logique de jeu en modules purs (testables sans DOM)
- UI React (composants) branchée sur un store d’état de partie
- Tests unitaires Vitest sur le moteur (combinaisons, pouvoirs, score, fin de partie)

## Architecture

```
src/
  engine/          # règles pures : deck, combinaisons, pouvoirs, score, tour
  rules/           # objet RulesConfig (valeurs par défaut = livret) + validation
  state/           # machine de partie (phases, actions joueur)
  ui/              # écrans React : Accueil, Table, Rideau, Fin, BalancePanel
  styles/          # thème coloré des 6 couleurs PRISME
```

### Séparation moteur / UI

- Le moteur ne connaît pas React : il expose des types (`Card`, `Player`, `GameState`, `RulesConfig`) et des fonctions pures / une API d’actions (`startGame`, `revealCommons`, `playCards`, `resolveTrick`, …).
- L’UI lit l’état et dispatch des actions. Aucune règle métier dans les composants.

### RulesConfig (data-driven)

Un seul objet décrit le jeu. Le panneau d’équilibrage édite une copie ; « Appliquer » démarre une **nouvelle partie** avec cette config (pas de mutation mid-pose).

Champs inclus (non exhaustif, mais contractuel pour le panneau) :

- Couleurs nommées + palette UI
- Plage de valeurs numérotées (défaut 1–13) et nombre d’exemplaires par couleur
- Copies de chaque spéciale (Inversion, Prisme, Gèle, Ajoute, Échange, Bluff)
- Tableau de distribution : `{ players, handSize, commonsPerTurn }`
- Hiérarchie des combinaisons (rang 1–12 + Prismale au-dessus de tout)
- Paliers de points (numérotées + spéciales)
- Bonus de fin de partie (+plis, +main finale, +3 derniers tours sans défaite)
- Contraintes de pose : min/max cartes par tour (défaut 1–3)

## Flux de partie

### Accueil

- Nombre de joueurs 2–6, noms (défaut Joueur 1…N)
- Bouton nouvelle partie
- Accès au panneau d’équilibrage (peut aussi rester ouvert pendant la partie en lecture/édition, mais appliquer = reset)

### Mise en place

1. Construire le deck (78 numérotées + 22 spéciales selon RulesConfig), mélanger.
2. Choisir un distributeur au hasard.
3. Distribuer selon le tableau.
4. Reste = pioche face cachée.

### Tour — 5 phases

1. **Révélation des communes** — N cartes depuis la pioche. Spéciales parmi les communes : activation dès le début de la phase 2 (avant pose), dans l’ordre global des spéciales.
2. **Pose secrète** — chaque joueur, à son tour hot-seat, pose 1–3 cartes. Numérotées face cachée ; spéciales face visible au sommet (identité cachée côté UI : badge « spéciale », type révélé en phase 3). Rideau entre joueurs.
3. **Révélation simultanée** — toutes les piles retournées ; chaque joueur annonce / le moteur calcule la meilleure combinaison (cartes posées numériques + tout ou partie des communes). Spéciales jouées depuis la main : **n’entrent pas** dans la combinaison, s’activent après révélation, avant résolution du pli.
4. **Résolution du pli** — applique les effets, compare, capture.
5. **Pioche** — vainqueur d’abord, puis sens horaire jusqu’à taille de main cible. Nouveau distributeur = à gauche de l’ancien.

### Ordre des spéciales (même tour)

1. Ajoute une carte  
2. Prisme  
3. Inversion  
4. Échange de jeu  
5. Gèle  
Bluff : aucun effet mécanique.

Effets (fidèles au livret) :

- **Inversion** : 1 fort, 13 faible pour ce tour (comparaisons + départages).
- **Prisme** : seules Couleur et Couleur royale valent ; sinon carte haute.
- **Gèle** : si le joueur ne gagne pas le pli, ses cartes posées lui reviennent en main (pas dans la pile du vainqueur).
- **Ajoute une carte** : +1 commune depuis la pioche.
- **Échange de jeu** : cible choisie à l’aveugle avant la révélation des mains adverses ; après révélation, échange intégral des cartes posées ce tour.
- **Bluff** : cosmétique (badge spéciale visible).

Spéciale en commune : compte comme sa couleur assignée pour les combos de type Couleur (pas de valeur numérique).

### Combinaisons (faible → fort)

1 Carte haute · 2 Paire · 3 Double paire · 4 Brelan · 5 Petite suite (3) · 6 Écho (suite 3 mono-couleur) · 7 Grande suite (5) · 8 Full · 9 Carré · 10 Couleur (5 même couleur) · 11 Arc-en-ciel (6 couleurs) · 12 Couleur royale (6 couleurs + valeurs consécutives).

**Prismale** : 1 + 6 + 13 de la même couleur — bat tout, y compris Couleur royale.

Départage même rang : valeur haute de la combo (inversée si Inversion). Égalité totale : somme des valeurs des cartes de la combo ; encore égal → chaque joueur concerné pioche 1 carte, plus haute gagne ; ces cartes rejoignent la pile du vainqueur. Pioche vide au départage : reconstituer depuis la défausse si existante ; sinon départage par somme des mains restantes.

### Capture

Vainqueur prend : cartes posées de tous (sauf Gèle des perdants) + communes → pile de points. Les cartes Gèle des perdants reviennent en main.

### Fin de partie

Après le pli où la pioche est épuisée (y compris pendant pioche/départage selon règles ci-dessus). Cartes restantes en main = 0 pt.

Score : chaque carte capturée selon paliers (1–5 → 1 ; 6–10 → 2 ; 11–13 → 3 ; Bluff → 1 ; Gèle/Ajoute → 2 ; Inversion/Prisme/Échange → 3). Bonus : +6 plus de plis ; +3 main finale la plus forte ; +5 aucun pli perdu sur les 3 derniers tours. Égalité score → plus de plis ; encore égal → victoire partagée.

## UI

- Thème sombre coloré, 6 couleurs distinctes (Or, Sarcelle, Bleu nuit, Vert, Rouge, Orange).
- Cartes : valeur + pastille couleur ; spéciales : nom + couleur assignée.
- Table : communes, compteur pioche, zones joueurs (score provisoire, plis, cartes posées).
- Journal de tour : combo de chacun, effets activés, vainqueur, points du pli.
- Rideau hot-seat obligatoire avant d’afficher une main.
- Panneau Balance : formulaires numériques / listes pour RulesConfig ; boutons Réinitialiser (livret) / Appliquer (nouvelle partie).

## Hors scope (v1)

- Multijoueur réseau, comptes, sauvegarde cloud
- IA adversaire
- Animations avancées / sons obligatoires
- Édition de règles appliquée mid-tour sans reset
- Mode spectateur / replay vidéo

## Critères de succès

1. Partie 2–6 joueurs jouable de bout en bout selon le livret.
2. Toutes les spéciales et la Prismale se comportent comme décrit.
3. Panneau d’équilibrage modifie au moins : copies spéciales, tailles de main/communes, rangs de combos, paliers de points, bonus — et une nouvelle partie utilise ces valeurs.
4. Tests Vitest couvrent évaluation de combos, ordre des pouvoirs, score et fin de partie.
5. `npm run dev` lance le proto localement.

## Décisions tranchées

| Sujet | Décision |
|--------|----------|
| Mode | Hot-seat uniquement |
| Stack | React + Vite + TypeScript |
| Équilibrage | Panneau tunable ; appliquer = nouvelle partie |
| Spéciale au sommet | Badge « spéciale » visible ; type révélé phase 3 |
| Pose | Min 1, max 3 (configurables) |
| Passer | Interdit (min 1 carte) |
