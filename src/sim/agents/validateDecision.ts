import { canConfirmPlay } from "../../engine/game";
import type { GameState } from "../../engine/types";
import type { AgentDecision } from "../agent";
import { projectObservation } from "../observe";
import { createGreedyExplainAgent } from "./explainable";
import { specialsOf } from "../bot-shared";

const fallbackAgent = createGreedyExplainAgent("fallback", "Fallback");

export function validateDecision(state: GameState, decision: AgentDecision): {
  ok: boolean;
  errors: string[];
} {
  const player = state.players.find((p) => p.id === state.activePlayerId)!;
  const errors: string[] = [];
  const ids = decision.cardIds;

  if (ids.length < state.rules.playMin || ids.length > state.rules.playMax) {
    errors.push(`Nombre de cartes invalide (${ids.length}).`);
  }

  const handIds = new Set(player.hand.map((c) => c.id));
  for (const id of ids) {
    if (!handIds.has(id)) errors.push(`Carte inconnue : ${id}`);
  }

  if (new Set(ids).size !== ids.length) errors.push("Doublons interdits.");

  let test = { ...state, pendingPlay: ids, pendingTarget: decision.target };
  const selected = player.hand.filter((c) => ids.includes(c.id));
  const hasEchange = specialsOf(selected, "echange").length > 0;
  if (hasEchange) {
    if (decision.target === null) errors.push("Échange sans cible.");
    else if (decision.target === player.id) errors.push("Échange sur soi interdit.");
  } else if (decision.target !== null) {
    errors.push("Cible fournie sans Échange.");
  }

  if (!canConfirmPlay(test)) errors.push("confirmPlay refusé par le moteur.");

  return { ok: errors.length === 0, errors };
}

export function fallbackDecision(state: GameState, rng: () => number, reason: string): AgentDecision {
  const base = fallbackAgent.decide(state, rng);
  return {
    ...base,
    strategy: "Repli heuristique",
    reasoning: `${base.reasoning}\n\n(Repli automatique : ${reason})`,
    bullets: [...base.bullets, `Repli : ${reason}`],
  };
}

export function sanitizeDecision(
  state: GameState,
  decision: AgentDecision,
  rng: () => number,
): AgentDecision {
  const check = validateDecision(state, decision);
  if (check.ok) return decision;
  return fallbackDecision(state, rng, check.errors.join(" ; "));
}

export function observationLegalCardIds(state: GameState, playerId: number): string[] {
  return projectObservation(state, playerId).legalCardIds;
}
