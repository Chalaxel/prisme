import { comboDescription } from "../engine/combinations";
import type { Card, Combo, GameState, RulesConfig } from "../engine/types";

export function colorName(rules: RulesConfig, colorId: string): string {
  return rules.colors.find((c) => c.id === colorId)?.name ?? colorId;
}

export function formatCard(card: Card, rules: RulesConfig): string {
  if (card.kind === "numbered") {
    return `${card.value} ${colorName(rules, card.color)}`;
  }
  return `${rules.specialLabels[card.special]} (${colorName(rules, card.color)})`;
}

export function formatCards(cards: Card[], rules: RulesConfig): string {
  if (!cards.length) return "—";
  return cards.map((c) => formatCard(c, rules)).join(", ");
}

export function formatCombo(combo: Combo | null): string {
  return comboDescription(combo);
}

export function formatHandBrief(state: GameState, playerId: number): string {
  const p = state.players.find((x) => x.id === playerId);
  if (!p) return "—";
  return formatCards(p.hand, state.rules);
}

export function visibleTableSummary(state: GameState, activeId: number): string {
  const order = Array.from({ length: state.players.length }, (_, i) => (state.dealerId + i) % state.players.length);
  const idx = order.indexOf(activeId);
  const lines: string[] = [];
  for (let i = 0; i < idx; i++) {
    const pid = order[i];
    const pl = state.players.find((p) => p.id === pid)!;
    const specials = pl.posed.filter((c) => c.kind === "special").length;
    const hidden = pl.posed.filter((c) => c.kind === "numbered").length;
    lines.push(
      `${pl.name} : ${pl.posed.length} carte(s) posée(s) (${hidden} cachée(s)${specials ? `, ${specials} spéciale(s) visible(s) ★` : ""})`,
    );
  }
  return lines.length ? lines.join(" · ") : "Personne n'a encore posé.";
}
