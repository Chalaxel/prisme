#!/usr/bin/env node
import { cloneRules, defaultRules } from "../rules/defaultRules";
import { BALANCE_ITERATIONS } from "../rules/iterations";
import { BOTS } from "./bot";
import { evaluateGameReport, formatEvaluation } from "./evaluate";
import {
  aggregateReports,
  deriveInsights,
  formatAggregate,
  formatGameReport,
} from "./metrics";
import { runBatch, runSimulation } from "./play";

type CliArgs = {
  games: number;
  players: number;
  seed: number;
  bot: string;
  verbose: boolean;
  json: boolean;
  sample: number;
  variant: string | null;
};

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    games: 200,
    players: 4,
    seed: 42,
    bot: "greedy",
    verbose: false,
    json: false,
    sample: 0,
    variant: null,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    switch (arg) {
      case "--games":
      case "-g":
        args.games = Number(next);
        i += 1;
        break;
      case "--players":
      case "-p":
        args.players = Number(next);
        i += 1;
        break;
      case "--seed":
      case "-s":
        args.seed = Number(next);
        i += 1;
        break;
      case "--bot":
      case "-b":
        args.bot = next;
        i += 1;
        break;
      case "--verbose":
      case "-v":
        args.verbose = true;
        break;
      case "--json":
        args.json = true;
        break;
      case "--sample":
        args.sample = Number(next);
        i += 1;
        break;
      case "--variant":
        args.variant = next;
        i += 1;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage: npm run simulate -- [options]

Simule des parties PRISME avec des bots et produit des métriques d'équilibrage.

Options:
  -g, --games <n>      Nombre de parties (défaut: 200)
  -p, --players <n>    Joueurs 2–6 (défaut: 4)
  -s, --seed <n>       Graine RNG (défaut: 42)
  -b, --bot <name>     greedy | strategic | noisy | random | strategic-noisy (défaut: greedy)
  --variant <id>       iter1 … iter5 ou label (ex. iter5-light-capture)
  -v, --verbose        Détail d'une partie (--games 1 recommandé)
  --json               Sortie JSON agrégée
  --sample <n>         Affiche n replays concis après l'agrégat
  -h, --help           Aide

Exemples:
  npm run simulate -- --games 500 --players 4
  npm run simulate -- --games 1 --verbose --seed 7
  npm run simulate -- --games 300 --bot noisy --sample 2
`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const bot = BOTS[args.bot];
  if (!bot) {
    console.error(`Bot inconnu : ${args.bot}. Disponibles : ${Object.keys(BOTS).join(", ")}`);
    process.exit(1);
  }
  if (args.players < 2 || args.players > 6) {
    console.error("Le nombre de joueurs doit être entre 2 et 6.");
    process.exit(1);
  }

  let rules = cloneRules(defaultRules);
  if (args.variant !== null) {
    const variant = args.variant;
    const found = BALANCE_ITERATIONS.find(
      (it) =>
        String(it.id) === variant ||
        it.rules.variantLabel === variant ||
        it.name.toLowerCase().includes(variant.toLowerCase()),
    );
    if (!found) {
      console.error(`Variante inconnue : ${args.variant}`);
      process.exit(1);
    }
    rules = cloneRules(found.rules);
  }

  if (args.games === 1 && args.verbose) {
    const report = runSimulation({
      playerCount: args.players,
      seed: args.seed,
      bot,
      rules,
    });
    console.log(formatGameReport(report, rules, true));
    console.log("");
    console.log("Évaluation :");
    console.log(formatEvaluation(evaluateGameReport(report, rules)));
    return;
  }

  const reports = runBatch(args.games, args.players, args.seed, bot, rules);
  const metrics = aggregateReports(reports, rules);
  const insights = deriveInsights(metrics, rules);

  if (args.json) {
    console.log(JSON.stringify({ metrics, insights, rules: { label: "livret" } }, null, 2));
  } else {
    console.log(formatAggregate(metrics, insights));
    if (args.sample > 0) {
      console.log("");
      for (const report of reports.slice(0, args.sample)) {
        console.log(formatGameReport(report, rules, args.verbose));
        console.log("");
      }
    }
  }
}

main();
