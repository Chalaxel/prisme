# PRISME — Bilan des 5 itérations (version expliquée)

Date : 2026-08-20  
Méthode : 500 parties simulées × 5 variantes · 4 joueurs · bots « greedy » · seed 2026

---

## 0. Avant de lire les itérations — comment lire ce document

### Comment fonctionne une partie PRISME (rappel)

Chaque **tour** :

1. On retourne des **cartes communes** (3 à 4 selon le nombre de joueurs).
2. Chaque joueur **pose secrètement** 1 à 3 cartes de sa main.
3. On révèle tout le monde : chacun forme la **meilleure combinaison** possible avec ses cartes posées + une partie des communes (comme au poker).
4. Le **vainqueur du pli** capture les cartes (selon les règles) → elles vont dans sa **pile de points**.
5. Tout le monde **pioche** pour retrouver la taille de main initiale.

À la **fin de la pioche**, on compte :
- les points de chaque carte capturée (1 à 3 pts selon la valeur),
- des **bonus** (+ plis gagnés, + meilleure main restante, + invaincu sur les 3 derniers plis).

### Ce que mesurent les chiffres (en français simple)

| Métrique | Signification concrète |
|----------|------------------------|
| **Écart score moyen** | Différence entre le 1er et le dernier à la fin. Ex. : 68 = le gagnant a ~68 pts de plus que le 4e. Plus c'est bas, plus la partie était « disputée ». |
| **Parties serrées** | Fins où l'écart est faible (≤ ~12 % du score moyen). Ex. : 87 vs 80 = serré ; 87 vs 13 = écrasement. |
| **Blowouts** | Fins très déséquilibrées (écart large). |
| **Leader mi-partie gagne** | Celui qui avait le plus de points à mi-partie finit 1er. **Bas** = comebacks possibles. **Haut** = une fois en tête, difficile de rattraper. |
| **Snowball (plis consécutifs)** | Fréquence où le **même joueur gagne deux plis d'affilée. Haut** = le leader enchaîne les plis. |
| **Prisme actif** | % de plis où la règle Prisme s'applique (seules Couleur / Royal / Prismale comptent). **Haut** = la ladder « poker classique » devient inutile ce tour-là. |
| **Bluff / pli** | % de plis où quelqu'un pose un Bluff. **0 %** = personne ne la joue (carte morte). |
| **Combo #1** | Quelle combinaison gagne le plus de plis. Indique ce que les joueurs font **vraiment** en pratique, pas ce qu'affiche le livret. |

### Pourquoi simuler avec des bots ?

Les bots ne bluffent pas socialement, mais ils **maximisent leur combo** tour après tour. Ça permet de tester la **mécanique pure** : est-ce que les règles favorisent un joueur trop tôt ? Est-ce que certaines cartes sont inutiles ? On complète ensuite par du playtest humain.

### Méthode des 5 itérations

Chaque itération **cumule** les changements précédents qui ont montré un effet positif (ou neutre), et ajoute **un nouveau levier** testé isolément. On compare 500 parties avec les mêmes conditions pour voir si le changement va dans le bon sens.

---

## Tableau comparatif

| Itération | Écart | Serrées | Leader mid gagne | Bluff/pl | Prisme | Combo #1 |
|-----------|-------|---------|------------------|----------|--------|----------|
| 1 Livret | 68 | 0,2 % | 60 % | ~0 % | 17 % | Petite suite |
| 2 Anti-snowball | 65 | 0,8 % | 63 % | 0 % | 17 % | Petite suite |
| 3 Modif. perso | 65 | 0,4 % | 60 % | 0 % | **0 %** | Petite suite |
| 4 Bluff joker | 69 | 0 % | 63 % | **52 %** | 0 % | Petite suite |
| 5 Capture allégée | **54** | 0 % | **57 %** | 49 % | 0 % | **Arc-en-ciel** |

---

## Itération 1 — Livret (baseline)

### Objectif

Mesurer le comportement **des règles actuelles** sans rien changer. C'est la photo de référence.

### Ce qu'on a observé

- Écart moyen **68 pts** → en fin de partie, le 1er a très largement devancé les autres.
- Quasi **aucune partie serrée** (0,2 %).
- **Petite suite** gagne le plus de plis — pas Arc-en-ciel, pas Couleur royale.
- **Bluff** joué ~0 % du temps.
- **Prisme** actif ~17 % des plis.
- **Gèle** posé des milliers de fois (spéciale défensive omniprésente).

