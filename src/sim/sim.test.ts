import { describe, expect, it } from "vitest";
import { defaultRules } from "../rules/defaultRules";
import { greedyBot, randomBot } from "./bot";
import { aggregateReports, deriveInsights } from "./metrics";
import { runBatch, runSimulation } from "./play";

describe("simulation", () => {
  it("termine une partie 2 joueurs", () => {
    const report = runSimulation({ playerCount: 2, seed: 1, bot: greedyBot });
    expect(report.turns).toBeGreaterThan(0);
    expect(report.scores).toHaveLength(2);
    expect(report.tricks.length).toBeGreaterThan(0);
  });

  it("termine un lot de parties sans bloquer", () => {
    const reports = runBatch(12, 4, 100, randomBot);
    expect(reports).toHaveLength(12);
    const metrics = aggregateReports(reports, defaultRules);
    expect(metrics.avgTurns).toBeGreaterThan(3);
    const insights = deriveInsights(metrics, defaultRules);
    expect(Array.isArray(insights)).toBe(true);
  });
});
