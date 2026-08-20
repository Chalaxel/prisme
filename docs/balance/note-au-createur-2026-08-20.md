# Note au créateur de PRISME

**Date :** 20 août 2026  
**Destinataire :** créateur·rice du jeu PRISME  
**Objet :** synthèse d'une session de travail (équilibrage, simulations, pistes de règles v2)

---

## 1. Contexte de cette note

Cette note résume une conversation de travail autour du prototype web **PRISME** (React/TypeScript). L'objectif n'était pas de refaire l'interface, mais de **comprendre et dynamiser les règles** à l'aide d'outils de simulation reproductibles, puis de formuler des propositions concrètes pour vos prochains playtests.

Tout le code (moteur, simulateur, traces) est dans le dépôt ; vous pouvez rejouer les scénarios vous-même (voir section 6).

---

## 2. Ce qui a été mis en place

### 2.1 Simulateur batch (500+ parties)

- Bots jouant des parties complètes avec métriques : écart de score, blowouts, snowball de plis, usage des spéciales, combo gagnante la plus fréquente, etc.
- **5 itérations de règles** testées séquentiellement (`iter1` livret → `iter5` capture allégée).
- Rapport détaillé : `docs/balance/2026-08-20-iterations-bilan.md`.

### 2.2 Bots plus intelligents

Deux niveaux de bots :

| Bot | Rôle |
|-----|------|
| **greedy** | Maximise la combo immédiate — utile pour tester la mécanique pure, mais **sous-estime le Bluff** et la pose séquentielle. |
| **strategic** | Modélise l'ordre de pose, la pression des badges ★ visibles, le bluff early, la prudence sous pression, et la **construction long terme** (garder des cartes pour les prochains pots). |

Documentation : `docs/balance/simulation-et-bots.md`.

### 2.3 Simulation tracée « agents explicables » (nouveau)

Commande :

```bash
npm run simulate:ai -- --seed 4242 --variant iter5 --agents strategic,greedy,strategic,greedy --trace 1
```

Pour chaque partie, un **document Markdown tour par tour** est généré dans `docs/simulations/`, contenant :

- les **communes** et modificateurs du tour ;
- pour **chaque joueur**, dans l'ordre de pose : main, table visible, cartes jouées ;
- la **stratégie** déclarée et un **commentaire en français** expliquant pourquoi l'agent a joué ainsi ;
- la **résolution** : combos, vainqueur, capture, points cumulés.

**Précision importante :** ce ne sont pas des appels à un LLM externe (ChatGPT, etc.). Ce sont des **agents heuristiques auditable** — reproductibles à seed identique, avec une logique de scoring commentée. Ils approximent une « vraie IA de jeu » sans coût ni variabilité aléatoire d'un modèle génératif. Un branchement LLM reste possible plus tard si vous le souhaitez.

Exemple généré : `docs/simulations/2026-08-20_seed4242_iter5-light-capture-strategic-greedy-strategic-greedy.md`.

---

## 3. Clarifications de design (validées en conversation)

Ces points corrigent des interprétations erronées des premières simulations :

### 3.1 « Snowball » = accumulation, pas compounding

Le terme **snowball** dans nos métriques désigne : *le même joueur gagne plusieurs plis d'affilée*, donc **accumule plus de cartes dans sa pile**. Ce n'est **pas** « plus de points rendent plus facile de gagner les plis suivants ». Les points n'accélèrent pas mécaniquement la victoire au pli — c'est l'**accumulation de cartes capturées** qui creuse l'écart en fin de partie.

### 3.2 Pioche vainqueur en premier = effet marginal

Tout le monde reconstitue sa main à chaque tour. Faire piocher le vainqueur en premier a un impact **faible** seul ; ce n'est pas le levier principal du déséquilibre.

### 3.3 Bluff = effet social, pas seulement mécanique

Au livret, poser un **Bluff** visible (badge ★) en début de séquence de pose peut **intimider** les joueurs suivants — effet que le bot greedy ne modélise pas du tout. Avec le bot strategic, le Bluff apparaît ~50 % des plis (iter4+), ce qui est cohérent avec votre intention de design.

### 3.4 Construction de main long terme

Les joueurs expérimentés gardent des cartes qui ne servent pas au pli immédiat mais à un **pot futur** (suite, couleur, 1-6-13 Prismale). Le bot strategic pénalise la « casse » de ces réserves ; greedy non.

### 3.5 Piste forte : points = communes seulement

Vous avez exprimé une direction de design importante : **seules les cartes communes rapporteraient des points** (pot visible, annoncé), le reste étant inconnu (ce que les autres posent). Cette variante n'a pas encore été implémentée comme règle par défaut, mais c'est probablement la **piste la plus alignée** avec l'esprit PRISME (bluff, lecture de table, pots annoncés). Nous recommandons une **iter6 « communes-only scoring »** en playtest prioritaire.

---

## 4. Résultats des 5 itérations (500 parties · 4 joueurs · seed 2026)

| Itération | Écart moyen | Leader mid gagne | Bluff/pl | Combo #1 |
|-----------|-------------|------------------|----------|----------|
| 1 Livret | 68 | 60 % | ~0 % | Petite suite |
| 2 Anti-snowball | 65 | 63 % | 0 % | Petite suite |
| 3 Modif. perso | 65 | 60 % | 0 % | Petite suite |
| 4 Bluff joker | 69 | 63 % | 52 % | Petite suite |
| **5 Capture allégée** | **54** | **57 %** | 49 % | **Arc-en-ciel** |

