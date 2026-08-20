import { bestCombo, compareCombos, numbered } from "../engine/combinations";
import { cardPoints } from "../engine/score";
import type { Card, GameState, NumberedCard, PlayerState, RulesConfig } from "../engine/types";
import type { Bot, BotChoice } from "./bot-shared";
import { pickEchangeTarget, specialsOf, subsets } from "./bot-shared";

/** Ordre de pose ce tour (depuis le distributeur). */
export function playOrder(state: GameState): number[] {
  const n = state.players.length;
  return Array.from({ length: n }, (_, i) => (state.dealerId + i) % n);
}

/** Joueurs ayant déjà posé avant `activeId` — leurs piles sont visibles (dont badge spéciale). */
export function opponentsAlreadyPosed(state: GameState, activeId: number): PlayerState[] {
  const order = playOrder(state);
  const idx = order.indexOf(activeId);
  if (idx <= 0) return [];
  return order.slice(0, idx).map((id) => state.players.find((p) => p.id === id)!);
}

/** Pression perçue : spéciales visibles sur les piles déjà posées. */
export function tablePressure(state: GameState, activeId: number): number {
  return opponentsAlreadyPosed(state, activeId).reduce((sum, p) => {
    const specials = p.posed.filter((c) => c.kind === "special").length;
    const stack = p.posed.length;
    return sum + specials * 3 + (stack > 0 ? 1 : 0);
  }, 0);
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
  const pool = [...cards.filter((c) => c.kind === "numbered"), ...state.commons];
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

/** Valeur de « garder cette carte » pour construire la main sur les prochains tours. */
export function reserveValue(card: NumberedCard, hand: NumberedCard[], rules: RulesConfig): number {
  const sameColor = hand.filter((c) => c.color === card.color && c.id !== card.id).length;
  const neighbors = hand.filter(
    (c) => c.id !== card.id && Math.abs(c.value - card.value) <= 2,
  ).length;
  const prismalePiece = [1, 6, 13].includes(card.value)
    ? hand.filter((c) => c.color === card.color && [1, 6, 13].includes(c.value) && c.id !== card.id).length
    : 0;

  let v = sameColor * 4 + neighbors * 2 + prismalePiece * 5;
  v += cardPoints(card, rules) * 0.4;
  return v;
}

function turnsRemainingEstimate(state: GameState): number {
  const row = state.rules.distribution.find((d) => d.players === state.players.length)!;
  const cardsLeft = state.deck.length;
  return Math.max(1, cardsLeft / Math.max(row.commonsPerTurn * state.players.length, 1));
}

function immediatePlayScore(cards: Card[], state: GameState, _player: PlayerState): number {
  const flags = flagsFor(cards, state);
  const combo = bestCombo(comboPool(cards, state), state.rules, flags);
  let score = comboStrength(combo, state.rules, flags.inversion);

  const numbered = cards.filter((c) => c.kind === "numbered");
  for (const c of numbered) {
    score -= cardPoints(c, state.rules) * 0.35;
  }

  if (specialsOf(cards, "gele").length && score < 2800) score += 160;
  if (specialsOf(cards, "ajoute").length) score += 70;
  if (specialsOf(cards, "prisme").length && numbered.length >= 2) score += 50;
  if (specialsOf(cards, "inversion").length && numbered.some((c) => c.value <= 4)) score += 60;

  return score;
}

/**
 * Score une pose en combinant :
 * - combo immédiat avec les communes
 * - coût long terme (casser une construction en main)
 * - bluff intimidant (poser tôt une spéciale visible)
 * - prudence si des spéciales adverses sont déjà visibles
 */
export function scoreStrategicPlay(
  cards: Card[],
  state: GameState,
  player: PlayerState,
): number {
  const order = playOrder(state);
  const seat = order.indexOf(player.id);
  const pressure = tablePressure(state, player.id);
  const horizon = turnsRemainingEstimate(state);
  const numsInHand = numbered(player.hand);

  let score = immediatePlayScore(cards, state, player);

  for (const c of cards) {
    if (c.kind !== "numbered") continue;
    score -= reserveValue(c, numsInHand, state.rules) * (horizon / 6);
  }

  const hasBluff = specialsOf(cards, "bluff").length > 0;
  const numberedPlayed = cards.filter((c) => c.kind === "numbered").length;

  if (hasBluff && seat <= 1) {
    score += 220;
    if (numberedPlayed === 0) score += 180;
    if (numberedPlayed <= 1) score += 90;
  }

  if (pressure > 0) {
    score -= pressure * 55;
    score -= numberedPlayed * pressure * 35;
    for (const c of cards) {
      if (c.kind === "numbered") score -= cardPoints(c, state.rules) * pressure * 0.35;
    }
    if (specialsOf(cards, "gele").length) score += pressure * 40;
    if (numberedPlayed >= 2) score -= 400 + pressure * 80;
  }

  const thisCombo = comboStrength(
    bestCombo(comboPool(cards, state), state.rules, flagsFor(cards, state)),
    state.rules,
    flagsFor(cards, state).inversion,
  );
  const maxCombo = comboStrength(
    bestCombo(
      [...numsInHand, ...state.commons],
      state.rules,
      { prisme: state.prisme, inversion: state.inversion },
    ),
    state.rules,
    state.inversion,
  );

  if (thisCombo < maxCombo * 0.55 && horizon > 2) {
    score -= 120;
    for (const c of cards) {
      if (c.kind === "numbered" && cardPoints(c, state.rules) >= 2) score -= 40;
    }
  }

  if (player.hand.length >= 4 && cards.length >= player.hand.length - 1) {
    score -= 250;
  }

  return score;
}

function strategicChoice(state: GameState, rng: () => number, jitter: number): BotChoice {
  const player = state.players.find((p) => p.id === state.activePlayerId)!;
  const candidates = subsets(player.hand, state.rules.playMin, state.rules.playMax);
  let best: Card[] = candidates[0] ?? [player.hand[0]];
  let bestScore = -Infinity;

  for (const candidate of candidates) {
    let score = scoreStrategicPlay(candidate, state, player);
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

export const strategicBot: Bot = {
  name: "strategic",
  choosePlay: (state, rng) => strategicChoice(state, rng, 0),
};

export const strategicNoisyBot: Bot = {
  name: "strategic-noisy",
  choosePlay: (state, rng) => strategicChoice(state, rng, 400),
};
