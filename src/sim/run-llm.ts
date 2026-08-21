#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { cloneRules, defaultRules } from "../rules/defaultRules";
import { BALANCE_ITERATIONS } from "../rules/iterations";
import { runAsyncTracedGame } from "./asyncTracedGame";
import { createLlmAgents } from "./agents/llmAgent";
import { createLlmClient, resolveLlmConfig } from "./agents/llmClient";
import { DEFAULT_PERSONALITY_IDS } from "./agents/personalities";
import { formatLlmTracedGameMarkdown, llmTraceOutputPath } from "./llmTraceMarkdown";

type CliArgs = {
  seed: number;
  variant: string;
  names: string[];
  personalities: string[];
  provider: string | null;
  model: string | null;
  trace: number;
  out: string | null;
  verbose: boolean;
  reflect: boolean;
};

const DEFAULT_NAMES = ["Éclat", "Prisme", "Arc", "Lumière"];

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    seed: 4242,
    variant: "iter5",
    names: [...DEFAULT_NAMES],
    personalities: [...DEFAULT_PERSONALITY_IDS],
    provider: null,
    model: null,
    trace: 1,
    out: null,
    verbose: false,
    reflect: true,
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
      case "--names":
      case "-n":
        args.names = next.split(",").map((s) => s.trim());
        i += 1;
        break;
      case "--personalities":
      case "-p":
        args.personalities = next.split(",").map((s) => s.trim());
        i += 1;
        break;
      case "--provider":
        args.provider = next;
        i += 1;
        break;
      case "--model":
      case "-m":
        args.model = next;
        i += 1;
        break;
      case "--trace":
      case "-t":
        args.trace = Number(next);
        i += 1;
        break;
      case "--out":
      case "-o":
        args.out = next;
        i += 1;
        break;
      case "--no-reflect":
        args.reflect = false;
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
  console.log(`Usage: npm run simulate:llm -- [options]

Simule une partie avec agents IA (LLM OpenAI-compatible ou mode local).

Variables d'environnement :
  OPENAI_API_KEY          Clé API (active le mode openai)
  OPENAI_BASE_URL         URL compatible OpenAI (défaut: api.openai.com)
  OPENAI_MODEL            Modèle (défaut: gpt-4o-mini)
  PRISME_LLM_PROVIDER     openai | local | mock | auto (défaut: auto)

Options :
  -s, --seed <n>              Seed RNG
  -v, --variant <id>          default, iter1..iter5 (défaut: iter5)
  -n, --names <list>          Noms joueurs
  -p, --personalities <list>  tactician,intimidator,architect,grinder
      --provider <id>         Forcer openai/local/mock
  -m, --model <name>          Modèle LLM
  -t, --trace <n>             Parties tracées (défaut: 1)
  -o, --out <path>            Fichier Markdown de sortie
      --no-reflect            Désactive la réflexion IA post-pli
      --verbose
  -h, --help

Exemple :
  OPENAI_API_KEY=sk-... npm run simulate:llm -- --seed 99 --variant iter5 -v
`);
}

function resolveRules(variant: string) {
  if (variant === "default") return cloneRules(defaultRules);
  const iter = BALANCE_ITERATIONS.find(
    (x) => x.id === Number(variant.replace(/\D/g, "")) || x.rules.variantLabel === variant,
  );
  if (iter) return cloneRules(iter.rules);
  throw new Error(`Variante inconnue: ${variant}`);
}

function ensureParent(path: string): void {
  mkdirSync(dirname(path), { recursive: true });
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const rules = resolveRules(args.variant);
  const variantLabel = rules.variantLabel ?? "default";

  const env = { ...process.env };
  if (args.provider) env.PRISME_LLM_PROVIDER = args.provider;
  if (args.model) env.PRISME_LLM_MODEL = args.model;

  const config = resolveLlmConfig(env);
  await createLlmClient(config);

  if (config.provider === "local") {
    console.log("Mode local (pas de clé API) — agents heuristiques enrichis + mémoire.");
    console.log("Définissez OPENAI_API_KEY pour activer un vrai LLM.\n");
  } else if (config.provider === "openai") {
    console.log(`Mode LLM : ${config.model} via ${config.baseUrl}\n`);
  }

  const playerCount = Math.max(args.names.length, args.personalities.length, 4);
  while (args.names.length < playerCount) args.names.push(`Joueur ${args.names.length + 1}`);
  while (args.personalities.length < playerCount) args.personalities.push("tactician");

  const specs = args.names.slice(0, playerCount).map((name, i) => ({
    name,
    personalityId: args.personalities[i] ?? "tactician",
  }));

  const written: string[] = [];

  for (let i = 0; i < args.trace; i++) {
    const seed = args.seed + i;
    const agents = await createLlmAgents(specs, config, { reflectAfterTrick: args.reflect });

    const game = await runAsyncTracedGame({
      seed,
      rules,
      agents,
      llmProvider: config.provider,
      llmModel: config.model ?? "unknown",
      onProgress: args.verbose ? (msg) => console.log(msg) : undefined,
    });

    const markdown = formatLlmTracedGameMarkdown(game);
    const outPath =
      i === 0 && args.out
        ? args.out
        : llmTraceOutputPath(seed, variantLabel, config.provider);
    ensureParent(outPath);
    writeFileSync(join(process.cwd(), outPath), markdown, "utf8");
    written.push(outPath);

    if (args.verbose) {
      console.log(`\n=== Partie seed ${seed} ===`);
      console.log(`Fichier : ${outPath}`);
      console.log(
        `IA : ${game.stats.llmCalls} appels · ${game.stats.fallbacks} replis · écart ${game.report.scoreSpread}`,
      );
    }
  }

  if (!args.verbose && written.length) {
    console.log(`Trace(s) IA : ${written.join(", ")}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
