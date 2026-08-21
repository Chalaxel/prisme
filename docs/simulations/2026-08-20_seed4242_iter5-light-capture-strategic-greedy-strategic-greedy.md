# Simulation PRISME — trace tour par tour

> Agents heuristiques explicables : chaque coup est commenté en français.
> Ce n'est pas un appel LLM externe — la logique est reproductible et auditable.

- **Seed** : 4242
- **Variante** : iter5-light-capture
- **Tours joués** : 11

## Agents

| Siège | Agent | Type |
|-------|-------|------|
| 1 | Éclat | strategic |
| 2 | Prisme | greedy |
| 3 | Arc | strategic |
| 4 | Lumière | greedy |

## Réglages testés

| Paramètre | Valeur |
|-----------|--------|
| Pioche vainqueur en premier | non |
| Prisme global (communes) | non |
| Inversion globale | non |
| Bluff joker couleur | oui |
| Capture des communes | non |

## Déroulé

### Tour 1 — donneur : Arc

- **Pioche restante** : 70 cartes
- **Communes** : 6 Orange, 8 Sarcelle, 6 Sarcelle, 12 Rouge
- **Modificateurs** : Aucun modificateur global

#### Séquence de pose

##### Arc (pose n°1)

- **Main avant coup** : 6 Rouge, 6 Vert, 8 Bleu nuit, Bluff (Orange), Inversion (Or)
- **Table visible** : Aucune pile adverse visible.
- **Stratégie** : *Intimidation / contrôle de la table*
- **Cartes jouées** : 6 Vert, 8 Bleu nuit, Bluff (Orange)

**Commentaire de l'agent :**

**Arc** (position de pose 1/4).
Main : 6 Rouge, 6 Vert, 8 Bleu nuit, Bluff (Orange), Inversion (Or).
Communes : 6 Orange, 8 Sarcelle, 6 Sarcelle, 12 Rouge.
Table : Personne n'a encore posé..
Stratégie : Intimidation / contrôle de la table.
Je pose : 6 Vert, 8 Bleu nuit, Bluff (Orange).
- Combo visée avec les communes : Arc-en-ciel.
- Bluff visible tôt : signaler une menace sans engager toute la main.

##### Lumière (pose n°2)

- **Main avant coup** : 11 Bleu nuit, 3 Rouge, 3 Or, 1 Or, 7 Vert
- **Table visible** : Arc:3 posée(s) ★
- **Stratégie** : *Combo immédiate (greedy)*
- **Cartes jouées** : 11 Bleu nuit, 3 Or, 7 Vert

**Commentaire de l'agent :**

**Lumière** — agent greedy.
Communes : 6 Orange, 8 Sarcelle, 6 Sarcelle, 12 Rouge.
Je pose : 11 Bleu nuit, 3 Or, 7 Vert pour Arc-en-ciel.
- Approche myope : maximiser la combo immédiate (Arc-en-ciel).
- Je ne modélise pas le bluff social ni la construction sur plusieurs tours.

##### Éclat (pose n°3)

- **Main avant coup** : 5 Rouge, 7 Sarcelle, Bluff (Orange), 8 Orange, 4 Orange
- **Table visible** : Arc:3 posée(s) ★, Lumière:3 posée(s)
- **Stratégie** : *Réaction prudente aux signaux adverses*
- **Cartes jouées** : 7 Sarcelle

**Commentaire de l'agent :**

**Éclat** (position de pose 3/4).
Main : 5 Rouge, 7 Sarcelle, Bluff (Orange), 8 Orange, 4 Orange.
Communes : 6 Orange, 8 Sarcelle, 6 Sarcelle, 12 Rouge.
Table : Arc : 3 carte(s) posée(s) (2 cachée(s), 1 spéciale(s) visible(s) ★) · Lumière : 3 carte(s) posée(s) (3 cachée(s)).
Stratégie : Réaction prudente aux signaux adverses.
Je pose : 7 Sarcelle.
- Combo visée avec les communes : Écho.
- Prudence : 2 joueur(s) ont déjà posé avec pression table=5 (Arc : 3 carte(s) posée(s) (2 cachée(s), 1 spéciale(s) visible(s) ★) · Lumière : 3 carte(s) posée(s) (3 cachée(s))).

##### Prisme (pose n°4)

- **Main avant coup** : 13 Or, 5 Orange, 7 Or, 10 Or, 4 Rouge
- **Table visible** : Arc:3 posée(s) ★, Lumière:3 posée(s), Éclat:1 posée(s)
- **Stratégie** : *Combo immédiate (greedy)*
- **Cartes jouées** : 5 Orange, 7 Or, 4 Rouge

**Commentaire de l'agent :**

**Prisme** — agent greedy.
Communes : 6 Orange, 8 Sarcelle, 6 Sarcelle, 12 Rouge.
Je pose : 5 Orange, 7 Or, 4 Rouge pour Grande suite.
- Approche myope : maximiser la combo immédiate (Grande suite).
- Je ne modélise pas le bluff social ni la construction sur plusieurs tours.

#### Résolution du pli

- **Arc** → Arc-en-ciel (Arc-en-ciel)
- **Lumière** → Arc-en-ciel (Arc-en-ciel)
- **Éclat** → Écho (Écho)
- **Prisme** → Grande suite (Grande suite)

- **Vainqueur(s)** : Lumière
- **Capture** : Lumière remporte le pli. Communes défaussées (non capturées). Cartes posées capturées vers sa pile (valeur ~18 pts cumulés).
- **Points cumulés (piles)** : J1=0 · J2=0 · J3=0 · J4=18

<details>
<summary>Extraits du journal moteur</summary>

- Éclat : Écho
- Prisme : Grande suite
- Arc : Arc-en-ciel
- Lumière : Arc-en-ciel
- Communes défaussées (non capturées).
- Lumière remporte le pli (10 cartes).

</details>

---

### Tour 2 — donneur : Lumière

- **Pioche restante** : 56 cartes
- **Communes** : Prisme (Sarcelle), Gèle (Bleu nuit), Bluff (Orange), 10 Bleu nuit
- **Modificateurs** : Aucun modificateur global

#### Séquence de pose

##### Lumière (pose n°1)

- **Main avant coup** : 3 Rouge, 1 Or, 11 Orange, 1 Orange, 3 Vert
- **Table visible** : Aucune pile adverse visible.
- **Stratégie** : *Combo immédiate (greedy)*
- **Cartes jouées** : 3 Rouge, 3 Vert

**Commentaire de l'agent :**

**Lumière** — agent greedy.
Communes : Prisme (Sarcelle), Gèle (Bleu nuit), Bluff (Orange), 10 Bleu nuit.
Je pose : 3 Rouge, 3 Vert pour Paire simple (3).
- Approche myope : maximiser la combo immédiate (Paire simple (3)).
- Je ne modélise pas le bluff social ni la construction sur plusieurs tours.

##### Éclat (pose n°2)

- **Main avant coup** : 5 Rouge, Bluff (Orange), 8 Orange, 4 Orange, 9 Sarcelle
- **Table visible** : Lumière:2 posée(s)
- **Stratégie** : *Intimidation / contrôle de la table*
- **Cartes jouées** : Bluff (Orange), 8 Orange, 9 Sarcelle

