# PRISME — proto d’équilibrage

Prototype web (hot-seat) pour tester les règles et l’équilibrage.

**Partie en ligne :** https://chalaxel.github.io/prisme/

En local :

```bash
npm install
npm run dev
```

## Simulation automatique

Pour lancer des centaines de parties avec des bots et obtenir des métriques d’équilibrage :

```bash
npm run simulate -- --games 500 --players 4
npm run simulate -- --games 1 --verbose --seed 7
npm run simulate -- --json --games 200
npm run simulate -- --bot strategic --games 500 --players 4
npm run simulate:compare-bots -- --games 300
```

Options : `--games`, `--players`, `--seed`, `--bot greedy|noisy|random`, `--verbose`, `--sample`, `--json`.
