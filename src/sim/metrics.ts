import { comboDescription } from "../engine/combinations";
import { finalScores } from "../engine/game";
import type { ComboKind, GameState, RulesConfig, SpecialKind } from "../engine/types";
import type { TrickSnapshot } from "./play";

export type GameReport = {
  seed: number;
  players: number;
  turns: number;
  winnerIds: number[];
  scores: ReturnType<typeof finalScores>["scores"];
  scoreSpread: number;
  tricks: TrickSnapshot[];
};

export type AggregateMetrics = {
  games: number;
  players: number;
  rulesLabel: string;
  avgTurns: number;
  avgScoreSpread: number;
  blowoutRate: number;
  closeGameRate: number;
  leaderMidGameWins: number;
  sharedWinRate: number;
  avgWinnerTricks: number;
  avgBluffPlayed: number;
  prismeTrickRate: number;
  inversionTrickRate: number;
  geleRecoverRate: number;
  comboKindWins: Partial<Record<ComboKind, number>>;
  specialInPlays: Partial<Record<SpecialKind, number>>;
  snowballRepeatRate: number;
  seatWinRate: number[];
  bonusHits: {
    mostTricks: number;
    bestHand: number;
    unbeatenLast3: number;
  };
};

export type DesignInsight = {
  severity: "info" | "warn" | "alert";
  topic: string;
  message: string;
};

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function aggregateReports(reports: GameReport[], rules: RulesConfig): AggregateMetrics {
  const totalsAll: number[] = [];
  const spreads = reports.map((r) => r.scoreSpread);
  for (const report of reports) {
    totalsAll.push(...report.scores.map((s) => s.total));
  }
  const avgTotal = mean(totalsAll);
  const closeThreshold = Math.max(8, avgTotal * 0.12);
  const blowoutThreshold = Math.max(20, avgTotal * 0.3);
  const blowouts = spreads.filter((s) => s >= blowoutThreshold).length;
  const close = spreads.filter((s) => s <= closeThreshold).length;
  const seatWins = Array.from({ length: reports[0]?.players ?? 0 }, () => 0);
  const comboWins: Partial<Record<ComboKind, number>> = {};
  const specialPlays: Partial<Record<SpecialKind, number>> = {};
  let leaderWins = 0;
  let shared = 0;
  let bluffPlayed = 0;
  let prismeTricks = 0;
  let inversionTricks = 0;
  let geleLogs = 0;
  let bonusMostGames = 0;
  let bonusHandGames = 0;
  let bonusLast3Games = 0;
  const repeatSameWinner: number[] = [];

  for (const report of reports) {
    if (report.winnerIds.length > 1) shared += 1;
    for (const id of report.winnerIds) seatWins[id] += 1 / report.winnerIds.length;

    const mid = Math.floor(report.tricks.length / 2);
    if (mid > 0) {
      const piles = report.tricks[mid - 1].pilePoints;
      const leader = piles.indexOf(Math.max(...piles));
      if (report.winnerIds.includes(leader)) leaderWins += 1;
    }

    for (const trick of report.tricks) {
      if (trick.prismeActive) prismeTricks += 1;
      if (trick.inversionActive) inversionTricks += 1;
      bluffPlayed += trick.bluffPlayed;
      for (const [kind, count] of Object.entries(trick.specialsPlayed) as [SpecialKind, number][]) {
        specialPlays[kind] = (specialPlays[kind] ?? 0) + count;
      }
      for (const winnerId of trick.winnerIds) {
        const combo = trick.combos[winnerId];
        if (combo) comboWins[combo.kind] = (comboWins[combo.kind] ?? 0) + 1;
      }
      if (trick.geleRecoveries) geleLogs += trick.geleRecoveries;
    }

    for (let i = 0; i < report.tricks.length - 1; i++) {
      const a = report.tricks[i].winnerIds[0];
      const b = report.tricks[i + 1].winnerIds[0];
      if (a === undefined || b === undefined) continue;
      repeatSameWinner.push(a === b ? 1 : 0);
    }

    bonusMostGames += report.scores.some((s) => s.bonusTricks > 0) ? 1 : 0;
    bonusHandGames += report.scores.some((s) => s.bonusHand > 0) ? 1 : 0;
    bonusLast3Games += report.scores.some((s) => s.bonusLast3 > 0) ? 1 : 0;
  }

  const trickCount = reports.reduce((s, r) => s + r.tricks.length, 0);
  const winnerTricks = reports.flatMap((r) =>
    r.scores.filter((s) => r.winnerIds.includes(s.playerId)).map((s) => s.tricks),
  );

  return {
    games: reports.length,
    players: reports[0]?.players ?? 0,
    rulesLabel: rules.variantLabel ?? `playMin=${rules.playMin} playMax=${rules.playMax}`,
    avgTurns: mean(reports.map((r) => r.turns)),
    avgScoreSpread: mean(spreads),
    blowoutRate: blowouts / Math.max(reports.length, 1),
    closeGameRate: close / Math.max(reports.length, 1),
    leaderMidGameWins: leaderWins / Math.max(reports.length, 1),
    sharedWinRate: shared / Math.max(reports.length, 1),
    avgWinnerTricks: mean(winnerTricks),
    avgBluffPlayed: bluffPlayed / Math.max(trickCount, 1),
    prismeTrickRate: prismeTricks / Math.max(trickCount, 1),
    inversionTrickRate: inversionTricks / Math.max(trickCount, 1),
    geleRecoverRate: geleLogs / Math.max(trickCount, 1),
    comboKindWins: comboWins,
    specialInPlays: specialPlays,
    snowballRepeatRate: mean(repeatSameWinner),
    seatWinRate: seatWins.map((w) => w / Math.max(reports.length, 1)),
    bonusHits: {
      mostTricks: bonusMostGames / Math.max(reports.length, 1),
      bestHand: bonusHandGames / Math.max(reports.length, 1),
      unbeatenLast3: bonusLast3Games / Math.max(reports.length, 1),
    },
  };
}