**Commentaire de l'agent :**

**Éclat** (position de pose 2/4).
Main : 5 Rouge, Bluff (Orange), 8 Orange, 4 Orange, 9 Sarcelle.
Communes : Prisme (Sarcelle), Gèle (Bleu nuit), Bluff (Orange), 10 Bleu nuit.
Table : Lumière : 2 carte(s) posée(s) (2 cachée(s)).
Stratégie : Intimidation / contrôle de la table.
Je pose : Bluff (Orange), 8 Orange, 9 Sarcelle.
- Combo visée avec les communes : Petite suite.
- Coût long terme : garder 8 Orange servait à une construction (réserve 7).
- Bluff visible tôt : signaler une menace sans engager toute la main.
- Prudence : 1 joueur(s) ont déjà posé avec pression table=1 (Lumière : 2 carte(s) posée(s) (2 cachée(s))).
- Je limite ma mise : plusieurs cartes chères sous pression.

##### Prisme (pose n°3)

- **Main avant coup** : 13 Or, 10 Or, 12 Sarcelle, Bluff (Orange), 2 Bleu nuit
- **Table visible** : Lumière:2 posée(s), Éclat:3 posée(s) ★
- **Stratégie** : *Combo immédiate (greedy)*
- **Cartes jouées** : 10 Or

**Commentaire de l'agent :**

**Prisme** — agent greedy.
Communes : Prisme (Sarcelle), Gèle (Bleu nuit), Bluff (Orange), 10 Bleu nuit.
Je pose : 10 Or pour Paire simple (10).
- Approche myope : maximiser la combo immédiate (Paire simple (10)).
- Je ne modélise pas le bluff social ni la construction sur plusieurs tours.

##### Arc (pose n°4)

- **Main avant coup** : 6 Rouge, Inversion (Or), 13 Rouge, 7 Bleu nuit, 12 Or
- **Table visible** : Lumière:2 posée(s), Éclat:3 posée(s) ★, Prisme:1 posée(s)
- **Stratégie** : *Réaction prudente aux signaux adverses*
- **Cartes jouées** : Inversion (Or)

**Commentaire de l'agent :**

**Arc** (position de pose 4/4).
Main : 6 Rouge, Inversion (Or), 13 Rouge, 7 Bleu nuit, 12 Or.
Communes : Prisme (Sarcelle), Gèle (Bleu nuit), Bluff (Orange), 10 Bleu nuit.
Table : Lumière : 2 carte(s) posée(s) (2 cachée(s)) · Éclat : 3 carte(s) posée(s) (2 cachée(s), 1 spéciale(s) visible(s) ★) · Prisme : 1 carte(s) posée(s) (1 cachée(s)).
Stratégie : Réaction prudente aux signaux adverses.
Je pose : Inversion (Or).
- Combo visée avec les communes : Carte haute (10).
- Prudence : 3 joueur(s) ont déjà posé avec pression table=6 (Lumière : 2 carte(s) posée(s) (2 cachée(s)) · Éclat : 3 carte(s) posée(s) (2 cachée(s), 1 spéciale(s) visible(s) ★) · Prisme : 1 carte(s) posée(s) (1 cachée(s))).
- Inversion : valoriser mes cartes basses (1–4).

#### Résolution du pli

- **Lumière** → Paire simple (3) (Paire simple (3))
- **Éclat** → Petite suite (Petite suite)
- **Prisme** → Paire simple (10) (Paire simple (10))
- **Arc** → Carte haute (10) (Carte haute (10))

- **Vainqueur(s)** : Éclat
- **Capture** : Éclat remporte le pli. Communes défaussées (non capturées). Cartes posées capturées vers sa pile (valeur ~13 pts cumulés).
- **Points cumulés (piles)** : J1=13 · J2=0 · J3=0 · J4=18

<details>
<summary>Extraits du journal moteur</summary>

- Éclat : Petite suite
- Prisme : Paire simple (10)
- Arc : Carte haute (10)
- Lumière : Paire simple (3)
- Communes défaussées (non capturées).
- Éclat remporte le pli (7 cartes).

</details>

---

### Tour 3 — donneur : Éclat

- **Pioche restante** : 45 cartes
- **Communes** : 5 Vert, 2 Orange, Échange de jeu (Rouge), 11 Sarcelle
- **Modificateurs** : Aucun modificateur global

#### Séquence de pose

##### Éclat (pose n°1)

- **Main avant coup** : 5 Rouge, 4 Orange, 12 Orange, 4 Or, 4 Vert
- **Table visible** : Aucune pile adverse visible.
- **Stratégie** : *Construction long terme — pot modeste ce tour*
- **Cartes jouées** : 4 Orange, 4 Or, 4 Vert

**Commentaire de l'agent :**

**Éclat** (position de pose 1/4).
Main : 5 Rouge, 4 Orange, 12 Orange, 4 Or, 4 Vert.
Communes : 5 Vert, 2 Orange, Échange de jeu (Rouge), 11 Sarcelle.
Table : Personne n'a encore posé..
Stratégie : Construction long terme — pot modeste ce tour.
Je pose : 4 Orange, 4 Or, 4 Vert.
- Combo visée avec les communes : Brelan (4).
- Coût long terme : garder 4 Orange servait à une construction (réserve 10).
- Coût long terme : garder 4 Or servait à une construction (réserve 6).
- Coût long terme : garder 4 Vert servait à une construction (réserve 6).
- Temporisation : les communes ne servent pas mon projet ce tour — je n'investis pas toute ma main.

##### Prisme (pose n°2)

- **Main avant coup** : 13 Or, 12 Sarcelle, Bluff (Orange), 2 Bleu nuit, 2 Vert
- **Table visible** : Éclat:3 posée(s)
- **Stratégie** : *Combo immédiate (greedy)*
- **Cartes jouées** : 13 Or, Bluff (Orange), 2 Bleu nuit

**Commentaire de l'agent :**

**Prisme** — agent greedy.
Communes : 5 Vert, 2 Orange, Échange de jeu (Rouge), 11 Sarcelle.
Je pose : 13 Or, Bluff (Orange), 2 Bleu nuit pour Arc-en-ciel.
- Approche myope : maximiser la combo immédiate (Arc-en-ciel).
- Je ne modélise pas le bluff social ni la construction sur plusieurs tours.

##### Arc (pose n°3)

- **Main avant coup** : 6 Rouge, 13 Rouge, 7 Bleu nuit, 12 Or, 11 Or
- **Table visible** : Éclat:3 posée(s), Prisme:3 posée(s) ★
- **Stratégie** : *Réaction prudente aux signaux adverses*
- **Cartes jouées** : 6 Rouge, 7 Bleu nuit, 12 Or

**Commentaire de l'agent :**

