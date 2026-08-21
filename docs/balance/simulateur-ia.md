# Simulateur IA avancé — PRISME

Ce simulateur fait s’affronter des **agents IA** avec mémoire, personnalités et commentaires enrichis. Il complète le simulateur heuristique (`simulate:ai`).

## Ce que ça apporte

| Capacité | Détail |
|----------|--------|
| **Observation réaliste** | Chaque agent ne « voit » que sa main, les communes, les piles déjà posées (badges ★), pas les mains adverses. |
| **Personnalités** | Tacticien, Intimidateur, Architecte, Grindeur — style de bluff, risque, long terme. |
| **Mémoire** | Historique des plis, signaux visibles, notes sur les adversaires. |
| **LLM (optionnel)** | Appel OpenAI-compatible pour décider et commenter chaque coup. |
| **Trace enrichie** | Lecture adverse, confiance, mémoire avant coup, temps de délibération. |

## Modes disponibles

### Mode local (sans clé API)

```bash
npm run simulate:llm -- --seed 4242 --variant iter5 --verbose
```

Agents heuristiques enrichis (strategic + personnalité + mémoire). Utile pour tester la boucle sans coût API.

### Mode LLM (OpenAI-compatible)

```bash
export OPENAI_API_KEY=sk-...
npm run simulate:llm -- --seed 99 --variant iter5 --provider openai --model gpt-4o-mini --verbose
```

Variables utiles :

| Variable | Rôle |
|----------|------|
| `OPENAI_API_KEY` | Active le mode LLM |
| `OPENAI_BASE_URL` | Autre endpoint compatible (Azure, local, etc.) |
| `OPENAI_MODEL` | Modèle (défaut : `gpt-4o-mini`) |
| `PRISME_LLM_PROVIDER` | `auto`, `openai`, `local`, `mock` |

## Personnalités

```bash
npm run simulate:llm -- \
  --personalities tactician,intimidator,architect,grinder \
  --names Éclat,Prisme,Arc,Lumière
```

- **tactician** — lit la table, temporise
- **intimidator** — bluff visible, pression early
- **architect** — construction sur plusieurs tours
- **grinder** — combo immédiate, peu de bluff pur

## Sortie

Markdown dans `docs/simulations/` :

```
docs/simulations/2026-08-21_llm_openai_seed4242_iter5-light-capture.md
```

Chaque tour contient : mémoire, stratégie, lecture adverse, commentaire IA, résolution du pli.

## Architecture (fichiers)

```
src/sim/observe.ts           — projection partielle pour prompts
src/sim/agents/memory.ts     — mémoire inter-plis
src/sim/agents/personalities.ts
src/sim/agents/llmClient.ts  — client OpenAI / mock / local
src/sim/agents/llmAgent.ts   — agent async
src/sim/agents/llmPrompt.ts  — prompts FR
src/sim/asyncTracedGame.ts   — boucle de partie async
src/sim/run-llm.ts           — CLI
```

## Limites honnêtes

- Le mode local reste heuristique — pas un vrai modèle génératif.
- Le LLM ajoute du coût et de la latence (~4 appels × nombre de tours).
- La mémoire post-pli par réflexion LLM (`--no-reflect` pour désactiver) est optionnelle.
- Rien ne remplace un playtest humain hot-seat pour le bluff social.
