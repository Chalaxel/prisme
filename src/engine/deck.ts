import type { Card, ColorId, RulesConfig, SpecialKind } from "./types";

export function buildDeck(rules: RulesConfig): Card[] {
  const cards: Card[] = [];
  for (const color of rules.colors) {
    for (let value = rules.minValue; value <= rules.maxValue; value++) {
      for (let copy = 0; copy < rules.copiesPerNumbered; copy++) {
        cards.push({
          id: `n-${color.id}-${value}-${copy}`,
          kind: "numbered",
          color: color.id,
          value,
        });
      }
    }
  }
  (Object.keys(rules.specialCopies) as SpecialKind[]).forEach((special) => {
    const color: ColorId = rules.specialColor[special];
    const n = rules.specialCopies[special];
    for (let i = 0; i < n; i++) {
      cards.push({
        id: `s-${special}-${i}`,
        kind: "special",
        special,
        color,
      });
    }
  });
  return cards;
}

export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function draw(deck: Card[], n: number): { taken: Card[]; rest: Card[] } {
  return { taken: deck.slice(0, n), rest: deck.slice(n) };
}
