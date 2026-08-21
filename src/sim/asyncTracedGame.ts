import { initialState, reduce } from "../engine/game";
import { pilePoints } from "../engine/score";
import { cloneRules, defaultRules } from "../rules/defaultRules";
import type { Card, Combo, GameState, RulesConfig, SpecialKind } from "../engine/types";
import type { AgentDecision, AsyncSimAgent } from "./agent";
import { formatCards } from "./cardFormat";
import { buildGameReport, type GameReport } from "./metrics";
import { mulberry32 } from "./rng";
import type { TrickSnapshot } from "./play";

export type LlmPlayTrace = {
  playerId: number;
  playerName: string;
  seatInOrder: number;
  handBefore: Card[];
  cardsPlayed: Card[];
  decision: AgentDecision;
  visibleBeforePlay: string;
  memoryBefore?: string;
  deliberationMs?: number;
};

export type LlmTurnTrace = {
  turn: number;
  dealerName: string;
  deckRemaining: number;
  commons: Card[];
  modifiers: string[];
  plays: LlmPlayTrace[];
  combos: Record<number, Combo | null>;
  winnerIds: number[];
  winnerName: string;
  captureSummary: string;
  pilePointsAfter: number[];
  logExcerpt: string[];
};

export type LlmTracedGame = {
  seed: number;
  rules: RulesConfig;
  llmProvider: string;
  llmModel: string;
  agents: { id: string; name: string; kind: string; personalityId: string }[];
  turns: LlmTurnTrace[];
  report: GameReport;
  stats: { llmCalls: number; fallbacks: number; totalDeliberationMs: number };
};

function applyDecision(state: GameState, decision: AgentDecision): GameState {
  let next = state;
  for (const cardId of decision.cardIds) {
    next = reduce(next, { type: "toggleCard", cardId });
  }
  if (decision.target !== null) {
    next = reduce(next, { type: "setTarget", playerId: decision.target });
  }
  return reduce(next, { type: "confirmPlay" });
}

function playOrder(state: GameState): number[] {
  return Array.from({ length: state.players.length }, (_, i) => (state.dealerId + i) % state.players.length);
}

function modifiersLine(state: GameState): string[] {
  const lines: string[] = [];
  if (state.prisme) lines.push("Prisme actif");
  if (state.inversion) lines.push("Inversion active");
  return lines;
}

function countSpecials(cards: Card[]): Partial<Record<SpecialKind, number>> {
  const out: Partial<Record<SpecialKind, number>> = {};
  for (const c of cards) {
    if (c.kind !== "special") continue;
    out[c.special] = (out[c.special] ?? 0) + 1;
  }
  return out;
}

function captureSummary(state: GameState, winnerId: number): string {
  const winner = state.players.find((p) => p.id === winnerId)!;
  const rules = state.rules;
  const capturesCommons = rules.tuning.winnerCapturesCommons;
  const parts = [`${winner.name} remporte le pli.`];
  if (capturesCommons) {
    parts.push(`Capture communes : ${formatCards(state.commons, rules)}.`);
  } else {
    parts.push("Communes défaussées (non capturées).");
  }
  parts.push(`Cartes posées capturées vers sa pile (valeur ~${pilePoints(winner.pointsPile, rules)} pts cumulés).`);
  return parts.join(" ");
}

