# PRISME — Bilan des 5 itérations d'équilibrage

Date : 2026-08-20  
Méthode : 500 parties simulées × 5 variantes · 4 joueurs · bots greedy · seed 2026  
Commande : `npm run simulate:iterations -- --games 500 --players 4 --seed 2026`

---

## Tableau comparatif

| Itération | Écart score moy. | Parties serrées | Blowouts | Leader mi-partie gagne | Snowball (plis consécutifs) | Prisme actif | Bluff / pli | Tours moy. | Combo #1 |
|-----------|------------------|-----------------|----------|------------------------|----------------------------|--------------|-------------|------------|-----------|
| **1 — Livret** | 68 | 0,2 % | 99 % | 60 % | 29 % | 17 % | ~0 % | 8,9 | Petite suite |
| **2 — Anti-snowball** | 65 | 0,8 % | 96 % | 63 % | 28 % | 17 % | 0 % | 8,0 | Petite suite |
| **3 — Modif. personnels** | 65 | 0,4 % | 98 % | 60 % | 29 % | **0 %** | 0 % | 7,9 | Petite suite |
| **4 — Bluff joker** | 69 | 0 % | 99 % | 63 % | 28 % | 0 % | **52 %** | 7,0 | Petite suite |
| **5 — Capture allégée** | **54** | 0 % | 97 % | **57 %** | **27 %** | 0 % | 49 % | 9,3 | **Arc-en-ciel** |

---

## Itération 1 — Livret (baseline)

**Règles :** livret inchangé.

**Constats :**
- Écart de score massif (~68 pts) — quasi aucune partie serrée.
- Le leader à mi-partie gagne 60 % du temps.
- Petite suite domine ; Arc-en-ciel / Couleur restent marginales malgré la ladder affichée.
- Bluff jamais joué (0 % des plis) — morte en pratique.
- Prisme actif ~17 % des plis → neutralise souvent la ladder.
- Gèle sur-utilisé par les bots (~4 000 poses sur 500 parties).

**Conclusion :** la colonne vertébrale tient, mais le snowball de capture + pioche prioritaire + bonus « plus de plis » (+6) condamne l' suspense. Bluff et ladder haute ne participent pas au ressenti de jeu.

**Initiative → Itération 2 :** attaquer le snowball mécanique sans toucher aux combos.

---

## Itération 2 — Anti-snowball

**Changements :**
- Pioche en ordre distributeur (plus de priorité au vainqueur).
- Bonus « plus de plis » : 6 → **4**.
- Copies : Bluff 7 → 4, Gèle 3 → 2.

**Résultats :**
- Écart −3 pts (68 → 65). Légère amélioration.
- 1 % de parties serrées (première fois).
- Parties plus courtes (−0,9 tour).
- Leader mi-partie gagne **plus** (63 %) — effet contre-intuitif : sans pioche prioritaire, celui qui mène les plis conserve l'avantage d'une main stable.

**Conclusion :** le frein pioche seul est insuffisant. Le Prisme global reste un bruit majeur.

**Initiative → Itération 3 :** Prisme/Inversion ne globalisent plus via les communes ; seul le joueur qui pose la spéciale en subit/bénéficie l'effet.

---

## Itération 3 — Modificateurs personnels

**Changements (cumul iter 2) :**
- `globalPrisme: false`, `globalInversion: false`.
- Copies Prisme/Inversion : 3 → **2** chacune.

**Résultats :**
- Prisme actif **0 %** des plis (objectif atteint).
- Écart stable (~65). Pas de gain sur les comebacks.
- Petite suite toujours dominante.

**Conclusion :** suppression du chaos Prisme/Inversion global = bon pour la lisibilité. Les écarts de score viennent surtout de la **capture totale des cartes posées**, pas des modificateurs.

**Initiative → Itération 4 :** redonner une identité au Bluff (joker couleur) et réduire Gèle (spéciale défensive trop centralisée).

---

## Itération 4 — Bluff joker

**Changements (cumul iter 3) :**
- Bluff = **joker de couleur** pour Couleur / Arc-en-ciel.
- Copies Bluff 5, Gèle **1**, points Bluff 1 → **2**.

**Résultats :**
- Bluff joué **52 %** des plis — carte enfin tactique.
- Parties plus courtes (7,0 tours) — rythme accéléré.
- Écart **remonte** à 69 (Bluff facilite Arc-en-ciel → plus de points capturés par le gagnant).
- Top combo reste Petite suite.

