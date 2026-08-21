#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { cloneRules, defaultRules } from "../rules/defaultRules";
import { BALANCE_ITERATIONS } from "../rules/iterations";
import { createMixedAgents } from "./agents/explainable";
import { aggregateReports, deriveInsights, formatAggregate } from "./metrics";
import { runTracedGame } from "./tracedGame";
import { formatTracedGameMarkdown, traceOutputPath } from "./traceMarkdown";

type CliArgs = {
  seed: number;
  variant: string;
  agents: string[];
  names: string[];
  trace: number;
  batch: number;
  out: string | null;
  verbose: boolean;
};

const DEFAULT_NAMES = ["Éclat", "Prisme", "Arc", "Lumière"];
const DEFAULT_AGENTS = ["strategic", "strategic", "greedy", "strategic"];

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    seed: 4242,
    variant: "iter5",
    agents: [...DEFAULT_AGENTS],
    names: [...DEFAULT_NAMES],
    trace: 1,
    batch: 0,
    out: null,
    verbose: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    switch (arg) {
      case "--seed":
      case "-s":
        args.seed = Number(next);
        i += 1;
        break;
      case "--variant":
      case "-v":
        args.variant = next;
        i += 1;
        break;
      case "--agents":
      case "-a":
        args.agents = next.split(",").map((s) => s.trim());
        i += 1;
        break;
      case "--names":
      case "-n":
        args.names = next.split(",").map((s) => s.trim());
        i += 1;
        break;
      case "--trace":
      case "-t":
        args.trace = Number(next);
        i += 1;
        break;
      case "--batch":
      case "-b":
        args.batch = Number(next);
        i += 1;
        break;
      case "--out":
      case "-o":
        args.out = next;
        i += 1;
        break;
      case "--verbose":
        args.verbose = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
    }
  }

  return args;
}

function printHelp(): void {
  console.log(`Usage: npm run simulate:ai -- [options]

Simule des parties avec agents explicables (stratégie + commentaire FR par coup).

Options:
  -s, --seed <n>       Seed RNG (défaut: 4242)
  -v, --variant <id>   Variante: default, iter1..iter5 (défaut: iter5)
  -a, --agents <list>  Types par siège, séparés par virgule (strategic, greedy)
  -n, --names <list>   Noms des joueurs
  -t, --trace <n>      Nombre de parties tracées en Markdown (défaut: 1)
  -b, --batch <n>      Lot sans trace pour métriques agrégées (0 = off)
  -o, --out <path>     Fichier de sortie pour la 1re trace (sinon docs/simulations/...)
      --verbose        Affiche un résumé console
  -h, --help           Cette aide

Exemple:
  npm run simulate:ai -- --seed 99 --variant iter5 --agents strategic,greedy,strategic,greedy --trace 1
`);
}

function resolveRules(variant: string) {
  if (variant === "default") return cloneRules(defaultRules);
  const iter = BALANCE_ITERATIONS.find(
    (x) => x.id === Number(variant.replace(/\D/g, "")) || x.rules.variantLabel === variant,
  );
  if (iter) return cloneRules(iter.rules);
  throw new Error(`Variante inconnue: ${variant}. Utilisez default, iter1..iter5.`);
}

function ensureParent(path: string): void {
  mkdirSync(dirname(path), { recursive: true });
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const rules = resolveRules(args.variant);
  const variantLabel = rules.variantLabel ?? "default";
  const playerCount = Math.max(args.agents.length, args.names.length, 4);

  while (args.names.length < playerCount) {
    args.names.push(`Joueur ${args.names.length + 1}`);
  }
  while (args.agents.length < playerCount) {
    args.agents.push("strategic");
  }

  const written: string[] = [];

  for (let i = 0; i < args.trace; i++) {
    const seed = args.seed + i;
    const simAgents = createMixedAgents(args.agents.slice(0, playerCount), args.names.slice(0, playerCount));
    const game = runTracedGame({ seed, rules, agents: simAgents });
    const markdown = formatTracedGameMarkdown(game);
    const outPath =
      i === 0 && args.out
        ? args.out
        : traceOutputPath(seed, `${variantLabel}_${args.agents.join("-")}`);
    ensureParent(outPath);
    writeFileSync(join(process.cwd(), outPath), markdown, "utf8");
    written.push(outPath);

    if (args.verbose) {
      console.log(`\n=== Partie tracée seed ${seed} ===`);
      console.log(`Fichier : ${outPath}`);
      console.log(`Tours : ${game.turns.length} · Écart : ${game.report.scoreSpread}`);
      console.log(
        game.report.scores.map((s) => `${s.name}: ${s.total} pts`).join(" · "),
      );
    }
  }

  if (args.batch > 0) {
    const reports = [];
    for (let i = 0; i < args.batch; i++) {
      const seed = args.seed + 10000 + i;
      const simAgents = createMixedAgents(args.agents.slice(0, playerCount), args.names.slice(0, playerCount));
      reports.push(runTracedGame({ seed, rules, agents: simAgents }).report);
    }
    const metrics = aggregateReports(reports, rules);
    const insights = deriveInsights(metrics, rules);
    console.log("\n=== Lot agents mixtes ===");
    console.log(formatAggregate(metrics, insights));
    if (insights.length) {
      console.log("\nInsights :");
      for (const insight of insights) {
        console.log(`- [${insight.severity}] ${insight.topic}: ${insight.message}`);
      }
    }
  }

  if (!args.verbose && written.length) {
    console.log(`Trace(s) écrite(s) : ${written.join(", ")}`);
  }
}

main();
