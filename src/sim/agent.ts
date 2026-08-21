import type { BotChoice } from "./bot-shared";
import type { GameState } from "../engine/types";

/** Décision d'un agent avec commentaire en français (traçabilité). */
export type AgentDecision = BotChoice & {
  strategy: string;
  reasoning: string;
  bullets: string[];
  opponentRead?: string;
  confidence?: number;
  llmMeta?: { model: string; provider: string; fallback?: boolean };
};

export type SimAgent = {
  id: string;
  displayName: string;
  kind: string;
  decide: (state: GameState, rng: () => number) => AgentDecision;
};

export type AsyncSimAgent = {
  id: string;
  displayName: string;
  kind: string;
  personalityId: string;
  decide: (state: GameState, rng: () => number) => Promise<AgentDecision>;
  onTrickResolved?: (state: GameState, myPlayedLabel: string) => Promise<void>;
  getMemorySummary?: () => string;
};

export type AgentFactory = (seat: number, displayName?: string) => SimAgent;
