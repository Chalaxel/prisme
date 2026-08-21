import { describe, expect, it } from "vitest";
import { initialState, reduce } from "../engine/game";
import { defaultRules } from "../rules/defaultRules";
import { greedyBot } from "./bot-shared";
import { playOrder, scoreStrategicPlay, tablePressure } from "./strategic";
import { mulberry32 } from "./rng";
import { autoStep } from "./play";

describe("strategic bot", () => {
  it("valorise le bluff en position early (livret)", () => {
    let state = reduce(initialState, {
      type: "start",
      names: ["A", "B", "C", "D"],
      rules: defaultRules,
      rng: mulberry32(1),
    });
    while (state.phase !== "play" || state.activePlayerId !== state.dealerId) {
      const { state: next } = autoStep(state, greedyBot, mulberry32(1));
      state = next;
      if (state.phase === "gameOver") break;
    }
    if (state.phase !== "play") return;

    const player = state.players.find((p) => p.id === state.activePlayerId)!;
    const bluff = player.hand.find((c) => c.kind === "special" && c.special === "bluff");
    if (!bluff) return;

    const bluffOnly = scoreStrategicPlay([bluff], state, player);
    const numbered = player.hand.find((c) => c.kind === "numbered");
    if (!numbered) return;
    const numberedOnly = scoreStrategicPlay([numbered], state, player);

    expect(bluffOnly).toBeGreaterThan(numberedOnly);
  });

  it("pénalise les grosses poses quand des spéciales adverses sont visibles", () => {
    const base = reduce(initialState, {
      type: "start",
      names: ["A", "B", "C", "D"],
      rules: defaultRules,
      rng: () => 0.5,
    });
    const hand = [
      { id: "n2", kind: "numbered" as const, color: "vert", value: 12 },
      { id: "n3", kind: "numbered" as const, color: "rouge", value: 11 },
      { id: "n4", kind: "numbered" as const, color: "bleuNuit", value: 10 },
    ];
    const player = {
      id: 2,
      name: "C",
      hand,
      posed: [] as typeof hand,
      exchangeTarget: null,
      pointsPile: [],
      tricksWon: 0,
      lastTricks: [],
    };

    const pressured = {
      ...base,
      phase: "play" as const,
      activePlayerId: 2,
      dealerId: 0,
      commons: [
        { id: "c1", kind: "numbered" as const, color: "sarcelle", value: 2 },
        { id: "c2", kind: "numbered" as const, color: "or", value: 4 },
      ],
      players: base.players.map((p) =>
        p.id === 0
          ? {
              ...p,
              posed: [{ id: "s-bluff", kind: "special" as const, special: "bluff" as const, color: "orange" as const }],
            }
          : p.id === 2
            ? player
            : { ...p, posed: [] },
      ),
    };

    const calm = {
      ...pressured,
      players: pressured.players.map((p) => ({ ...p, posed: p.id === 2 ? [] : [] })),
    };

    const play = [hand[0], hand[1], hand[2]];
    const underPressure = scoreStrategicPlay(play, pressured, player);
    const noPressure = scoreStrategicPlay(play, calm, player);

    expect(tablePressure(pressured, 2)).toBeGreaterThan(0);
    expect(underPressure).toBeLessThan(noPressure);
  });

  it("playOrder suit le distributeur", () => {
    const state = reduce(initialState, {
      type: "start",
      names: ["A", "B", "C"],
      rules: defaultRules,
      rng: () => 0,
    });
    expect(playOrder({ ...state, dealerId: 1 }).join(",")).toBe("1,2,0");
  });
});
