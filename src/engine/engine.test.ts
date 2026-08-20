import { describe, expect, it } from "vitest";
import { bestCombo, classifySet, compareCombos } from "./combinations";
import { buildDeck } from "./deck";
import { defaultRules } from "../rules/defaultRules";
import { initialState, reduce } from "./game";
import { cardPoints, pilePoints } from "./score";
import type { Card, NumberedCard } from "./types";

function N(color: NumberedCard["color"], value: number, id = `${color}-${value}`): NumberedCard {
  return { id, kind: "numbered", color, value };
}

function S(
  special: "bluff" | "prisme" | "inversion" | "gele" | "ajoute" | "echange",
  color: NumberedCard["color"],
  id?: string,
): Card {
  return { id: id ?? special, kind: "special", special, color };
}

describe("deck", () => {
  it("builds 100 cards with default rules", () => {
    expect(buildDeck(defaultRules)).toHaveLength(100);
  });
});

describe("combinations", () => {
  it("ranks a pair above a high card", () => {
    const pair = classifySet([N("or", 7, "a"), N("vert", 7, "b")], defaultRules)!;
    const high = classifySet([N("or", 13, "c")], defaultRules)!;
    expect(compareCombos(pair, high, false, defaultRules)).toBeGreaterThan(0);
  });

  it("detects Prismale", () => {
    const p = classifySet([N("vert", 1, "a"), N("vert", 6, "b"), N("vert", 13, "c")], defaultRules)!;
    expect(p.kind).toBe("prismale");
  });

  it("Prismale beats couleur royale", () => {
    const prismale = classifySet(
      [N("vert", 1, "a"), N("vert", 6, "b"), N("vert", 13, "c")],
      defaultRules,
    )!;
    const royal = classifySet(
      [
        N("or", 3, "1"),
        N("sarcelle", 4, "2"),
        N("bleuNuit", 5, "3"),
        N("vert", 6, "4"),
        N("rouge", 7, "5"),
        N("orange", 8, "6"),
      ],
      defaultRules,
    )!;
    expect(royal.kind).toBe("royal");
    expect(compareCombos(prismale, royal, false, defaultRules)).toBeGreaterThan(0);
  });

  it("counts a common special toward a flush", () => {
    const combo = bestCombo(
      [N("vert", 2, "a"), N("vert", 4, "b"), N("vert", 9, "c"), N("vert", 11, "d"), S("ajoute", "vert", "e")],
      defaultRules,
      { prisme: false, inversion: false },
    );
    expect(combo?.kind).toBe("flush");
  });

  it("under Prisme, ignores pairs", () => {
    const combo = bestCombo(
      [N("or", 8, "a"), N("vert", 8, "b"), N("rouge", 3, "c")],
      defaultRules,
      { prisme: true, inversion: false },
    );
    expect(combo?.kind).toBe("high");
  });

  it("under Inversion, 1 beats 13 as high card", () => {
    const one = classifySet([N("or", 1)], defaultRules)!;
    const king = classifySet([N("vert", 13)], defaultRules)!;
    expect(compareCombos(one, king, true, defaultRules)).toBeGreaterThan(0);
  });
});

describe("score", () => {
  it("uses numbered and special tiers", () => {
    expect(cardPoints(N("or", 4), defaultRules)).toBe(1);
    expect(cardPoints(N("or", 10), defaultRules)).toBe(2);
    expect(cardPoints(N("or", 13), defaultRules)).toBe(3);
    expect(cardPoints(S("bluff", "orange"), defaultRules)).toBe(1);
    expect(cardPoints(S("prisme", "sarcelle"), defaultRules)).toBe(3);
    expect(pilePoints([N("or", 13), S("bluff", "orange")], defaultRules)).toBe(4);
  });
});

describe("game loop", () => {
  it("deals according to the 2-player table and completes a trick", () => {
    let s = reduce(initialState, {
      type: "start",
      names: ["A", "B"],
      rules: defaultRules,
      rng: () => 0.1,
    });
    expect(s.players).toHaveLength(2);
    expect(s.players[0].hand.length).toBe(6);
    expect(s.commons.length).toBeGreaterThanOrEqual(4);
    expect(s.phase).toBe("curtain");

    const playOne = (state: typeof s) => {
      let next = reduce(state, { type: "confirmCurtain" });
      const current = next.players.find((p) => p.id === next.activePlayerId)!;
      const card =
        current.hand.find((c) => !(c.kind === "special" && c.special === "echange")) ?? current.hand[0];
      next = reduce(next, { type: "toggleCard", cardId: card.id });
      if (card.kind === "special" && card.special === "echange") {
        const other = next.players.find((p) => p.id !== current.id)!;
        next = reduce(next, { type: "setTarget", playerId: other.id });
      }
      return reduce(next, { type: "confirmPlay" });
    };

    s = playOne(s);
    expect(s.phase).toBe("curtain");
    s = playOne(s);
    expect(s.phase).toBe("reveal");

    s = reduce(s, { type: "acknowledgeReveal" });
    expect(["resolved", "gameOver"]).toContain(s.phase);
    expect(s.players.some((p) => p.tricksWon === 1)).toBe(true);
  });
});