export async function runAsyncTracedGame(options: {
  seed: number;
  rules?: RulesConfig;
  agents: AsyncSimAgent[];
  llmProvider: string;
  llmModel: string;
  onProgress?: (msg: string) => void;
}): Promise<LlmTracedGame> {
  const rng = mulberry32(options.seed);
  const rules = cloneRules(options.rules ?? defaultRules);
  const agentBySeat = options.agents;

  let state = reduce(initialState, {
    type: "start",
    rules,
    names: agentBySeat.map((a) => a.displayName),
    rng,
  });

  const turns: LlmTurnTrace[] = [];
  const tricks: TrickSnapshot[] = [];
  let currentTurn: LlmTurnTrace | null = null;
  let steps = 0;
  const stats = { llmCalls: 0, fallbacks: 0, totalDeliberationMs: 0 };

  while (state.phase !== "gameOver" && steps < 5000) {
    steps += 1;
    const before = state;

    switch (state.phase) {
      case "curtain":
        state = reduce(state, { type: "confirmCurtain" });
        break;

      case "play": {
        if (!currentTurn) {
          currentTurn = {
            turn: state.turn,
            dealerName: state.players.find((p) => p.id === state.dealerId)?.name ?? "?",
            deckRemaining: state.deck.length,
            commons: [...state.commons],
            modifiers: modifiersLine(state),
            plays: [],
            combos: {},
            winnerIds: [],
            winnerName: "",
            captureSummary: "",
            pilePointsAfter: [],
            logExcerpt: [],
          };
        }

        const agent = agentBySeat[state.activePlayerId];
        const player = state.players.find((p) => p.id === state.activePlayerId)!;
        const handBefore = [...player.hand];
        const order = playOrder(state);
        const seatInOrder = order.indexOf(player.id) + 1;

        const visibleParts = order
          .slice(0, order.indexOf(player.id))
          .map((pid) => {
            const pl = state.players.find((p) => p.id === pid)!;
            const sp = pl.posed.filter((c) => c.kind === "special").length;
            return `${pl.name}:${pl.posed.length} posée(s)${sp ? " ★" : ""}`;
          })
          .join(", ");

        options.onProgress?.(
          `Tour ${state.turn} · ${player.name} réfléchit (pose ${seatInOrder}/${state.players.length})…`,
        );

        const t0 = Date.now();
        const decision = await agent.decide(state, rng);
        const deliberationMs = Date.now() - t0;
        stats.llmCalls += 1;
        stats.totalDeliberationMs += deliberationMs;
        if (decision.llmMeta?.fallback) stats.fallbacks += 1;

        state = applyDecision(state, decision);
        const played = handBefore.filter((c) => decision.cardIds.includes(c.id));

        currentTurn.plays.push({
          playerId: player.id,
          playerName: player.name,
          seatInOrder,
          handBefore,
          cardsPlayed: played,
          decision,
          visibleBeforePlay: visibleParts || "Aucune pile adverse visible.",
          memoryBefore: agent.getMemorySummary?.(),
          deliberationMs,
        });
        break;
      }

      case "reveal": {
        state = reduce(state, { type: "acknowledgeReveal" });
        if (currentTurn) {
          currentTurn.combos = { ...state.lastCombos };
          currentTurn.winnerIds = [...state.lastWinnerIds];
          currentTurn.winnerName =
            state.lastWinnerIds.map((id) => state.players.find((p) => p.id === id)?.name).join(", ") ?? "";
          currentTurn.pilePointsAfter = state.players.map((p) => pilePoints(p.pointsPile, rules));
          currentTurn.captureSummary = captureSummary(state, state.lastWinnerIds[0]);
          currentTurn.logExcerpt = state.log.slice(-6);
          turns.push(currentTurn);

          for (const play of currentTurn.plays) {
            const ag = agentBySeat[play.playerId];
            const label = formatCards(play.cardsPlayed, rules);
            await ag.onTrickResolved?.(state, label);
          }

          const posed = state.players.flatMap((p) => p.posed);
          tricks.push({
            turn: state.turn,
            winnerIds: [...state.lastWinnerIds],
            combos: { ...state.lastCombos },
            pilePoints: state.players.map((p) => pilePoints(p.pointsPile, rules)),
            prismeActive: state.prisme,
            inversionActive: state.inversion,
            bluffPlayed: posed.filter((c) => c.kind === "special" && c.special === "bluff").length,
            specialsPlayed: countSpecials(posed),
            geleRecoveries: state.log.slice(-8).filter((l) => l.startsWith("Gèle :")).length,
          });
        }
        currentTurn = null;
        break;
      }

      case "resolved":
        state = reduce(state, { type: "nextTurn" });
        break;

      default:
        break;
    }

    if (state === before && state.phase !== "gameOver") {
      throw new Error(`Simulation bloquée phase ${state.phase} seed ${options.seed}`);
    }
  }

  if (state.phase !== "gameOver") throw new Error("Partie non terminée");

  const report = buildGameReport(state, options.seed, tricks);

  return {
    seed: options.seed,
    rules,
    llmProvider: options.llmProvider,
    llmModel: options.llmModel,
    agents: agentBySeat.map((a) => ({
      id: a.id,
      name: a.displayName,
      kind: a.kind,
      personalityId: a.personalityId,
    })),
    turns,
    report,
    stats,
  };
}