**Arc** (position de pose 3/4).
Main : 6 Rouge, 13 Rouge, 7 Bleu nuit, 12 Or, 11 Or.
Communes : 5 Vert, 2 Orange, Échange de jeu (Rouge), 11 Sarcelle.
Table : Éclat : 3 carte(s) posée(s) (3 cachée(s)) · Prisme : 3 carte(s) posée(s) (2 cachée(s), 1 spéciale(s) visible(s) ★).
Stratégie : Réaction prudente aux signaux adverses.
Je pose : 6 Rouge, 7 Bleu nuit, 12 Or.
- Combo visée avec les communes : Arc-en-ciel.
- Coût long terme : garder 6 Rouge servait à une construction (réserve 12).
- Coût long terme : garder 12 Or servait à une construction (réserve 9).
- Prudence : 2 joueur(s) ont déjà posé avec pression table=5 (Éclat : 3 carte(s) posée(s) (3 cachée(s)) · Prisme : 3 carte(s) posée(s) (2 cachée(s), 1 spéciale(s) visible(s) ★)).
- Je limite ma mise : plusieurs cartes chères sous pression.

##### Lumière (pose n°4)

- **Main avant coup** : 1 Or, 11 Orange, 1 Orange, Ajoute une carte (Vert), 12 Vert
- **Table visible** : Éclat:3 posée(s), Prisme:3 posée(s) ★, Arc:3 posée(s)
- **Stratégie** : *Combo immédiate (greedy)*
- **Cartes jouées** : 1 Or, 11 Orange, 1 Orange

**Commentaire de l'agent :**

**Lumière** — agent greedy.
Communes : 5 Vert, 2 Orange, Échange de jeu (Rouge), 11 Sarcelle.
Je pose : 1 Or, 11 Orange, 1 Orange pour Double paire (11+1).
- Approche myope : maximiser la combo immédiate (Double paire (11+1)).
- Je ne modélise pas le bluff social ni la construction sur plusieurs tours.

#### Résolution du pli

- **Éclat** → Brelan (4) (Brelan (4))
- **Prisme** → Arc-en-ciel (Arc-en-ciel)
- **Arc** → Arc-en-ciel (Arc-en-ciel)
- **Lumière** → Double paire (11+1) (Double paire (11+1))

- **Vainqueur(s)** : Prisme
- **Capture** : Prisme remporte le pli. Communes défaussées (non capturées). Cartes posées capturées vers sa pile (valeur ~21 pts cumulés).
- **Points cumulés (piles)** : J1=13 · J2=21 · J3=0 · J4=18

<details>
<summary>Extraits du journal moteur</summary>

- Éclat : Brelan (4)
- Prisme : Arc-en-ciel
- Arc : Arc-en-ciel
- Lumière : Double paire (11+1)
- Communes défaussées (non capturées).
- Prisme remporte le pli (12 cartes).

</details>

---

### Tour 4 — donneur : Prisme

- **Pioche restante** : 29 cartes
- **Communes** : 8 Or, Échange de jeu (Rouge), Inversion (Or), 6 Bleu nuit
- **Modificateurs** : Aucun modificateur global

#### Séquence de pose

##### Prisme (pose n°1)

- **Main avant coup** : 12 Sarcelle, 2 Vert, 6 Or, 2 Rouge, 2 Or
- **Table visible** : Aucune pile adverse visible.
- **Stratégie** : *Combo immédiate (greedy)*
- **Cartes jouées** : 2 Vert, 2 Rouge, 2 Or

**Commentaire de l'agent :**

**Prisme** — agent greedy.
Communes : 8 Or, Échange de jeu (Rouge), Inversion (Or), 6 Bleu nuit.
Je pose : 2 Vert, 2 Rouge, 2 Or pour Brelan (2).
- Approche myope : maximiser la combo immédiate (Brelan (2)).
- Je ne modélise pas le bluff social ni la construction sur plusieurs tours.

##### Arc (pose n°2)

- **Main avant coup** : 13 Rouge, 11 Or, 9 Vert, 5 Sarcelle, 1 Vert
- **Table visible** : Prisme:3 posée(s)
- **Stratégie** : *Réaction prudente aux signaux adverses*
- **Cartes jouées** : 13 Rouge

**Commentaire de l'agent :**

**Arc** (position de pose 2/4).
Main : 13 Rouge, 11 Or, 9 Vert, 5 Sarcelle, 1 Vert.
Communes : 8 Or, Échange de jeu (Rouge), Inversion (Or), 6 Bleu nuit.
Table : Prisme : 3 carte(s) posée(s) (3 cachée(s)).
Stratégie : Réaction prudente aux signaux adverses.
Je pose : 13 Rouge.
- Combo visée avec les communes : Carte haute (13).
- Prudence : 1 joueur(s) ont déjà posé avec pression table=1 (Prisme : 3 carte(s) posée(s) (3 cachée(s))).

##### Lumière (pose n°3)

- **Main avant coup** : Ajoute une carte (Vert), 12 Vert, 13 Bleu nuit, 5 Or, 1 Rouge
- **Table visible** : Prisme:3 posée(s), Arc:1 posée(s)
- **Stratégie** : *Combo immédiate (greedy)*
- **Cartes jouées** : 13 Bleu nuit

**Commentaire de l'agent :**

**Lumière** — agent greedy.
Communes : 8 Or, Échange de jeu (Rouge), Inversion (Or), 6 Bleu nuit.
Je pose : 13 Bleu nuit pour Carte haute (13).
- Approche myope : maximiser la combo immédiate (Carte haute (13)).
- Je ne modélise pas le bluff social ni la construction sur plusieurs tours.

##### Éclat (pose n°4)

- **Main avant coup** : 5 Rouge, 12 Orange, 7 Rouge, 13 Orange, Échange de jeu (Rouge)
- **Table visible** : Prisme:3 posée(s), Arc:1 posée(s), Lumière:1 posée(s)
- **Stratégie** : *Réaction prudente aux signaux adverses*
- **Cartes jouées** : 7 Rouge

**Commentaire de l'agent :**

**Éclat** (position de pose 4/4).
Main : 5 Rouge, 12 Orange, 7 Rouge, 13 Orange, Échange de jeu (Rouge).
Communes : 8 Or, Échange de jeu (Rouge), Inversion (Or), 6 Bleu nuit.
Table : Prisme : 3 carte(s) posée(s) (3 cachée(s)) · Arc : 1 carte(s) posée(s) (1 cachée(s)) · Lumière : 1 carte(s) posée(s) (1 cachée(s)).
Stratégie : Réaction prudente aux signaux adverses.
Je pose : 7 Rouge.
- Combo visée avec les communes : Petite suite.
- Coût long terme : garder 7 Rouge servait à une construction (réserve 7).
- Prudence : 3 joueur(s) ont déjà posé avec pression table=3 (Prisme : 3 carte(s) posée(s) (3 cachée(s)) · Arc : 1 carte(s) posée(s) (1 cachée(s)) · Lumière : 1 carte(s) posée(s) (1 cachée(s))).

#### Résolution du pli

- **Prisme** → Brelan (2) (Brelan (2))
- **Arc** → Carte haute (13) (Carte haute (13))
- **Lumière** → Carte haute (13) (Carte haute (13))
- **Éclat** → Petite suite (Petite suite)

- **Vainqueur(s)** : Éclat
- **Capture** : Éclat remporte le pli. Communes défaussées (non capturées). Cartes posées capturées vers sa pile (valeur ~24 pts cumulés).
- **Points cumulés (piles)** : J1=24 · J2=21 · J3=0 · J4=18

