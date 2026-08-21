import type { AgentDecision } from "../agent";
import type { AgentObservation } from "../observe";
import { observationToPromptText } from "../observe";
import type { AgentMemory } from "./memory";
import { memorySummary } from "./memory";
import type { AgentPersonality } from "./personalities";
import { personalityPromptBlock } from "./personalities";

export function buildSystemPrompt(personality: AgentPersonality): string {
  return [
    "Tu es un joueur expert de PRISME, un jeu de levées avec communes et combos façon poker.",
    "Tu joues une partie réelle : pose séquentielle face cachée, spéciales visibles (★), bluff social, construction long terme.",
    personalityPromptBlock(personality),
    "",
    "Réponds UNIQUEMENT en JSON valide avec cette forme :",
    `{`,
    `  "cardIds": ["id1", "id2"],`,
    `  "target": null,`,
    `  "strategy": "titre court",`,
    `  "reasoning": "explication en français, 3-6 phrases",`,
    `  "bullets": ["puce 1", "puce 2"],`,
    `  "opponentRead": "ce que tu penses des adversaires ce tour",`,
    `  "confidence": 0.0`,
    `}`,
    "",
    "Contraintes :",
    "- cardIds : uniquement des ids listés, entre playMin et playMax cartes.",
    "- target : obligatoire si Échange joué (playerId adverse), sinon null.",
    "- opponentRead : lecture sociale (badges ★, pression, qui mène).",
    "- confidence : entre 0 et 1.",
    "- reasoning : français, orienté jeu, pas technique.",
  ].join("\n");
}

export function buildUserPrompt(obs: AgentObservation, memory: AgentMemory, rulesBrief: string): string {
  return [
    "## Règles (rappel)",
    rulesBrief,
    "",
    "## Mémoire",
    memorySummary(memory),
    "",
    "## Situation actuelle",
    observationToPromptText(obs),
    "",
    "Décide ta pose. JSON uniquement.",
  ].join("\n");
}

export function buildReflectionPrompt(
  personality: AgentPersonality,
  trickSummary: string,
  memory: AgentMemory,
): string {
  return [
    `Tu es ${personality.displayName}. Le pli vient de se terminer.`,
    trickSummary,
    "",
    "Mémoire actuelle :",
    memorySummary(memory, 3),
    "",
    'Réponds en JSON : { "notes": ["note sur un adversaire", "note sur moi"], "plan": "plan pour les prochains tours" }',
  ].join("\n");
}

export type ParsedLlmDecision = AgentDecision & {
  opponentRead: string;
  confidence: number;
  rawModel?: string;
  rawProvider?: string;
};

export function parseLlmDecision(raw: unknown): ParsedLlmDecision {
  const obj = raw as Record<string, unknown>;
  const cardIds = Array.isArray(obj.cardIds) ? obj.cardIds.map(String) : [];
  const target =
    obj.target === null || obj.target === undefined ? null : Number(obj.target);
  const strategy = String(obj.strategy ?? "Stratégie");
  const reasoning = String(obj.reasoning ?? "");
  const bullets = Array.isArray(obj.bullets) ? obj.bullets.map(String) : [];
  const opponentRead = String(obj.opponentRead ?? "");
  const confidence = Number(obj.confidence ?? 0.5);

  return {
    cardIds,
    target: Number.isFinite(target) ? target : null,
    strategy,
    reasoning,
    bullets,
    opponentRead,
    confidence,
  };
}