*(Bots greedy pour le batch historique ; comparer avec `--bot strategic` pour le Bluff et la pose séquentielle.)*

### Lecture en une phrase

Le **snowball de points** vient surtout de la **capture totale** (cartes posées + communes) ; atténuer la pioche ou les bonus plis seuls ne suffit pas ; donner un rôle au Bluff améliore le fun mais peut **aggraver** l'écart si la capture reste totale ; **ne plus capturer les communes** (iter5) est le levier le plus efficace testé à ce jour.

### Pourquoi iter5 ressort

- Écart **−21 %** vs livret, **−15 %** vs iter4.
- **Arc-en-ciel** devient la combo la plus fréquente — la « fantasy » du jeu apparaît sans écraser économiquement (les communes ne vont plus dans la pile).
- Snowball de plis consécutifs au **plus bas** (~27 %).

---

## 5. Proposition PRISME v2 (basée sur iter5)

| Règle | Livret actuel | v2 proposé | Motivation |
|-------|---------------|------------|------------|
| Pioche | Vainqueur d'abord | Distributeur (horaire) | Légèrement plus équitable |
| Bonus plis | +6 | +4 | Moins de doublement d'avance |
| Prisme/Inversion en commune | Tous affectés | Celui qui pose | Plis plus lisibles |
| Bluff | Carte neutre | Joker couleur (+2 pts) | Jouée ~50 % des plis |
| Communes capturées | Oui | **Non (défaussées)** | **Levier n°1 anti-snowball** |
| Communes (4j) | 3 | 4 | Plis riches sans points gratuits |
| Bonus fin | +3 / +5 | +5 / +8 | Autres chemins de victoire |

**Recommandation :** adopter v2 comme **règles de playtest par défaut**, en gardant le livret en mode « Classique » si vous le souhaitez.

---

## 6. Suggestions pour la suite (par priorité)

### Priorité 1 — Playtest humain hot-seat

Aucune simulation ne remplace la **peur du badge ★** ni la lecture des adversaires. Testez v2 autour d'une table réelle avant d'imprimer un nouveau livret.

### Priorité 2 — Variante « points = communes only »

Alignée avec votre vision du pot annoncé. Piste concrète pour iter6 :

- Annoncer le pot du tour (communes visibles).
- Seules les communes capturées (ou une sous-partie) comptent en points.
- Les cartes posées des adversaires restent un enjeu de **plis** et de bonus, pas de barème linéaire.

### Priorité 3 — Plafond ou victoire à score

Même iter5 laisse des écarts ~54 pts (ex. 75 vs 21). Pistes :

- **Victoire à X points** (ex. 40) pour des parties plus courtes et serrées ;
- **Plafond de cartes comptées par pli** (ex. max 6) ;
- Re-simuler iter1–5 avec `--bot strategic` et le nouveau `simulate:ai` pour valider les traces.

### Priorité 4 — Affiner les agents

- Ajouter des profils (agressif, défensif, bluffeur).
- Brancher un LLM optionnel pour des commentaires plus « humains » (coût + non-déterminisme).
- Mémoire par adversaire (qui bluffe souvent, qui temporise).

---

## 7. Questions ouvertes pour vous

1. **PRISME v2 (iter5)** : souhaitez-vous l'adopter comme base de playtest ?
2. **Mode Classique** : garder le livret intact en option ?
3. **Scoring communes-only** : est-ce la direction cible à prototyper en iter6 ?
4. **Durée de partie** : préférez-vous une victoire à score fixe ou un nombre de tours fixe ?
5. **Bluff** : le joker couleur (+2 pts) vous semble-t-il fidèle à l'esprit du jeu ?

---

## 8. Commandes utiles

```bash
# 5 itérations × 500 parties
npm run simulate:iterations -- --games 500 --players 4 --seed 2026

# Une variante précise
npm run simulate -- --variant 5 --games 500 --players 4 --bot strategic

# Comparer greedy vs strategic
npm run simulate:compare-bots -- --games 300 --players 4

# Partie tracée avec commentaires agents (Markdown)
npm run simulate:ai -- --seed 4242 --variant iter5 --agents strategic,greedy,strategic,greedy --trace 1

# Lot + métriques sans trace
npm run simulate:ai -- --batch 200 --variant iter5 --agents strategic,strategic,strategic,strategic
```

---

## 9. Conclusion

PRISME a une **mécanique riche** (communes, combos poker, spéciales, pose séquentielle) dont le livret actuel **favorise mécaniquement** un leader qui enchaîne les plis par **capture totale**. Les simulations identifient clairement ce levier ; iter5 le corrige partiellement tout en rendant **Arc-en-ciel** plus présent.

Votre intuition — **points sur les communes, bluff social, construction long terme** — pointe vers une v3 plus fidèle à l'expérience visée qu'un simple ajustement numérique. Les outils sont prêts pour itérer rapidement ; la prochaine étape décisive reste le **playtest humain** et, si vous validez la piste, le prototypage **communes-only**.

Merci pour ce jeu — la combinaison levées + poker + spéciales est rare et prometteuse.

---

*Document généré dans le cadre du développement du prototype web PRISME. Pour le détail technique des itérations, voir `docs/balance/2026-08-20-iterations-bilan.md`.*