<details>
<summary>Extraits du journal moteur</summary>

- Éclat : Petite suite
- Prisme : Brelan (2)
- Arc : Carte haute (13)
- Lumière : Carte haute (13)
- Communes défaussées (non capturées).
- Éclat remporte le pli (6 cartes).

</details>

---

### Tour 5 — donneur : Arc

- **Pioche restante** : 19 cartes
- **Communes** : 10 Orange, 4 Sarcelle, 1 Sarcelle, 9 Or
- **Modificateurs** : Aucun modificateur global

#### Séquence de pose

##### Arc (pose n°1)

- **Main avant coup** : 11 Or, 9 Vert, 5 Sarcelle, 1 Vert, 9 Orange
- **Table visible** : Aucune pile adverse visible.
- **Stratégie** : *Prise d'initiative en début de séquence de pose*
- **Cartes jouées** : 9 Vert, 1 Vert, 9 Orange

**Commentaire de l'agent :**

**Arc** (position de pose 1/4).
Main : 11 Or, 9 Vert, 5 Sarcelle, 1 Vert, 9 Orange.
Communes : 10 Orange, 4 Sarcelle, 1 Sarcelle, 9 Or.
Table : Personne n'a encore posé..
Stratégie : Prise d'initiative en début de séquence de pose.
Je pose : 9 Vert, 1 Vert, 9 Orange.
- Combo visée avec les communes : Full (9+1).
- Coût long terme : garder 9 Vert servait à une construction (réserve 9).

##### Lumière (pose n°2)

- **Main avant coup** : Ajoute une carte (Vert), 12 Vert, 5 Or, 1 Rouge, 7 Orange
- **Table visible** : Arc:3 posée(s)
- **Stratégie** : *Combo immédiate (greedy)*
- **Cartes jouées** : 1 Rouge

**Commentaire de l'agent :**

**Lumière** — agent greedy.
Communes : 10 Orange, 4 Sarcelle, 1 Sarcelle, 9 Or.
Je pose : 1 Rouge pour Paire simple (1).
- Approche myope : maximiser la combo immédiate (Paire simple (1)).
- Je ne modélise pas le bluff social ni la construction sur plusieurs tours.

##### Éclat (pose n°3)

- **Main avant coup** : 5 Rouge, 12 Orange, 13 Orange, Échange de jeu (Rouge), 2 Sarcelle
- **Table visible** : Arc:3 posée(s), Lumière:1 posée(s)
- **Stratégie** : *Réaction prudente aux signaux adverses*
- **Cartes jouées** : Échange de jeu (Rouge)
- **Cible Échange** : Arc

**Commentaire de l'agent :**

**Éclat** (position de pose 3/4).
Main : 5 Rouge, 12 Orange, 13 Orange, Échange de jeu (Rouge), 2 Sarcelle.
Communes : 10 Orange, 4 Sarcelle, 1 Sarcelle, 9 Or.
Table : Arc : 3 carte(s) posée(s) (3 cachée(s)) · Lumière : 1 carte(s) posée(s) (1 cachée(s)).
Stratégie : Réaction prudente aux signaux adverses.
Je pose : Échange de jeu (Rouge).
- Combo visée avec les communes : Carte haute (10).
- Prudence : 2 joueur(s) ont déjà posé avec pression table=2 (Arc : 3 carte(s) posée(s) (3 cachée(s)) · Lumière : 1 carte(s) posée(s) (1 cachée(s))).
- Échange : viser le joueur le plus dangereux à l'aveugle.
- Cible d'échange : Arc.

##### Prisme (pose n°4)

- **Main avant coup** : 12 Sarcelle, 6 Or, 12 Bleu nuit, 3 Bleu nuit, 5 Bleu nuit
- **Table visible** : Arc:3 posée(s), Lumière:1 posée(s), Éclat:1 posée(s) ★
- **Stratégie** : *Combo immédiate (greedy)*
- **Cartes jouées** : 6 Or, 5 Bleu nuit

**Commentaire de l'agent :**

**Prisme** — agent greedy.
Communes : 10 Orange, 4 Sarcelle, 1 Sarcelle, 9 Or.
Je pose : 6 Or, 5 Bleu nuit pour Petite suite.
- Approche myope : maximiser la combo immédiate (Petite suite).
- Je ne modélise pas le bluff social ni la construction sur plusieurs tours.

#### Résolution du pli

- **Arc** → Carte haute (10) (Carte haute (10))
- **Lumière** → Paire simple (1) (Paire simple (1))
- **Éclat** → Full (9+1) (Full (9+1))
- **Prisme** → Petite suite (Petite suite)

- **Vainqueur(s)** : Éclat
- **Capture** : Éclat remporte le pli. Communes défaussées (non capturées). Cartes posées capturées vers sa pile (valeur ~36 pts cumulés).
- **Points cumulés (piles)** : J1=36 · J2=21 · J3=0 · J4=18

<details>
<summary>Extraits du journal moteur</summary>

- Éclat : Full (9+1)
- Prisme : Petite suite
- Arc : Carte haute (10)
- Lumière : Paire simple (1)
- Communes défaussées (non capturées).
- Éclat remporte le pli (7 cartes).

</details>

---

### Tour 6 — donneur : Lumière

- **Pioche restante** : 8 cartes
- **Communes** : 11 Rouge, 10 Rouge, 11 Vert, 4 Bleu nuit
- **Modificateurs** : Aucun modificateur global

#### Séquence de pose

##### Lumière (pose n°1)

- **Main avant coup** : Ajoute une carte (Vert), 12 Vert, 5 Or, 7 Orange, 8 Rouge
- **Table visible** : Aucune pile adverse visible.
- **Stratégie** : *Combo immédiate (greedy)*
- **Cartes jouées** : 12 Vert

**Commentaire de l'agent :**

**Lumière** — agent greedy.
Communes : 11 Rouge, 10 Rouge, 11 Vert, 4 Bleu nuit.
Je pose : 12 Vert pour Petite suite.
- Approche myope : maximiser la combo immédiate (Petite suite).
- Je ne modélise pas le bluff social ni la construction sur plusieurs tours.

##### Éclat (pose n°2)

- **Main avant coup** : 5 Rouge, 12 Orange, 13 Orange, 2 Sarcelle, 1 Bleu nuit
- **Table visible** : Lumière:1 posée(s)
- **Stratégie** : *Réaction prudente aux signaux adverses*
- **Cartes jouées** : 12 Orange

**Commentaire de l'agent :**

**Éclat** (position de pose 2/4).
Main : 5 Rouge, 12 Orange, 13 Orange, 2 Sarcelle, 1 Bleu nuit.
Communes : 11 Rouge, 10 Rouge, 11 Vert, 4 Bleu nuit.
Table : Lumière : 1 carte(s) posée(s) (1 cachée(s)).
Stratégie : Réaction prudente aux signaux adverses.
Je pose : 12 Orange.
- Combo visée avec les communes : Petite suite.
- Coût long terme : garder 12 Orange servait à une construction (réserve 7).
- Prudence : 1 joueur(s) ont déjà posé avec pression table=1 (Lumière : 1 carte(s) posée(s) (1 cachée(s))).

