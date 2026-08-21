import { describe, expect, it } from "vitest";
import { iter5LightCapture } from "../rules/iterations";
import { runAsyncTracedGame } from "./asyncTracedGame";
import { createLlmAgents } from "./agents/llmAgent";
import { resolveLlmConfig } from "./agents/llmClient";
import { formatLlmTracedGameMarkdown } from "./llmTraceMarkdown";
import { projectObservation } from "./observe";
import { initialState, reduce } from "../engine/game";
import { mulberry32 } from "./rng";
import { cloneRules } from "../rules/defaultRules";
import { validateDecision } from "./agents/validateDecision";

describe("simulateur IA", () => {
  it("projette une observation partielle sans mains adverses", () => {
    const rng = mulberry32(1);
    let state = reduce(initialState, {
      type: "start",
      rules: cloneRules(iter5LightCapture),
      names: ["A", "B", "C", "D"],
      rng,
    });
    state = reduce(state, { type: "confirmCurtain" });
    const obs = projectObservation(state, state.activePlayerId);
    expect(obs.hand.length).toBeGreaterThan(0);
    expect(obs.legalCardIds.length).toBe(obs.hand.length);
    expect(obs.seatInOrder).toBeGreaterThanOrEqual(1);
  });

  it("termine une partie en mode mock LLM", async () => {
    const config = resolveLlmConfig({ PRISME_LLM_PROVIDER: "mock" } as NodeJS.ProcessEnv);
    const agents = await createLlmAgents(
      [
        { name: "Alpha", personalityId: "tactician" },
        { name: "Beta", personalityId: "intimidator" },
        { name: "Gamma", personalityId: "architect" },
        { name: "Delta", personalityId: "grinder" },
      ],
      config,
      { reflectAfterTrick: false },
    );

    const game = await runAsyncTracedGame({
      seed: 42,
      rules: iter5LightCapture,
      agents,
      llmProvider: "mock",
      llmModel: "mock",
    });

    expect(game.turns.length).toBeGreaterThan(3);
    expect(game.stats.llmCalls).toBeGreaterThan(0);
    for (const turn of game.turns) {
      for (const play of turn.plays) {
        expect(play.decision.reasoning.length).toBeGreaterThan(5);
        expect(play.decision.opponentRead).toBeDefined();
      }
    }

    const md = formatLlmTracedGameMarkdown(game);
    expect(md).toContain("agents IA");
    expect(md).toContain("Lecture adverse");
  }, 60_000);

  it("valide les décisions LLM et rejette les ids invalides", () => {
    const rng = mulberry32(3);
    let state = reduce(initialState, {
      type: "start",
      rules: cloneRules(iter5LightCapture),
      names: ["A", "B"],
      rng,
    });
    state = reduce(state, { type: "confirmCurtain" });

    const bad = validateDecision(state, {
      cardIds: ["invalid-id"],
      target: null,
      strategy: "x",
      reasoning: "y",
      bullets: [],
    });
    expect(bad.ok).toBe(false);
  });
});
