import { describe, expect, it } from "vitest";
import { iter5LightCapture } from "../rules/iterations";
import { createMixedAgents } from "./agents/explainable";
import { formatTracedGameMarkdown } from "./traceMarkdown";
import { runTracedGame } from "./tracedGame";

describe("simulation tracée avec agents explicables", () => {
  it("termine une partie 4 joueurs avec traces par tour", () => {
    const agents = createMixedAgents(
      ["strategic", "greedy", "strategic", "greedy"],
      ["Alpha", "Beta", "Gamma", "Delta"],
    );
    const game = runTracedGame({ seed: 77, rules: iter5LightCapture, agents });

    expect(game.turns.length).toBeGreaterThan(3);
    expect(game.report.scores).toHaveLength(4);
    for (const turn of game.turns) {
      expect(turn.plays).toHaveLength(4);
      for (const play of turn.plays) {
        expect(play.decision.strategy.length).toBeGreaterThan(0);
        expect(play.decision.reasoning.length).toBeGreaterThan(20);
        expect(play.decision.bullets.length).toBeGreaterThan(0);
      }
      expect(turn.winnerName.length).toBeGreaterThan(0);
    }
  });

  it("exporte un markdown lisible avec commentaires", () => {
    const agents = createMixedAgents(["strategic", "strategic"], ["A", "B"]);
    const game = runTracedGame({ seed: 5, agents });
    const md = formatTracedGameMarkdown(game);

    expect(md).toContain("# Simulation PRISME");
    expect(md).toContain("Commentaire de l'agent");
    expect(md).toContain("Stratégie");
    expect(md).toContain("Bilan final");
  });
});