##### Prisme (pose n°3)

- **Main avant coup** : 12 Sarcelle, 12 Bleu nuit, 3 Bleu nuit, Prisme (Sarcelle), Ajoute une carte (Vert)
- **Table visible** : Lumière:1 posée(s), Éclat:1 posée(s)
- **Stratégie** : *Combo immédiate (greedy)*
- **Cartes jouées** : 12 Sarcelle

**Commentaire de l'agent :**

**Prisme** — agent greedy.
Communes : 11 Rouge, 10 Rouge, 11 Vert, 4 Bleu nuit.
Je pose : 12 Sarcelle pour Petite suite.
- Approche myope : maximiser la combo immédiate (Petite suite).
- Je ne modélise pas le bluff social ni la construction sur plusieurs tours.

##### Arc (pose n°4)

- **Main avant coup** : 11 Or, 5 Sarcelle, 10 Vert, 3 Sarcelle, 3 Orange
- **Table visible** : Lumière:1 posée(s), Éclat:1 posée(s), Prisme:1 posée(s)
- **Stratégie** : *Réaction prudente aux signaux adverses*
- **Cartes jouées** : 11 Or, 5 Sarcelle, 3 Orange

**Commentaire de l'agent :**

**Arc** (position de pose 4/4).
Main : 11 Or, 5 Sarcelle, 10 Vert, 3 Sarcelle, 3 Orange.
Communes : 11 Rouge, 10 Rouge, 11 Vert, 4 Bleu nuit.
Table : Lumière : 1 carte(s) posée(s) (1 cachée(s)) · Éclat : 1 carte(s) posée(s) (1 cachée(s)) · Prisme : 1 carte(s) posée(s) (1 cachée(s)).
Stratégie : Réaction prudente aux signaux adverses.
Je pose : 11 Or, 5 Sarcelle, 3 Orange.
- Combo visée avec les communes : Arc-en-ciel.
- Coût long terme : garder 5 Sarcelle servait à une construction (réserve 8).
- Prudence : 3 joueur(s) ont déjà posé avec pression table=3 (Lumière : 1 carte(s) posée(s) (1 cachée(s)) · Éclat : 1 carte(s) posée(s) (1 cachée(s)) · Prisme : 1 carte(s) posée(s) (1 cachée(s))).
- Je limite ma mise : plusieurs cartes chères sous pression.

#### Résolution du pli

- **Lumière** → Petite suite (Petite suite)
- **Éclat** → Petite suite (Petite suite)
- **Prisme** → Petite suite (Petite suite)
- **Arc** → Arc-en-ciel (Arc-en-ciel)

- **Vainqueur(s)** : Arc
- **Capture** : Arc remporte le pli. Communes défaussées (non capturées). Cartes posées capturées vers sa pile (valeur ~14 pts cumulés).
- **Points cumulés (piles)** : J1=36 · J2=21 · J3=14 · J4=18

<details>
<summary>Extraits du journal moteur</summary>

- Éclat : Petite suite
- Prisme : Petite suite
- Arc : Arc-en-ciel
- Lumière : Petite suite
- Communes défaussées (non capturées).
- Arc remporte le pli (6 cartes).

</details>

---

### Tour 7 — donneur : Éclat

- **Pioche restante** : 22 cartes
- **Communes** : 13 Sarcelle, 13 Vert, 8 Or, 12 Rouge
- **Modificateurs** : Aucun modificateur global

#### Séquence de pose

##### Éclat (pose n°1)

- **Main avant coup** : 5 Rouge, 13 Orange, 2 Sarcelle, 1 Bleu nuit, 10 Sarcelle
- **Table visible** : Aucune pile adverse visible.
- **Stratégie** : *Prise d'initiative en début de séquence de pose*
- **Cartes jouées** : 13 Orange, 1 Bleu nuit

**Commentaire de l'agent :**

**Éclat** (position de pose 1/4).
Main : 5 Rouge, 13 Orange, 2 Sarcelle, 1 Bleu nuit, 10 Sarcelle.
Communes : 13 Sarcelle, 13 Vert, 8 Or, 12 Rouge.
Table : Personne n'a encore posé..
Stratégie : Prise d'initiative en début de séquence de pose.
Je pose : 13 Orange, 1 Bleu nuit.
- Combo visée avec les communes : Arc-en-ciel.

##### Prisme (pose n°2)

- **Main avant coup** : 12 Bleu nuit, 3 Bleu nuit, Prisme (Sarcelle), Ajoute une carte (Vert), Bluff (Orange)
- **Table visible** : Éclat:2 posée(s)
- **Stratégie** : *Combo immédiate (greedy)*
- **Cartes jouées** : 12 Bleu nuit, Bluff (Orange)

**Commentaire de l'agent :**

**Prisme** — agent greedy.
Communes : 13 Sarcelle, 13 Vert, 8 Or, 12 Rouge.
Je pose : 12 Bleu nuit, Bluff (Orange) pour Arc-en-ciel.
- Approche myope : maximiser la combo immédiate (Arc-en-ciel).
- Je ne modélise pas le bluff social ni la construction sur plusieurs tours.

##### Arc (pose n°3)

- **Main avant coup** : 10 Vert, 3 Sarcelle, 9 Rouge, 8 Vert, Ajoute une carte (Vert)
- **Table visible** : Éclat:2 posée(s), Prisme:2 posée(s) ★
- **Stratégie** : *Réaction prudente aux signaux adverses*
- **Cartes jouées** : Ajoute une carte (Vert)

**Commentaire de l'agent :**

**Arc** (position de pose 3/4).
Main : 10 Vert, 3 Sarcelle, 9 Rouge, 8 Vert, Ajoute une carte (Vert).
Communes : 13 Sarcelle, 13 Vert, 8 Or, 12 Rouge.
Table : Éclat : 2 carte(s) posée(s) (2 cachée(s)) · Prisme : 2 carte(s) posée(s) (1 cachée(s), 1 spéciale(s) visible(s) ★).
Stratégie : Réaction prudente aux signaux adverses.
Je pose : Ajoute une carte (Vert).
- Combo visée avec les communes : Paire simple (13).
- Prudence : 2 joueur(s) ont déjà posé avec pression table=5 (Éclat : 2 carte(s) posée(s) (2 cachée(s)) · Prisme : 2 carte(s) posée(s) (1 cachée(s), 1 spéciale(s) visible(s) ★)).
- Ajoute : enrichir les communes avant résolution.

##### Lumière (pose n°4)

- **Main avant coup** : Ajoute une carte (Vert), 5 Or, 7 Orange, 8 Rouge, 9 Bleu nuit
- **Table visible** : Éclat:2 posée(s), Prisme:2 posée(s) ★, Arc:1 posée(s) ★
- **Stratégie** : *Combo immédiate (greedy)*
- **Cartes jouées** : 7 Orange, 9 Bleu nuit

**Commentaire de l'agent :**

**Lumière** — agent greedy.
Communes : 13 Sarcelle, 13 Vert, 8 Or, 12 Rouge.
Je pose : 7 Orange, 9 Bleu nuit pour Arc-en-ciel.
- Approche myope : maximiser la combo immédiate (Arc-en-ciel).
- Je ne modélise pas le bluff social ni la construction sur plusieurs tours.