export function deriveInsights(metrics: AggregateMetrics, rules: RulesConfig): DesignInsight[] {
  const insights: DesignInsight[] = [];

  if (metrics.blowoutRate > 0.35) {
    insights.push({
      severity: "alert",
      topic: "Écart de score",
      message: `${(metrics.blowoutRate * 100).toFixed(0)} % des parties ont un écart large — le snowball ou les bonus de fin dominent probablement.`,
    });
  }

  if (metrics.closeGameRate < 0.15) {
    insights.push({
      severity: "warn",
      topic: "Suspense",
      message: `Seulement ${(metrics.closeGameRate * 100).toFixed(0)} % de parties serrées — la fin manque de tension.`,
    });
  }

  if (metrics.leaderMidGameWins > 0.65) {
    insights.push({
      severity: "alert",
      topic: "Comeback",
      message: `Le leader à mi-partie gagne ${(metrics.leaderMidGameWins * 100).toFixed(0)} % du temps — les rattrapages sont rares.`,
    });
  }

  const bluffRate = (metrics.specialInPlays.bluff ?? 0) / Math.max(metrics.games * metrics.avgTurns * metrics.players, 1);
  if (bluffRate > 0.08 && !rules.tuning.bluffJokerColor) {
    insights.push({
      severity: "warn",
      topic: "Bluff",
      message: `Bluff joué souvent (~${(metrics.avgBluffPlayed * 100).toFixed(0)} % des plis) sans effet mécanique — risque de frustration.`,
    });
  }

  if (metrics.avgBluffPlayed > 0.25 && rules.tuning.bluffJokerColor) {
    insights.push({
      severity: "info",
      topic: "Bluff joker",
      message: `Bluff actif sur ~${(metrics.avgBluffPlayed * 100).toFixed(0)} % des plis (joker couleur) — la carte redevient tactique.`,
    });
  }

  if (metrics.prismeTrickRate > 0.18) {
    insights.push({
      severity: "warn",
      topic: "Prisme",
      message: `Prisme actif sur ${(metrics.prismeTrickRate * 100).toFixed(0)} % des plis — la ladder de combos est souvent neutralisée.`,
    });
  }

  if (metrics.snowballRepeatRate > 0.28) {
    insights.push({
      severity: "warn",
      topic: "Enchaînement",
      message: `Même vainqueur sur ${(metrics.snowballRepeatRate * 100).toFixed(0)} % des plis consécutifs — la capture + pioche prioritaire favorise l'enchaînement.`,
    });
  }

  const highComboShare =
    ((metrics.comboKindWins.flush ?? 0) +
      (metrics.comboKindWins.rainbow ?? 0) +
      (metrics.comboKindWins.royal ?? 0) +
      (metrics.comboKindWins.prismale ?? 0)) /
    Math.max(
      Object.values(metrics.comboKindWins).reduce((a, b) => a + (b ?? 0), 0),
      1,
    );
  if (highComboShare < 0.05) {
    insights.push({
      severity: "info",
      topic: "Fantasy",
      message: `Couleur / Arc-en-ciel / Royal / Prismale ne gagnent que ~${(highComboShare * 100).toFixed(0)} % des plis — la ladder haute est théorique.`,
    });
  }

  if (metrics.bonusHits.mostTricks > 0.85) {
    insights.push({
      severity: "info",
      topic: "Bonus plis",
      message: `Le bonus « plus de plis » (+${rules.bonusMostTricks}) est attribué dans ~${(metrics.bonusHits.mostTricks * 100).toFixed(0)} % des parties — objectif secondaire prévisible.`,
    });
  }

  return insights;
}

