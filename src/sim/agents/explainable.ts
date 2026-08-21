import { bestCombo, comboDescription, numbered } from "../../engine/combinations";
import { cardPoints } from "../../engine/score";
import type { Card, GameState, PlayerState } from "../../engine/types";
import type { AgentDecision, SimAgent } from "../agent";
import { formatCard, formatCards, formatCombo, visibleTableSummary } from "../cardFormat";
import { pickEchangeTarget, specialsOf, subsets } from "../bot-shared";
import {
  opponentsAlreadyPosed,
  playOrder,
  reserveValue,
  tablePressure,
} from "../strategic";

type ScoreBreakdown = {
  total: number;
  bullets: string[];
};

function flagsFor(cards: Card[], state: GameState) {
  const posedSpecials = cards.filter((c) => c.kind === "special");
  const { tuning } = state.rules;
  return {
    prisme:
      (tuning.globalPrisme && state.prisme) ||
      specialsOf(posedSpecials, "prisme").length > 0 ||
      (tuning.globalPrisme && specialsOf(state.commons, "prisme").length > 0),
    inversion:
      (tuning.globalInversion && state.inversion) ||
      specialsOf(posedSpecials, "inversion").length > 0 ||
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

function turnsRemainingEstimate(state: GameState): number {
  const row = state.rules.distribution.find((d) => d.players === state.players.length)!;
  return Math.max(1, state.deck.length / Math.max(row.commonsPerTurn * state.players.length, 1));
}

function scoreWithBreakdown(
  cards: Card[],
  state: GameState,
  player: PlayerState,
): ScoreBreakdown {
  const bullets: string[] = [];
  const order = playOrder(state);
  const seat = order.indexOf(player.id);
  const pressure = tablePressure(state, player.id);
  const horizon = turnsRemainingEstimate(state);
  const numsInHand = numbered(player.hand);
  const flags = flagsFor(cards, state);
  const combo = bestCombo(comboPool(cards, state), state.rules, flags);

  let total = combo ? combo.rank * 10 + combo.primary : 0;
  if (combo) bullets.push(`Combo visée avec les communes : ${comboDescription(combo)}.`);

  for (const c of cards.filter((x) => x.kind === "numbered")) {
    const reserve = reserveValue(c, numsInHand, state.rules);
    const cost = reserve * (horizon / 6) + cardPoints(c, state.rules) * 0.35;
    total -= cost;
    if (reserve >= 6) {
      bullets.push(
        `Coût long terme : garder ${formatCard(c, state.rules)} servait à une construction (réserve ${reserve.toFixed(0)}).`,
      );
    }
  }

  const hasBluff = specialsOf(cards, "bluff").length > 0;
  const numberedPlayed = cards.filter((c) => c.kind === "numbered").length;

  if (hasBluff && seat <= 1) {
    total += 35;
    bullets.push(
      numberedPlayed === 0
        ? "Bluff posé seul en early : badge ★ visible pour intimider les joueurs suivants (effet psychologique)."
        : "Bluff visible tôt : signaler une menace sans engager toute la main.",
    );
  }

  if (pressure > 0) {
    total -= pressure * 8 + numberedPlayed * pressure * 5;
    bullets.push(
      `Prudence : ${opponentsAlreadyPosed(state, player.id).length} joueur(s) ont déjà posé avec pression table=${pressure} (${visibleTableSummary(state, player.id)}).`,
    );
    if (specialsOf(cards, "gele").length) bullets.push("Gèle : protéger mes cartes si je perds ce pli.");
    if (numberedPlayed >= 2) bullets.push("Je limite ma mise : plusieurs cartes chères sous pression.");
  }

  if (specialsOf(cards, "gele").length && !pressure) {
    bullets.push("Gèle défensive : je ne suis pas confiant dans ma combo.");
  }

  if (specialsOf(cards, "prisme").length) bullets.push("Prisme : tenter de ne laisser compter que Couleur / Royal.");
  if (specialsOf(cards, "inversion").length) bullets.push("Inversion : valoriser mes cartes basses (1–4).");
  if (specialsOf(cards, "ajoute").length) bullets.push("Ajoute : enrichir les communes avant résolution.");
  if (specialsOf(cards, "echange").length) bullets.push("Échange : viser le joueur le plus dangereux à l'aveugle.");

  const maxCombo = bestCombo(
    [...numsInHand, ...state.commons],
    state.rules,
    { prisme: state.prisme, inversion: state.inversion },
  );
  if (combo && maxCombo && combo.rank < maxCombo.rank * 0.6 && horizon > 2) {
    total -= 25;
    bullets.push(
      "Temporisation : les communes ne servent pas mon projet ce tour — je n'investis pas toute ma main.",
    );
  }

  if (player.hand.length >= 4 && cards.length >= player.hand.length - 1) {
    total -= 40;
    bullets.push("Conservation : garder des cartes pour les prochains pots (communes futures).");
  }

  return { total, bullets };
}

function inferStrategy(bullets: string[], seat: number, pressure: number): string {
  if (bullets.some((b) => b.includes("Bluff"))) return "Intimidation / contrôle de la table";
  if (pressure > 0 && bullets.some((b) => b.includes("Prudence"))) return "Réaction prudente aux signaux adverses";
  if (bullets.some((b) => b.includes("Temporisation") || b.includes("Conservation"))) {
    return "Construction long terme — pot modeste ce tour";
  }
  if (bullets.some((b) => b.includes("Gèle"))) return "Défense — limiter la casse si je perds";
  if (seat <= 1) return "Prise d'initiative en début de séquence de pose";
  return "Optimisation du pli immédiat avec les communes";
}

function buildReasoning(
  player: PlayerState,
  cards: Card[],
  state: GameState,
  breakdown: ScoreBreakdown,
  strategy: string,
): string {
  const commons = formatCards(state.commons, state.rules);
  const hand = formatCards(player.hand, state.rules);
  const play = formatCards(cards, state.rules);
  const seat = playOrder(state).indexOf(player.id) + 1;

  return [
    `**${player.name}** (position de pose ${seat}/${state.players.length}).`,
    `Main : ${hand}.`,
    `Communes : ${commons}.`,
    `Table : ${visibleTableSummary(state, player.id)}.`,
    `Stratégie : ${strategy}.`,
    `Je pose : ${play}.`,
    ...breakdown.bullets.map((b) => `- ${b}`),
  ].join("\n");
}

function decideForPlayer(state: GameState, rng: () => number, jitter = 0): AgentDecision {
  const player = state.players.find((p) => p.id === state.activePlayerId)!;
  const candidates = subsets(player.hand, state.rules.playMin, state.rules.playMax);
  let best: Card[] = candidates[0] ?? [player.hand[0]];
  let bestBreakdown = scoreWithBreakdown(best, state, player);
  let bestScore = bestBreakdown.total;

  for (const candidate of candidates) {
    const breakdown = scoreWithBreakdown(candidate, state, player);
    let score = breakdown.total;
    if (jitter > 0) score += (rng() - 0.5) * jitter;
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
      bestBreakdown = breakdown;
    }
  }

  const pressure = tablePressure(state, player.id);
  const seat = playOrder(state).indexOf(player.id);
  const strategy = inferStrategy(bestBreakdown.bullets, seat, pressure);
  const hasEchange = specialsOf(best, "echange").length > 0;
  const target = hasEchange ? pickEchangeTarget(state, player.id, rng) : null;

  if (target !== null) {
    const targetName = state.players.find((p) => p.id === target)?.name ?? "?";
    bestBreakdown.bullets.push(`Cible d'échange : ${targetName}.`);
  }

  return {
    cardIds: best.map((c) => c.id),
    target,
    strategy,
    reasoning: buildReasoning(player, best, state, bestBreakdown, strategy),
    bullets: bestBreakdown.bullets,
  };
}

export function createStrategicAgent(id: string, displayName: string): SimAgent {
  return {
    id,
    displayName,
    kind: "strategic",
    decide: (state, rng) => decideForPlayer(state, rng, 0),
  };
}

export function createGreedyExplainAgent(id: string, displayName: string): SimAgent {
  return {
    id,
    displayName,
    kind: "greedy",
    decide: (state, rng) => {
      const player = state.players.find((p) => p.id === state.activePlayerId)!;
      const candidates = subsets(player.hand, state.rules.playMin, state.rules.playMax);
      let best: Card[] = candidates[0] ?? [player.hand[0]];
      let bestComboScore = -Infinity;

      for (const candidate of candidates) {
        const flags = flagsFor(candidate, state);
        const combo = bestCombo(comboPool(candidate, state), state.rules, flags);
        const score = combo ? combo.rank * 100 + combo.primary : 0;
        if (score > bestComboScore) {
          bestComboScore = score;
          best = candidate;
        }
      }

      const flags = flagsFor(best, state);
      const combo = bestCombo(comboPool(best, state), state.rules, flags);
      const hasEchange = specialsOf(best, "echange").length > 0;
      const target = hasEchange ? pickEchangeTarget(state, player.id, rng) : null;

      const bullets = [
        `Approche myope : maximiser la combo immédiate (${formatCombo(combo)}).`,
        "Je ne modélise pas le bluff social ni la construction sur plusieurs tours.",
      ];

      return {
        cardIds: best.map((c) => c.id),
        target,
        strategy: "Combo immédiate (greedy)",
        reasoning: [
          `**${player.name}** — agent greedy.`,
          `Communes : ${formatCards(state.commons, state.rules)}.`,
          `Je pose : ${formatCards(best, state.rules)} pour ${formatCombo(combo)}.`,
          ...bullets.map((b) => `- ${b}`),
        ].join("\n"),
        bullets,
      };
    },
  };
}

export const AGENT_FACTORIES: Record<string, (id: string, name: string) => SimAgent> = {
  strategic: createStrategicAgent,
  greedy: createGreedyExplainAgent,
};

export function createAgents(names: string[], agentKind: string): SimAgent[] {
  const factory = AGENT_FACTORIES[agentKind] ?? createStrategicAgent;
  return names.map((name, i) => factory(`p${i}`, name));
}

export function createMixedAgents(specs: string[], playerNames: string[]): SimAgent[] {
  return specs.map((spec, i) => {
    const factory = AGENT_FACTORIES[spec] ?? createStrategicAgent;
    return factory(`p${i}`, playerNames[i] ?? `Joueur ${i + 1}`);
  });
}

// re-export for trace resolution
export { comboDescription, formatCombo };
