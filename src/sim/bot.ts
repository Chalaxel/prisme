import { bestCombo, compareCombos } from "../engine/combinations";
import { cardPoints } from "../engine/score";
import type { Card, GameState, PlayerState, RulesConfig, SpecialCard } from "../engine/types";
import { pickInt } from "./rng";

export type BotChoice = {
  cardIds: string[];
  target: number | null;
};

export type Bot = {
  name: string;
  choosePlay: (state: GameState, rng: () => number) => BotChoice;
};

function specialsOf(cards: Card[], kind: SpecialCard["special"]): SpecialCard[] {
  return cards.filter((c): c is SpecialCard => c.kind === "special" && c.special === kind);
}

function subsets(cards: Card[], min: number, max: number): Card[][] {
  const out: Card[][] = [];
  const n = cards.length;
  const limit = 1 << n;
  for (let mask = 1; mask < limit; mask++) {
    const subset: Card[] = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) subset.push(cards[i]);
    }
    if (subset.length >= min && subset.length <= max) out.push(subset);
  }
  return out;
}

function flagsFor(cards: Card[], state: GameState) {
  const posedSpecials = cards.filter((c) => c.kind === "special");
  const { tuning } = state.rules;
  const playedPrisme = specialsOf(posedSpecials, "prisme").length > 0;
  const playedInversion = specialsOf(posedSpecials, "inversion").length > 0;
  return {
    prisme:
      (tuning.globalPrisme && state.prisme) ||
      playedPrisme ||
      (tuning.globalPrisme && specialsOf(state.commons, "prisme").length > 0),
    inversion:
      (tuning.globalInversion && state.inversion) ||
      playedInversion ||
      (tuning.globalInversion && specialsOf(state.commons, "inversion").length > 0),
  };
}

function comboPool(cards: Card[], state: GameState): Card[] {
  const numbered = cards.filter((c) => c.kind === "numbered");
  const pool = [...numbered, ...state.commons];
  if (state.rules.tuning.bluffJokerColor) {
    pool.push(...cards.filter((c) => c.kind === "special" && c.special === "bluff"));
  }
  return pool;
}

function comboStrength(
  combo: ReturnType<typeof bestCombo>,
  rules: RulesConfig,
  inverted: boolean,
): number {
  if (!combo) return 0;
  const baseline = bestCombo([], rules, { prisme: false, inversion: inverted });
  if (!baseline) return combo.rank * 1000 + combo.primary;
  return compareCombos(combo, baseline, inverted, rules) + combo.rank * 1000;
}

function scorePlay(cards: Card[], state: GameState, player: PlayerState): number {
  const flags = flagsFor(cards, state);
  const numbered = cards.filter((c) => c.kind === "numbered");
  const combo = bestCombo(comboPool(cards, state), state.rules, flags);
  let score = comboStrength(combo, state.rules, flags.inversion);

  for (const c of numbered) {
    score -= cardPoints(c, state.rules) * 0.55;
  }

  if (specialsOf(cards, "gele").length && score < 2500) score += 180;
  if (specialsOf(cards, "bluff").length) {
    score += state.rules.tuning.bluffJokerColor ? 80 : -120;
  }
  if (specialsOf(cards, "ajoute").length) score += 90;
  if (specialsOf(cards, "prisme").length && numbered.length >= 3) score += 60;
  if (specialsOf(cards, "inversion").length && numbered.some((c) => c.value <= 4)) score += 70;

  const handValue = player.hand.reduce((s, c) => s + cardPoints(c, state.rules), 0);
  if (handValue >= 12 && cards.length >= player.hand.length - 1) score -= 200;

  return score;
}

function pickEchangeTarget(state: GameState, playerId: number, rng: () => number): number {
  const opponents = state.players.filter((p) => p.id !== playerId);
  if (!opponents.length) return 0;
  const byPile = [...opponents].sort(
    (a, b) =>
      b.pointsPile.reduce((s, c) => s + cardPoints(c, state.rules), 0) -
      a.pointsPile.reduce((s, c) => s + cardPoints(c, state.rules), 0),
  );
  if (rng() < 0.75) return byPile[0].id;
  return opponents[pickInt(rng, opponents.length)].id;
}

function greedyChoice(state: GameState, rng: () => number, jitter: number): BotChoice {
  const player = state.players.find((p) => p.id === state.activePlayerId)!;
  const candidates = subsets(player.hand, state.rules.playMin, state.rules.playMax);
  let best: Card[] = candidates[0] ?? [player.hand[0]];
  let bestScore = -Infinity;

  for (const candidate of candidates) {
    let score = scorePlay(candidate, state, player);
    if (jitter > 0) score += (rng() - 0.5) * jitter;
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  const hasEchange = specialsOf(best, "echange").length > 0;
  return {
    cardIds: best.map((c) => c.id),
    target: hasEchange ? pickEchangeTarget(state, player.id, rng) : null,
  };
}

export const greedyBot: Bot = {
  name: "greedy",
  choosePlay: (state, rng) => greedyChoice(state, rng, 0),
};

export const noisyBot: Bot = {
  name: "noisy",
  choosePlay: (state, rng) => greedyChoice(state, rng, 900),
};

export const randomBot: Bot = {
  name: "random",
  choosePlay: (state, rng) => {
    const player = state.players.find((p) => p.id === state.activePlayerId)!;
    const size = pickInt(rng, state.rules.playMax - state.rules.playMin + 1) + state.rules.playMin;
    const shuffled = [...player.hand].sort(() => rng() - 0.5);
    const cards = shuffled.slice(0, Math.min(size, shuffled.length));
    const hasEchange = specialsOf(cards, "echange").length > 0;
    return {
      cardIds: cards.map((c) => c.id),
      target: hasEchange ? pickEchangeTarget(state, player.id, rng) : null,
    };
  },
};

export const BOTS: Record<string, Bot> = {
  greedy: greedyBot,
  noisy: noisyBot,
  random: randomBot,
};