### Pourquoi ça arrive — le raisonnement détaillé

**1. Le snowball de points (effet boule de neige)**

Quand tu gagnes un pli au livret :
- tu captures **tes cartes + celles des autres + toutes les communes** ;
- tu pioches **en premier** → tu reconstitues ta main avant les autres ;
- tu gagnes un pli de plus → tu vises le bonus « plus de plis » (+6).

Chaque victoire te donne **beaucoup de cartes qui valent des points** (souvent 5–12 cartes × 1–3 pts). Le perdant, lui, n'a rien gagné **et** a vidé des cartes de sa main. Sur 8–9 tours, l'écart s'accumule : 80 pts vs 15 pts n'est pas rare.

→ C'est pour ça que l'**écart de 68** et les **99 % de blowouts** : la mécanique pousse mécaniquement le leader à accélérer.

**2. Petite suite partout, pas Arc-en-ciel**

Pour une Arc-en-ciel il faut **6 couleurs différentes** dans le pool (tes cartes + communes). En ne posant que 1–3 cartes avec 3–4 communes, c'est rare. La **petite suite** (3 cartes consécutives) est beaucoup plus facile à assembler.

→ La ladder du livret **promet** 12 types de combos, mais le **plateau réel** ne permet presque que les combos courtes.

**3. Bluff jamais joué**

Bluff n'a **aucun effet** : elle ne rentre pas dans la combo, vaut 1 pt si capturée, occupe un slot de pose. Les bots (comme un joueur rationnel) l'évitent.

→ Ce n'est pas un problème de « mauvaise IA », c'est un ** défaut de design** : la carte n'aide jamais à gagner le pli.

**4. Prisme ~17 % des plis**

Quand Prisme est actif, paire / brelan / suite ne servent plus — seule une Couleur compte. Un pli entier peut basculer sur un hasard de couleur.

