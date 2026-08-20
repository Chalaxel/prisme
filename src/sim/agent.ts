import type { BotChoice } from "./bot-shared";
import type { GameState } from "../engine/types";

/** Décision d'un agent avec commentaire en français (traçabilité). */
export type AgentDecision = BotChoice & {
  /** Stratégie globale ce tour */
  strategy: string;
  /** Explication détaillée en plusieurs phrases */
  reasoning: string;
  /** Puces courtes pour le compte-rendu */
  bullets: string[];
};

export type SimAgent = {
  id: string;
  displayName: string;
  kind: string;
  decide: (state: GameState, rng: () => number) => AgentDecision;
};

export type AgentFactory = (seat: number, displayName?: string) => SimAgent;
