import type { Card, RulesConfig } from "./types";

export function cardPoints(card: Card, rules: RulesConfig): number {
  if (card.kind === "special") return rules.specialPoints[card.special];
  for (const tier of rules.numberedTiers) {
    if (card.value >= tier.min && card.value <= tier.max) return tier.points;
  }
  return 0;
}

export function pilePoints(cards: Card[], rules: RulesConfig): number {
  return cards.reduce((s, c) => s + cardPoints(c, rules), 0);
}