→ Ça ajoute de la **variance** et de la **frustration** (« j'avais un brelan inutile »).

### Ce qu'on en déduit

Le problème n°1 n'est pas « les combos sont mal calibrés », c'est : **gagner un pli rapporte trop de points d'un coup**. Les spéciales Prisme global et Bluff mort amplifient le mal-être sans corriger le fond.

### Hypothèse pour l'itération 2

> Si on réduit les avantages mécaniques du vainqueur (pioche + bonus plis) **sans toucher aux combos**, l'écart devrait baisser et les comebacks augmenter.

---

## Itération 2 — Anti-snowball

### Changements et **pourquoi** on les choisit

| Changement | Raisonnement |
|------------|--------------|
| **Pioche : ordre distributeur** (plus « vainqueur d'abord ») | La pioche prioritaire donnait au gagnant les **meilleures cartes en premier** après chaque pli → main plus stable → gagne encore. On teste l'égalité de accès à la pioche. |
| **Bonus plis : 6 → 4** | +6 pts est énorme (≈ 2 cartes « 13 »). Ça **double** la récompense de celui qui mène déjà les plis. On réduit sans supprimer l'objectif secondaire. |
| **Bluff 7 → 4, Gèle 3 → 2** | Moins de cartes « inutiles » (Bluff) et moins de tours bloqués par Gèle → un peu plus de fluidité. Changement mineur, exploratoire. |

### Résultats

- Écart : 68 → **65** (↓ 3 pts) — **légère** amélioration, hypothèse **partiellement** confirmée.
- Premières parties serrées (0,8 %) — signal faible mais réel.
- **Mais** : leader mi-partie gagne **63 %** (↑ vs 60 %) — **pire** pour les comebacks !

### Pourquoi le leader mid gagne plus ? (effet contre-intuitif expliqué)

Sans pioche prioritaire, **tout le monde pioche dans le même ordre** à chaque tour. Celui qui **gagne plus de plis** pose plus souvent des cartes fortes **sans être puni** par une pioche défavorable systématique. Le frein qu'on a enlevé au vainqueur profite aussi à celui qui domine déjà les plis.

→ Conclusion intermédiaire : **la pioche n'était qu'un symptôme**. Le cœur du snowball reste : **capturer trop de cartes-scoring par pli**.

En parallèle, Prisme global est toujours actif ~17 % → les plis restent parfois illisibles.

### Hypothèse pour l'itération 3

> Si Prisme/Inversion ne s'appliquent qu'au joueur qui pose la spéciale (plus de « Prisme commun » qui ruine le pli pour tout le monde), les parties seront plus **lisibles** et peut-être plus équilibrées.

---

## Itération 3 — Modificateurs personnels

### Changements et **pourquoi**

| Changement | Raisonnement |
|------------|--------------|
| **Prisme/Inversion commune : OFF** | Avant : une Inversion en commune forçait **4 joueurs** à rejouer mentallement toute la ladder. Maintenant : seul celui qui **choisit** de poser Prisme/Inversion subit/bénéficie l'effet sur **son** combo. |
| **Copies Prisme/Inversion : 3 → 2** | Moins de tours « brouillons ». |

*(On garde les changements iter 2 : pioche horaire, bonus +4, etc.)*

### Résultats

- Prisme actif : 17 % → **0 %** ✅ (objectif atteint)
- Écart : **65** (stable) — pas de miracle sur les scores
- Leader mid : **60 %** (retour à la baseline)

### Pourquoi l'écart ne bouge presque pas ?

Parce qu'on a traité un problème de **clarté**, pas de **scoring**. Même sans Prisme global :
- le vainqueur capture toujours **toutes les communes + toutes les cartes posées** ;
- une carte « 13 » capturée = **3 pts** ;
- un bon pli = **15–25 pts** d'un coup pour un seul joueur.

→ Le raisonnement : *« Les modificateurs globaux agacent, mais ce sont les communes capturées qui gonflent la pile du leader. »*

### Hypothèse pour l'itération 4

> Tant qu'on n'a pas réglé la capture, travaillons sur les **cartes fantômes** : donner un vrai rôle au Bluff. Si les joueurs (bots) la jouent, on saura qu'elle participe au jeu. On réduit Gèle (trop jouée) pour libérer de l'espace.

---

## Itération 4 — Bluff joker

### Changements et **pourquoi**

| Changement | Raisonnement |
|------------|--------------|
| **Bluff = joker de couleur** | Peut compléter une Couleur ou un Arc-en-ciel en remplaçant une couleur manquante. **Enfin un bénéfice mécanique** pour la poser. |
| **Bluff : 5 copies, 2 pts** | Assez présent pour tester, un peu plus rentable si capturée. |
| **Gèle : 1 copie** | En iter 1–3 les bots posaient Gèle en masse (stratégie défensive sans coût). Réduire = moins de plis « annulés » côté capture. |

### Résultats

- Bluff joué : 0 % → **52 %** ✅ — la carte est **enfin utilisée** ; l'hypothèse « Bluff morte faute d'effet » est **confirmée et corrigée**.
- Écart : 65 → **69** (↑ 4 pts) ❌ — **régression** sur l'équilibre !
- Parties plus courtes (7 tours) — les combos fortes arrivent plus vite.

### Pourquoi l'écart **augmente** ? (point crucial)

Bluff joker rend l'**Arc-en-ciel et la Couleur plus faciles**. Qui gagne ces plis ? Souvent celui qui **menait déjà**. Et au livret, le gagnant **capture tout** — y compris les communes qui ont servi à construire l'Arc-en-ciel.

Schéma :
```
Bluff joker → combos fortes plus fréquentes
           → le gagnant capture encore TOUT
           → plus de points par pli pour le leader
           → écart qui monte (69)
```

→ On a prouvé : **améliorer les combos sans limiter la capture aggrave le snowball**.

### Hypothèse pour l'itération 5

> Séparer deux choses qu'au livret on mélange :
> 1. **Gagner le pli** (prestige, bonus plis, contrôle du rythme)
> 2. **Scorer des points** (cartes dans la pile)
>
> Si les **communes ne vont plus dans la pile** du vainqueur (elles sont défaussées), gagner un pli rapporte moins de points « gratuits ». On compense en rendant les communes plus nombreuses (+1) pour garder des plis excitants, et on renforce les bonus de fin pour d'autres chemins de victoire.

---

## Itération 5 — Capture allégée (meilleure variante)

### Changements et **pourquoi**

| Changement | Raisonnement |
|------------|--------------|
| **Communes non capturées** (défaussées) | Le vainqueur ne prend que les cartes **posées** (+ départages). Les 3–4 communes du tour ne valent plus 3–8 pts bonus pour lui seul. **Cible directe du snowball identifié en iter 4.** |
| **+1 commune** (4 à 4 joueurs) | Moins de capture ≠ plis ennuyeux. Plus de communes = combos plus riches **sans** les convertir en points automatiques. |
| **Bonus main finale +5, bonus 3 plis +8** | D'autres façons de gagner que « capturer la moitié du deck ». Compense partiellement la baisse de points par pli. |

*(Cumule iter 2–4 : pioche horaire, modificateurs perso, Bluff joker, etc.)*

### Résultats

- Écart : 69 → **54** (−21 % vs livret, **−15 % vs iter 4**) ✅ — **meilleur chiffre** ; hypothèse capture **confirmée**.
- Leader mid : **57 %** (↓ vs 60–63 %) — un peu plus de retournements possibles.
- Combo #1 : Petite suite → **Arc-en-ciel** — la **fantasy du jeu** apparaît enfin dans les résultats.
- Snowball plis : **27 %** (le plus bas) — moins d'enchaînements écrasants.

### Pourquoi Arc-en-ciel devient #1 ?

Plus de communes + Bluff joker = Arc-en-ciel **faisable**. Mais comme les communes **ne sont plus capturées**, ce pli spectaculaire ne donne **pas** 10 pts de communes au gagnant — surtout les cartes posées. Le pli est **mémorable** sans être **dévastateur** économiquement.

→ C'est exactement le type de dynamique qu'on cherchait : **du spectacle sans snowball**.

### Limite honnête

« Parties serrées » reste ~0 % au seuil auto. Même à 54 pts d'écart, on a souvent ~75 vs ~21. Le barème (1–3 pts par carte capturée × beaucoup de plis gagnés) reste **steep**. Une iter 6 sur le **plafond de points par pli** ou une **victoire à X pts** serait la suite logique.

---

## Fil conducteur — comment chaque itération découle de la précédente

```
Iter 1 : « Les écarts sont énormes »
    └─ Cause identifiée : capturer trop + pioche vainqueur + gros bonus plis
         └─ Iter 2 : on atténue pioche + bonus
              └─ Résultat : −3 pts seulement ; comebacks pas mieux
                   └─ Iter 3 : on enlève Prisme/Inversion global (clarté)
                        └─ Résultat : plus lisible, score identique
                             └─ Iter 4 : on donne un rôle au Bluff
                                  └─ Résultat : Bluff OK, mais écart ↑ (combos fortes + capture totale)
                                       └─ Iter 5 : communes non capturées
                                            └─ Résultat : meilleur équilibre + Arc-en-ciel fun
```

---

## Proposition « PRISME v2 » — ce que je recommande et pourquoi

C'est la variante **iter 5** : elle cumule tout ce qui a **montré un effet positif** sans garder les régressions isolées.

| Règle | Livret | v2 proposé | Pourquoi |
|-------|--------|------------|----------|
| Pioche | Vainqueur d'abord | Distributeur | Légèrement plus juste ; iter 2 seule insuffisante mais gardée |
| Bonus plis | +6 | +4 | Évite de doubler l'avance du meneur |
| Prisme/Inversion en commune | Tous affectés | Celui qui pose | Plis lisibles |
| Bluff | Rien | Joker couleur | Carte jouée 50 % du temps au lieu de 0 % |
| Communes capturées | Oui | **Non** | **Levier le plus fort** sur l'écart |
| Communes (4j) | 3 | 4 | Plis plus riches sans points gratuits |
| Bonus fin | +3 / +5 | +5 / +8 | Autres chemins de victoire |

---

## Ce que je vous propose de valider

1. **PRISME v2 (iter 5) comme règles par défaut** pour vos prochains playtests ?
2. **Garder le livret classique** en option (mode « Classique ») ?
3. **Itération 6** sur le barème (ex. max 6 cartes comptées par pli, ou victoire à 40 pts) ?
4. **Playtest humain** avant d'imprimer un nouveau livret ?

---

## Rejouer les simulations

```bash
npm run simulate:iterations -- --games 500 --players 4 --seed 2026
npm run simulate -- --variant 5 --games 500 --players 4
```