#### Résolution du pli

- **Éclat** → Arc-en-ciel (Arc-en-ciel)
- **Prisme** → Arc-en-ciel (Arc-en-ciel)
- **Arc** → Paire simple (13) (Paire simple (13))
- **Lumière** → Arc-en-ciel (Arc-en-ciel)

- **Vainqueur(s)** : Lumière
- **Capture** : Lumière remporte le pli. Communes défaussées (non capturées). Cartes posées capturées vers sa pile (valeur ~33 pts cumulés).
- **Points cumulés (piles)** : J1=36 · J2=21 · J3=14 · J4=33

<details>
<summary>Extraits du journal moteur</summary>

- Éclat : Arc-en-ciel
- Prisme : Arc-en-ciel
- Arc : Paire simple (13)
- Lumière : Arc-en-ciel
- Communes défaussées (non capturées).
- Lumière remporte le pli (7 cartes).

</details>

---

### Tour 8 — donneur : Prisme

- **Pioche restante** : 10 cartes
- **Communes** : 5 Vert, Gèle (Bleu nuit), 4 Sarcelle, 9 Or
- **Modificateurs** : Aucun modificateur global

#### Séquence de pose

##### Prisme (pose n°1)

- **Main avant coup** : 3 Bleu nuit, Prisme (Sarcelle), Ajoute une carte (Vert), 1 Sarcelle, 8 Sarcelle
- **Table visible** : Aucune pile adverse visible.
- **Stratégie** : *Combo immédiate (greedy)*
- **Cartes jouées** : 3 Bleu nuit

**Commentaire de l'agent :**

**Prisme** — agent greedy.
Communes : 5 Vert, Gèle (Bleu nuit), 4 Sarcelle, 9 Or.
Je pose : 3 Bleu nuit pour Petite suite.
- Approche myope : maximiser la combo immédiate (Petite suite).
- Je ne modélise pas le bluff social ni la construction sur plusieurs tours.

##### Arc (pose n°2)

- **Main avant coup** : 10 Vert, 3 Sarcelle, 9 Rouge, 8 Vert, 2 Orange
- **Table visible** : Prisme:1 posée(s)
- **Stratégie** : *Réaction prudente aux signaux adverses*
- **Cartes jouées** : 3 Sarcelle

**Commentaire de l'agent :**

**Arc** (position de pose 2/4).
Main : 10 Vert, 3 Sarcelle, 9 Rouge, 8 Vert, 2 Orange.
Communes : 5 Vert, Gèle (Bleu nuit), 4 Sarcelle, 9 Or.
Table : Prisme : 1 carte(s) posée(s) (1 cachée(s)).
Stratégie : Réaction prudente aux signaux adverses.
Je pose : 3 Sarcelle.
- Combo visée avec les communes : Petite suite.
- Prudence : 1 joueur(s) ont déjà posé avec pression table=1 (Prisme : 1 carte(s) posée(s) (1 cachée(s))).

##### Lumière (pose n°3)

- **Main avant coup** : Ajoute une carte (Vert), 5 Or, 8 Rouge, 10 Orange, Échange de jeu (Rouge)
- **Table visible** : Prisme:1 posée(s), Arc:1 posée(s)
- **Stratégie** : *Combo immédiate (greedy)*
- **Cartes jouées** : 8 Rouge, 10 Orange

**Commentaire de l'agent :**

**Lumière** — agent greedy.
Communes : 5 Vert, Gèle (Bleu nuit), 4 Sarcelle, 9 Or.
Je pose : 8 Rouge, 10 Orange pour Petite suite.
- Approche myope : maximiser la combo immédiate (Petite suite).
- Je ne modélise pas le bluff social ni la construction sur plusieurs tours.

##### Éclat (pose n°4)

- **Main avant coup** : 5 Rouge, 2 Sarcelle, 10 Sarcelle, 10 Rouge, 6 Sarcelle
- **Table visible** : Prisme:1 posée(s), Arc:1 posée(s), Lumière:2 posée(s)
- **Stratégie** : *Réaction prudente aux signaux adverses*
- **Cartes jouées** : 6 Sarcelle

**Commentaire de l'agent :**

**Éclat** (position de pose 4/4).
Main : 5 Rouge, 2 Sarcelle, 10 Sarcelle, 10 Rouge, 6 Sarcelle.
Communes : 5 Vert, Gèle (Bleu nuit), 4 Sarcelle, 9 Or.
Table : Prisme : 1 carte(s) posée(s) (1 cachée(s)) · Arc : 1 carte(s) posée(s) (1 cachée(s)) · Lumière : 2 carte(s) posée(s) (2 cachée(s)).
Stratégie : Réaction prudente aux signaux adverses.
Je pose : 6 Sarcelle.
- Combo visée avec les communes : Petite suite.
- Coût long terme : garder 6 Sarcelle servait à une construction (réserve 11).
- Prudence : 3 joueur(s) ont déjà posé avec pression table=3 (Prisme : 1 carte(s) posée(s) (1 cachée(s)) · Arc : 1 carte(s) posée(s) (1 cachée(s)) · Lumière : 2 carte(s) posée(s) (2 cachée(s))).

#### Résolution du pli

- **Prisme** → Petite suite (Petite suite)
- **Arc** → Petite suite (Petite suite)
- **Lumière** → Petite suite (Petite suite)
- **Éclat** → Petite suite (Petite suite)

- **Vainqueur(s)** : Lumière
- **Capture** : Lumière remporte le pli. Communes défaussées (non capturées). Cartes posées capturées vers sa pile (valeur ~41 pts cumulés).
- **Points cumulés (piles)** : J1=36 · J2=21 · J3=14 · J4=41

<details>
<summary>Extraits du journal moteur</summary>

- Éclat : Petite suite
- Prisme : Petite suite
- Arc : Petite suite
- Lumière : Petite suite
- Communes défaussées (non capturées).
- Lumière remporte le pli (5 cartes).

</details>

---

### Tour 9 — donneur : Arc

- **Pioche restante** : 1 cartes
- **Communes** : 4 Bleu nuit, 6 Bleu nuit, Bluff (Orange), Inversion (Or)
- **Modificateurs** : Aucun modificateur global

#### Séquence de pose

##### Arc (pose n°1)

- **Main avant coup** : 10 Vert, 9 Rouge, 8 Vert, 2 Orange, 11 Sarcelle
- **Table visible** : Aucune pile adverse visible.
- **Stratégie** : *Prise d'initiative en début de séquence de pose*
- **Cartes jouées** : 10 Vert, 9 Rouge, 11 Sarcelle

**Commentaire de l'agent :**

**Arc** (position de pose 1/4).
Main : 10 Vert, 9 Rouge, 8 Vert, 2 Orange, 11 Sarcelle.
Communes : 4 Bleu nuit, 6 Bleu nuit, Bluff (Orange), Inversion (Or).
Table : Personne n'a encore posé..
Stratégie : Prise d'initiative en début de séquence de pose.
Je pose : 10 Vert, 9 Rouge, 11 Sarcelle.
- Combo visée avec les communes : Petite suite.
- Coût long terme : garder 10 Vert servait à une construction (réserve 11).
- Coût long terme : garder 9 Rouge servait à une construction (réserve 7).