**Conclusion :** le Bluff joker fonctionne (usage massif) mais **amplifie** le snowball de points en rendant les grosses combos plus accessibles.

**Initiative → Itération 5 :** séparer « gagner le pli » et « scorer des points » — les communes ne vont plus dans la pile du vainqueur.

---

## Itération 5 — Capture allégée (meilleure itération)

**Changements (cumul iter 4) :**
- Communes **défaussées** après le pli (non capturées).
- Bonus main finale : 3 → **5** ; bonus 3 derniers plis : 5 → **8**.
- Communes +1 pour tables ≤ 4 joueurs (4 communes/tour à 4j).

**Résultats :**
- Écart **54 pts** (−21 % vs livret) — **meilleure moyenne**.
- Leader mi-partie gagne **57 %** (−3 pts vs livret) — comebacks un peu plus fréquents.
- Snowball plis consécutifs **27 %** (minimum observé).
- Top combo gagnante = **Arc-en-ciel** (fantasy ladder enfin visible).
- Parties légèrement plus longues (+0,4 tour) — plus de décisions.

**Conclusion :** la capture allégée est le levier le plus efficace testé. Le Bluff joker + communes riches créent des plis mémorables sans exploser l'écart aussi violemment qu'en iter 4.

---

## Synthèse transversale

### Ce qui a marché
| Levier | Impact |
|--------|--------|
| Communes non capturées | **Fort** — réduit l'écart de score, favorise Arc-en-ciel |
| Modificateurs personnels | **Moyen** — supprime le chaos Prisme global |
| Bluff joker | **Moyen** — rend la carte jouable ; à combiner avec capture allégée |
| Pioche horaire + bonus plis −2 | **Faible** seul — nécessaire mais pas suffisant |

### Ce qui n'a pas marché (ou a empiré)
| Levier | Problème |
|--------|----------|
| Bluff joker sans capture allégée | Écart remonte (69) |
| Réduire Gèle seul | Bots sur-jouent encore Gèle quand copies > 0 |
| Métrique « parties serrées » | Toujours ~0 % — les totaux restent ~80 vs ~25 ; seuil relatif dur à atteindre |

### Limite identifiée
Même la meilleure variante (iter 5) produit **97 % de blowouts** au seuil automatique. Le problème structurel : **chaque carte capturée vaut 1–3 pts** et un gagnant de pli en capture 5–15 cartes → écart de pile de 20–40 pts avant bonus. Pour des fins serrées, il faudra probablement une **itération 6** sur le barème (points par pli plafonnés, scoring par paliers de plis, ou victoire à X points).

---

## Proposition à valider — « PRISME v2 » (fusion iter 3–5)

Règles recommandées pour playtest humain :

| Paramètre | Livret | Proposé v2 |
|-----------|--------|------------|
| Pioche après pli | Vainqueur d'abord | **Ordre distributeur** |
| Bonus plus de plis | +6 | **+4** |
| Prisme / Inversion commune | Global | **Personnel** (celui qui pose) |
| Bluff | Cosmétique | **Joker couleur** (Couleur / Arc-en-ciel) |
| Copies Bluff / Gèle | 7 / 3 | **5 / 1** |
| Communes capturées | Oui | **Non** (défausse) |
| Communes à 4j | 3 | **4** |
| Bonus main finale | +3 | **+5** |
| Bonus 3 derniers plis | +5 | **+8** |
| Copies Prisme / Inversion | 3 / 3 | **2 / 2** |

**Fichier implémenté :** `src/rules/iterations.ts` → `iter5LightCapture` (cumule toutes ces règles).

**Commande de replay :**
```bash
npm run simulate -- --games 500 --players 4   # après branchement --variant (à venir)
npm run simulate:iterations -- --games 500
```

---

## Pistes pour itération 6 (hors scope de cette session)

1. **Plafond de capture** — max 6 cartes par pli dans la pile de points.
2. **Scoring par pli** — +2 pts fixe au gagnant + valeurs des cartes posées seulement (pas des communes).
3. **Objectif de victoire** — premier à 40 pts OU fin de pioche (parties plus courtes et serrées).
4. **Échange après révélation partielle** — cible choisie après voir les cartes posées (réduit la frustration).

---

## Validation demandée

Merci de confirmer ou infirmer :

- [ ] Adopter **PRISME v2** (iter 5) comme nouvelles règles par défaut du livret ?
- [ ] Garder le livret original accessible (mode « classique ») ?
- [ ] Lancer une **itération 6** sur le barème de points ?
- [ ] Playtest humain hot-seat avant de figer ?
