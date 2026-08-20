import { initialState, reduce } from "../engine/game";
import { pilePoints } from "../engine/score";
import { cloneRules, defaultRules } from "../rules/defaultRules";
import type { Card, Combo, GameState, RulesConfig, SpecialKind } from "../engine/types";
import type { Bot } from "./bot";
import { buildGameReport, type GameReport } from "./metrics";
import { mulberry32 } from "./rng";

export type TrickSnapshot = {
  turn: number;
  winnerIds: number[];
  combos: Record<number, Combo | null>;
  pilePoints: number[];
  prismeActive: boolean;
  inversionActive: boolean;
  bluffPlayed: number;
  specialsPlayed: Partial<Record<SpecialKind, number>>;
  geleRecoveries: number;
};

export type SimOptions = {
  playerCount: number;
  seed: number;
  bot: Bot;
  rules?: RulesConfig;
  maxSteps?: number;
};

function countSpecials(cards: Card[]): Partial<Record<SpecialKind, number>> {
  const out: Partial<Record<SpecialKind, number>> = {};
  for (const c of cards) {
    if (c.kind !== "special") continue;
    out[c.special] = (out[c.special] ?? 0) + 1;
  }
  return out;
}

function snapshotPreResolve(state: GameState): Pick<TrickSnapshot, "bluffPlayed" | "specialsPlayed"> {
  const posed = state.players.flatMap((p) => p.posed);
  const specials = countSpecials(posed);
  return {
    bluffPlayed: specials.bluff ?? 0,
    specialsPlayed: specials,
  };
}

function snapshotPostResolve(
  state: GameState,
  pre: Pick<TrickSnapshot, "bluffPlayed" | "specialsPlayed">,
): TrickSnapshot {
  const geleRecoveries = state.log.slice(-8).filter((line) => line.startsWith("Gèle :")).length;
  return {
    turn: state.turn,
    winnerIds: [...state.lastWinnerIds],
    combos: { ...state.lastCombos },
    pilePoints: state.players.map((p) => pilePoints(p.pointsPile, state.rules)),
    prismeActive: state.prisme,
    inversionActive: state.inversion,
    bluffPlayed: pre.bluffPlayed,
    specialsPlayed: pre.specialsPlayed,
    geleRecoveries,
  };
}

function applyPlay(state: GameState, choice: ReturnType<Bot["choosePlay"]>): GameState {
  let next = state;
  for (const cardId of choice.cardIds) {
    next = reduce(next, { type: "toggleCard", cardId });
  }
  if (choice.target !== null) {
    next = reduce(next, { type: "setTarget", playerId: choice.target });
  }
  return reduce(next, { type: "confirmPlay" });
}

export function autoStep(
  state: GameState,
  bot: Bot,
  rng: () => number,
): { state: GameState; trick?: TrickSnapshot } {
  switch (state.phase) {
    case "curtain":
      return { state: reduce(state, { type: "confirmCurtain" }) };
    case "play":
      return { state: applyPlay(state, bot.choosePlay(state, rng)) };
    case "reveal": {
      const pre = snapshotPreResolve(state);
      const resolved = reduce(state, { type: "acknowledgeReveal" });
      return { state: resolved, trick: snapshotPostResolve(resolved, pre) };
    }
    case "resolved":
      return { state: reduce(state, { type: "nextTurn" }) };
    default:
      return { state };
  }
}

export function runSimulation(options: SimOptions): GameReport {
  const rng = mulberry32(options.seed);
  const rules = cloneRules(options.rules ?? defaultRules);
  const names = Array.from({ length: options.playerCount }, (_, i) => `J${i + 1}`);
  let state = reduce(initialState, {
    type: "start",
    names,
    rules,
    rng,
  });

  const tricks: TrickSnapshot[] = [];
  const maxSteps = options.maxSteps ?? 5000;
    let steps = 0;
    let stagnant = 0;

  while (state.phase !== "gameOver" && steps < maxSteps) {
    const before = state;
    const { state: next, trick } = autoStep(state, options.bot, rng);
    if (trick) tricks.push(trick);
    if (next === before) stagnant += 1;
    else stagnant = 0;
    if (stagnant >= 3) {
      throw new Error(`Simulation bloquée en phase « ${next.phase} » (seed ${options.seed})`);
    }
    state = next;
    steps += 1;
  }

  if (state.phase !== "gameOver") {
    throw new Error(`Simulation interrompue après ${maxSteps} étapes (seed ${options.seed})`);
  }

  return buildGameReport(state, options.seed, tricks);
}

export function runBatch(
  games: number,
  playerCount: number,
  seed: number,
  bot: Bot,
  rules?: RulesConfig,
): GameReport[] {
  const reports: GameReport[] = [];
  for (let i = 0; i < games; i++) {
    reports.push(
      runSimulation({
        playerCount,
        seed: seed + i,
        bot,
        rules,
      }),
    );
  }
  return reports;
}