##### Lumière (pose n°2)

- **Main avant coup** : Ajoute une carte (Vert), 5 Or, Échange de jeu (Rouge), 11 Vert, 11 Rouge
- **Table visible** : Arc:3 posée(s)
- **Stratégie** : *Combo immédiate (greedy)*
- **Cartes jouées** : 5 Or

**Commentaire de l'agent :**

**Lumière** — agent greedy.
Communes : 4 Bleu nuit, 6 Bleu nuit, Bluff (Orange), Inversion (Or).
Je pose : 5 Or pour Petite suite.
- Approche myope : maximiser la combo immédiate (Petite suite).
- Je ne modélise pas le bluff social ni la construction sur plusieurs tours.

##### Éclat (pose n°3)

- **Main avant coup** : 5 Rouge, 2 Sarcelle, 10 Sarcelle, 10 Rouge, Échange de jeu (Rouge)
- **Table visible** : Arc:3 posée(s), Lumière:1 posée(s)
- **Stratégie** : *Réaction prudente aux signaux adverses*
- **Cartes jouées** : 5 Rouge

**Commentaire de l'agent :**

**Éclat** (position de pose 3/4).
Main : 5 Rouge, 2 Sarcelle, 10 Sarcelle, 10 Rouge, Échange de jeu (Rouge).
Communes : 4 Bleu nuit, 6 Bleu nuit, Bluff (Orange), Inversion (Or).
Table : Arc : 3 carte(s) posée(s) (3 cachée(s)) · Lumière : 1 carte(s) posée(s) (1 cachée(s)).
Stratégie : Réaction prudente aux signaux adverses.
Je pose : 5 Rouge.
- Combo visée avec les communes : Petite suite.
- Prudence : 2 joueur(s) ont déjà posé avec pression table=2 (Arc : 3 carte(s) posée(s) (3 cachée(s)) · Lumière : 1 carte(s) posée(s) (1 cachée(s))).

##### Prisme (pose n°4)

- **Main avant coup** : Prisme (Sarcelle), Ajoute une carte (Vert), 1 Sarcelle, 8 Sarcelle, 10 Bleu nuit
- **Table visible** : Arc:3 posée(s), Lumière:1 posée(s), Éclat:1 posée(s)
- **Stratégie** : *Combo immédiate (greedy)*
- **Cartes jouées** : 10 Bleu nuit

**Commentaire de l'agent :**

**Prisme** — agent greedy.
Communes : 4 Bleu nuit, 6 Bleu nuit, Bluff (Orange), Inversion (Or).
Je pose : 10 Bleu nuit pour Carte haute (10).
- Approche myope : maximiser la combo immédiate (Carte haute (10)).
- Je ne modélise pas le bluff social ni la construction sur plusieurs tours.

#### Résolution du pli

- **Arc** → Petite suite (Petite suite)
- **Lumière** → Petite suite (Petite suite)
- **Éclat** → Petite suite (Petite suite)
- **Prisme** → Carte haute (10) (Carte haute (10))

- **Vainqueur(s)** : Arc
- **Capture** : Arc remporte le pli. Communes défaussées (non capturées). Cartes posées capturées vers sa pile (valeur ~25 pts cumulés).
- **Points cumulés (piles)** : J1=36 · J2=21 · J3=25 · J4=41

<details>
<summary>Extraits du journal moteur</summary>

- Éclat : Petite suite
- Prisme : Carte haute (10)
- Arc : Petite suite
- Lumière : Petite suite
- Communes défaussées (non capturées).
- Arc remporte le pli (6 cartes).

</details>

---

### Tour 10 — donneur : Lumière

- **Pioche restante** : 4 cartes
- **Communes** : 12 Rouge, 8 Or, 13 Sarcelle, 9 Or
- **Modificateurs** : Aucun modificateur global

#### Séquence de pose

##### Lumière (pose n°1)

- **Main avant coup** : Ajoute une carte (Vert), Échange de jeu (Rouge), 11 Vert, 11 Rouge, 4 Bleu nuit
- **Table visible** : Aucune pile adverse visible.
- **Stratégie** : *Combo immédiate (greedy)*
- **Cartes jouées** : 11 Vert

**Commentaire de l'agent :**

**Lumière** — agent greedy.
Communes : 12 Rouge, 8 Or, 13 Sarcelle, 9 Or.
Je pose : 11 Vert pour Petite suite.
- Approche myope : maximiser la combo immédiate (Petite suite).
- Je ne modélise pas le bluff social ni la construction sur plusieurs tours.

##### Éclat (pose n°2)

- **Main avant coup** : 2 Sarcelle, 10 Sarcelle, 10 Rouge, Échange de jeu (Rouge), Bluff (Orange)
- **Table visible** : Lumière:1 posée(s)
- **Stratégie** : *Intimidation / contrôle de la table*
- **Cartes jouées** : 10 Rouge, Bluff (Orange)

**Commentaire de l'agent :**

**Éclat** (position de pose 2/4).
Main : 2 Sarcelle, 10 Sarcelle, 10 Rouge, Échange de jeu (Rouge), Bluff (Orange).
Communes : 12 Rouge, 8 Or, 13 Sarcelle, 9 Or.
Table : Lumière : 1 carte(s) posée(s) (1 cachée(s)).
Stratégie : Intimidation / contrôle de la table.
Je pose : 10 Rouge, Bluff (Orange).
- Combo visée avec les communes : Petite suite.
- Bluff visible tôt : signaler une menace sans engager toute la main.
- Prudence : 1 joueur(s) ont déjà posé avec pression table=1 (Lumière : 1 carte(s) posée(s) (1 cachée(s))).

##### Prisme (pose n°3)

- **Main avant coup** : Prisme (Sarcelle), Ajoute une carte (Vert), 1 Sarcelle, 8 Sarcelle, Gèle (Bleu nuit)
- **Table visible** : Lumière:1 posée(s), Éclat:2 posée(s) ★
- **Stratégie** : *Combo immédiate (greedy)*
- **Cartes jouées** : 8 Sarcelle

**Commentaire de l'agent :**

**Prisme** — agent greedy.
Communes : 12 Rouge, 8 Or, 13 Sarcelle, 9 Or.
Je pose : 8 Sarcelle pour Paire simple (8).
- Approche myope : maximiser la combo immédiate (Paire simple (8)).
- Je ne modélise pas le bluff social ni la construction sur plusieurs tours.

##### Arc (pose n°4)

- **Main avant coup** : 8 Vert, 2 Orange, 6 Orange, 6 Bleu nuit, Inversion (Or)
- **Table visible** : Lumière:1 posée(s), Éclat:2 posée(s) ★, Prisme:1 posée(s)
- **Stratégie** : *Réaction prudente aux signaux adverses*
- **Cartes jouées** : 8 Vert, 2 Orange, 6 Bleu nuit

**Commentaire de l'agent :**

