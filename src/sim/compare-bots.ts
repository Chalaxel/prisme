#!/usr/bin/env node
/**
 * Compare greedy vs strategic bots sur les règles livret et iter5.
 */
import { iter1Livret, iter5LightCapture } from "../rules/iterations";
import { greedyBot } from "./bot-shared";
import { aggregateReports, deriveInsights, formatAggregate } from "./metrics";
import { runBatch } from "./play";
import { strategicBot } from "./strategic";

const games = Number(process.argv[process.argv.indexOf("--games") + 1] ?? 300);
const players = Number(process.argv[process.argv.indexOf("--players") + 1] ?? 4);
const seed = Number(process.argv[process.argv.indexOf("--seed") + 1] ?? 4242);

const configs = [
  { label: "Livret", rules: iter1Livret },
  { label: "Iter5 capture allégée", rules: iter5LightCapture },
];

for (const cfg of configs) {
  console.log(`\n######## ${cfg.label} · ${games} parties · ${players}j ########\n`);
  for (const bot of [greedyBot, strategicBot]) {
    const reports = runBatch(games, players, seed, bot, cfg.rules);
    const metrics = aggregateReports(reports, cfg.rules);
    const insights = deriveInsights(metrics, cfg.rules);
    console.log(`=== Bot: ${bot.name} ===`);
    console.log(formatAggregate(metrics, insights));
    console.log("");
  }
}
