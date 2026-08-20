#!/usr/bin/env node
import { BALANCE_ITERATIONS } from "../rules/iterations";
import { greedyBot } from "./bot";
import { aggregateReports, deriveInsights } from "./metrics";
import { runBatch } from "./play";

type Row = {
  id: number;
  name: string;
  label: string;
  avgSpread: number;
  closeRate: number;
  blowoutRate: number;
  leaderMidWins: number;
  snowball: number;
  prismeRate: number;
  bluffPerTrick: number;
  avgTurns: number;
  topCombo: string;
  insights: string[];
};

function topComboKind(metrics: ReturnType<typeof aggregateReports>): string {
  const entries = Object.entries(metrics.comboKindWins).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  return entries[0]?.[0] ?? "?";
}

function main() {
  const games = Number(process.argv[process.argv.indexOf("--games") + 1] ?? 500);
  const players = Number(process.argv[process.argv.indexOf("--players") + 1] ?? 4);
  const seed = Number(process.argv[process.argv.indexOf("--seed") + 1] ?? 2026);
  const json = process.argv.includes("--json");

  const rows: Row[] = [];

  for (const iter of BALANCE_ITERATIONS) {
    const reports = runBatch(games, players, seed + iter.id * 10_000, greedyBot, iter.rules);
    const metrics = aggregateReports(reports, iter.rules);
    metrics.rulesLabel = iter.rules.variantLabel ?? iter.name;
    const insights = deriveInsights(metrics, iter.rules);

    rows.push({
      id: iter.id,
      name: iter.name,
      label: iter.rules.variantLabel ?? iter.name,
      avgSpread: metrics.avgScoreSpread,
      closeRate: metrics.closeGameRate,
      blowoutRate: metrics.blowoutRate,
      leaderMidWins: metrics.leaderMidGameWins,
      snowball: metrics.snowballRepeatRate,
      prismeRate: metrics.prismeTrickRate,
      bluffPerTrick: metrics.avgBluffPlayed,
      avgTurns: metrics.avgTurns,
      topCombo: topComboKind(metrics),
      insights: insights.map((i) => `[${i.topic}] ${i.message}`),
    });
  }

  if (json) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }

  console.log(`=== PRISME — ${games} parties × ${BALANCE_ITERATIONS.length} itérations (${players}j, seed ${seed}) ===\n`);
  console.log(
    "Iter | Variante                  | Écart | Serrées | Blowouts | Leader mid | Snowball | Prisme | Bluff/pl | Tours | Top combo",
  );
  console.log("-".repeat(120));
  for (const r of rows) {
    console.log(
      `${String(r.id).padStart(4)} | ${r.name.padEnd(25)} | ${r.avgSpread.toFixed(0).padStart(5)} | ${(r.closeRate * 100).toFixed(0).padStart(6)}% | ${(r.blowoutRate * 100).toFixed(0).padStart(7)}% | ${(r.leaderMidWins * 100).toFixed(0).padStart(9)}% | ${(r.snowball * 100).toFixed(0).padStart(7)}% | ${(r.prismeRate * 100).toFixed(0).padStart(5)}% | ${(r.bluffPerTrick * 100).toFixed(0).padStart(7)}% | ${r.avgTurns.toFixed(1).padStart(5)} | ${r.topCombo}`,
    );
  }

  console.log("\n=== Pistes auto par itération ===");
  for (const r of rows) {
    console.log(`\n--- Itération ${r.id} : ${r.name} ---`);
    if (!r.insights.length) console.log("  (aucune alerte)");
    for (const line of r.insights) console.log(`  · ${line}`);
  }
}

main();