**Arc** (position de pose 4/4).
Main : 8 Vert, 2 Orange, 6 Orange, 6 Bleu nuit, Inversion (Or).
Communes : 12 Rouge, 8 Or, 13 Sarcelle, 9 Or.
Table : Lumière : 1 carte(s) posée(s) (1 cachée(s)) · Éclat : 2 carte(s) posée(s) (1 cachée(s), 1 spéciale(s) visible(s) ★) · Prisme : 1 carte(s) posée(s) (1 cachée(s)).
Stratégie : Réaction prudente aux signaux adverses.
Je pose : 8 Vert, 2 Orange, 6 Bleu nuit.
- Combo visée avec les communes : Arc-en-ciel.
- Prudence : 3 joueur(s) ont déjà posé avec pression table=6 (Lumière : 1 carte(s) posée(s) (1 cachée(s)) · Éclat : 2 carte(s) posée(s) (1 cachée(s), 1 spéciale(s) visible(s) ★) · Prisme : 1 carte(s) posée(s) (1 cachée(s))).
- Je limite ma mise : plusieurs cartes chères sous pression.

#### Résolution du pli

- **Lumière** → Petite suite (Petite suite)
- **Éclat** → Petite suite (Petite suite)
- **Prisme** → Paire simple (8) (Paire simple (8))
- **Arc** → Arc-en-ciel (Arc-en-ciel)

- **Vainqueur(s)** : Arc
- **Capture** : Arc remporte le pli. Communes défaussées (non capturées). Cartes posées capturées vers sa pile (valeur ~39 pts cumulés).
- **Points cumulés (piles)** : J1=36 · J2=21 · J3=39 · J4=41

<details>
<summary>Extraits du journal moteur</summary>

- Éclat : Petite suite
- Prisme : Paire simple (8)
- Arc : Arc-en-ciel
- Lumière : Petite suite
- Communes défaussées (non capturées).
- Arc remporte le pli (7 cartes).

</details>

---

### Tour 11 — donneur : Éclat

- **Pioche restante** : 0 cartes
- **Communes** : 12 Rouge
- **Modificateurs** : Aucun modificateur global

#### Séquence de pose

##### Éclat (pose n°1)

- **Main avant coup** : 2 Sarcelle, 10 Sarcelle, Échange de jeu (Rouge), 13 Vert, Prisme (Sarcelle)
- **Table visible** : Aucune pile adverse visible.
- **Stratégie** : *Prise d'initiative en début de séquence de pose*
- **Cartes jouées** : Échange de jeu (Rouge)
- **Cible Échange** : Lumière

**Commentaire de l'agent :**

**Éclat** (position de pose 1/4).
Main : 2 Sarcelle, 10 Sarcelle, Échange de jeu (Rouge), 13 Vert, Prisme (Sarcelle).
Communes : 12 Rouge.
Table : Personne n'a encore posé..
Stratégie : Prise d'initiative en début de séquence de pose.
Je pose : Échange de jeu (Rouge).
- Combo visée avec les communes : Carte haute (12).
- Échange : viser le joueur le plus dangereux à l'aveugle.
- Cible d'échange : Lumière.

##### Prisme (pose n°2)

- **Main avant coup** : Prisme (Sarcelle), Ajoute une carte (Vert), 1 Sarcelle, Gèle (Bleu nuit), 5 Vert
- **Table visible** : Éclat:1 posée(s) ★
- **Stratégie** : *Combo immédiate (greedy)*
- **Cartes jouées** : Prisme (Sarcelle)

**Commentaire de l'agent :**

**Prisme** — agent greedy.
Communes : 12 Rouge.
Je pose : Prisme (Sarcelle) pour Carte haute (12).
- Approche myope : maximiser la combo immédiate (Carte haute (12)).
- Je ne modélise pas le bluff social ni la construction sur plusieurs tours.

##### Arc (pose n°3)

- **Main avant coup** : 6 Orange, Inversion (Or), 8 Or, 9 Or, 13 Sarcelle
- **Table visible** : Éclat:1 posée(s) ★, Prisme:1 posée(s) ★
- **Stratégie** : *Réaction prudente aux signaux adverses*
- **Cartes jouées** : Inversion (Or)

**Commentaire de l'agent :**

**Arc** (position de pose 3/4).
Main : 6 Orange, Inversion (Or), 8 Or, 9 Or, 13 Sarcelle.
Communes : 12 Rouge.
Table : Éclat : 1 carte(s) posée(s) (0 cachée(s), 1 spéciale(s) visible(s) ★) · Prisme : 1 carte(s) posée(s) (0 cachée(s), 1 spéciale(s) visible(s) ★).
Stratégie : Réaction prudente aux signaux adverses.
Je pose : Inversion (Or).
- Combo visée avec les communes : Carte haute (12).
- Prudence : 2 joueur(s) ont déjà posé avec pression table=8 (Éclat : 1 carte(s) posée(s) (0 cachée(s), 1 spéciale(s) visible(s) ★) · Prisme : 1 carte(s) posée(s) (0 cachée(s), 1 spéciale(s) visible(s) ★)).
- Inversion : valoriser mes cartes basses (1–4).

##### Lumière (pose n°4)

- **Main avant coup** : Ajoute une carte (Vert), Échange de jeu (Rouge), 11 Rouge, 4 Bleu nuit, 4 Sarcelle
- **Table visible** : Éclat:1 posée(s) ★, Prisme:1 posée(s) ★, Arc:1 posée(s) ★
- **Stratégie** : *Combo immédiate (greedy)*
- **Cartes jouées** : 4 Bleu nuit, 4 Sarcelle

**Commentaire de l'agent :**

**Lumière** — agent greedy.
Communes : 12 Rouge.
Je pose : 4 Bleu nuit, 4 Sarcelle pour Paire simple (4).
- Approche myope : maximiser la combo immédiate (Paire simple (4)).
- Je ne modélise pas le bluff social ni la construction sur plusieurs tours.

#### Résolution du pli

- **Éclat** → Paire simple (4) (Paire simple (4))
- **Prisme** → Carte haute (12) (Carte haute (12))
- **Arc** → Carte haute (12) (Carte haute (12))
- **Lumière** → Carte haute (12) (Carte haute (12))

- **Vainqueur(s)** : Éclat
- **Capture** : Éclat remporte le pli. Communes défaussées (non capturées). Cartes posées capturées vers sa pile (valeur ~47 pts cumulés).
- **Points cumulés (piles)** : J1=47 · J2=21 · J3=39 · J4=41

<details>
<summary>Extraits du journal moteur</summary>

- Éclat : Paire simple (4)
- Prisme : Carte haute (12)
- Arc : Carte haute (12)
- Lumière : Carte haute (12)
- Communes défaussées (non capturées).
- Éclat remporte le pli (5 cartes).

</details>

---

## Bilan final

**Vainqueur(s)** : Éclat

| Joueur | Total | Pile | Plis | Bonus plis | Bonus main | Bonus last3 |
|--------|-------|------|------|--------------|------------|-------------|
| Éclat | 56 | 47 | 4 | 4 | 5 | 0 |
| Prisme | 21 | 21 | 1 | 0 | 0 | 0 |
| Arc | 44 | 39 | 3 | 0 | 5 | 0 |
| Lumière | 41 | 41 | 3 | 0 | 0 | 0 |

Écart 1er–dernier : **35** pts · seed 4242