export function formatAggregate(metrics: AggregateMetrics, insights: DesignInsight[]): string {
  const lines: string[] = [
    "=== Simulation PRISME ===",
    `Parties : ${metrics.games} · Joueurs : ${metrics.players}`,
    `Tours moyens : ${metrics.avgTurns.toFixed(1)} · Écart score moyen : ${metrics.avgScoreSpread.toFixed(1)}`,
    `Parties serrées : ${(metrics.closeGameRate * 100).toFixed(0)} % · Blowouts : ${(metrics.blowoutRate * 100).toFixed(0)} %`,
    `Leader mi-partie gagne : ${(metrics.leaderMidGameWins * 100).toFixed(0)} % · Victoires partagées : ${(metrics.sharedWinRate * 100).toFixed(0)} %`,
    `Prisme : ${(metrics.prismeTrickRate * 100).toFixed(0)} % plis · Inversion : ${(metrics.inversionTrickRate * 100).toFixed(0)} % · Gèle récup : ${(metrics.geleRecoverRate * 100).toFixed(0)} %`,
    `Bluff posé / pli : ${(metrics.avgBluffPlayed * 100).toFixed(0)} %`,
    `Taux victoire par siège : ${metrics.seatWinRate.map((r, i) => `J${i + 1} ${(r * 100).toFixed(0)}%`).join(" · ")}`,
    "",
    "Combos gagnantes (top) :",
  ];

  const comboEntries = Object.entries(metrics.comboKindWins).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  for (const [kind, count] of comboEntries.slice(0, 6)) {
    lines.push(`  · ${kind} : ${count}`);
  }

  lines.push("", "Spéciales jouées (total) :");
  for (const [kind, count] of Object.entries(metrics.specialInPlays).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))) {
    lines.push(`  · ${kind} : ${count}`);
  }

  lines.push("", "Bonus de fin (moy. joueurs touchés / partie) :");
  lines.push(
    `  · Plus de plis : ${metrics.bonusHits.mostTricks.toFixed(2)} · Meilleure main : ${metrics.bonusHits.bestHand.toFixed(2)} · 3 derniers plis : ${metrics.bonusHits.unbeatenLast3.toFixed(2)}`,
  );

  if (insights.length) {
    lines.push("", "Pistes (auto) :");
    for (const insight of insights) {
      const tag = insight.severity === "alert" ? "!!" : insight.severity === "warn" ? "!" : "·";
      lines.push(`  ${tag} [${insight.topic}] ${insight.message}`);
    }
  }

  return lines.join("\n");
}

export function formatGameReport(report: GameReport, _rules: RulesConfig, verbose: boolean): string {
  const lines = [
    `--- Partie seed=${report.seed} · ${report.players}j · ${report.turns} tours · écart ${report.scoreSpread} ---`,
    `Vainqueur(s) : ${report.winnerIds.map((id) => report.scores.find((s) => s.playerId === id)?.name).join(", ")}`,
  ];

  for (const s of report.scores) {
    lines.push(
      `  ${s.name} : ${s.total} pts (pile ${s.pile} + bonus ${s.bonusTricks + s.bonusHand + s.bonusLast3}) · ${s.tricks} plis`,
    );
  }

  if (verbose) {
    lines.push("", "Plis :");
    for (const trick of report.tricks) {
      const winner = trick.winnerIds.map((id) => report.scores.find((s) => s.playerId === id)?.name).join("/");
      const combos = Object.entries(trick.combos)
        .map(([id, combo]) => `${report.scores.find((s) => s.playerId === Number(id))?.name}=${comboDescription(combo)}`)
        .join(" | ");
      lines.push(
        `  T${trick.turn} → ${winner} · ${combos}${trick.prismeActive ? " · PRISME" : ""}${trick.inversionActive ? " · INV" : ""}`,
      );
    }
  }

  return lines.join("\n");
}

export function buildGameReport(state: GameState, seed: number, tricks: TrickSnapshot[]): GameReport {
  const { scores, winners } = finalScores(state);
  const totals = scores.map((s) => s.total);
  return {
    seed,
    players: state.players.length,
    turns: state.turn,
    winnerIds: winners,
    scores,
    scoreSpread: Math.max(...totals) - Math.min(...totals),
    tricks,
  };
}
