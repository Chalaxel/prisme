import type { GameState } from "../../engine/types";
import type { AsyncSimAgent, AgentDecision } from "../agent";
import { projectObservation } from "../observe";
import { formatCards } from "../cardFormat";
import { createStrategicAgent } from "./explainable";
import type { LlmClient, LlmClientConfig } from "./llmClient";
import { createLlmClient, extractJsonObject } from "./llmClient";
import {
  buildReflectionPrompt,
  buildSystemPrompt,
  buildUserPrompt,
  parseLlmDecision,
} from "./llmPrompt";
import type { AgentMemory } from "./memory";
import { emptyMemory, memorySummary, recordTrickReveal } from "./memory";
import { resolvePersonality } from "./personalities";
import { fallbackDecision, sanitizeDecision } from "./validateDecision";

export type LlmAgentOptions = {
  id: string;
  displayName: string;
  personalityId: string;
  client: LlmClient;
  config: LlmClientConfig;
  reflectAfterTrick?: boolean;
};

const strategicFallback = createStrategicAgent("fb", "FB");

export function createLlmAgent(options: LlmAgentOptions): AsyncSimAgent {
  const personality = resolvePersonality(options.personalityId);
  const seatId = Number(options.id.replace(/\D/g, "")) || 0;
  let memory: AgentMemory = emptyMemory();

  async function decideWithLocal(state: GameState, rng: () => number): Promise<AgentDecision> {
    const base = strategicFallback.decide(state, rng);
    const obs = projectObservation(state, state.activePlayerId);
    return {
      ...base,
      strategy: `${personality.displayName} — ${base.strategy}`,
      reasoning: [
        `**${options.displayName}** (${personality.archetype})`,
        buildUserPrompt(obs, memory, obs.rulesBrief).split("## Situation actuelle")[1] ?? "",
        "",
        base.reasoning,
        "",
        `*(Mode local — définir OPENAI_API_KEY pour un vrai LLM)*`,
      ].join("\n"),
      opponentRead: memorySummary(memory, 2) || "Pas encore de lecture adverse.",
      confidence: 0.6,
      llmMeta: { model: "local-strategic", provider: "local" },
    };
  }

  async function decideWithLlm(state: GameState, rng: () => number): Promise<AgentDecision> {
    const obs = projectObservation(state, state.activePlayerId);
    const system = buildSystemPrompt(personality);
    const user = buildUserPrompt(obs, memory, obs.rulesBrief);

    try {
      const result = await options.client.complete({
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        jsonMode: options.config.provider === "openai",
        temperature: options.config.temperature,
        maxTokens: options.config.maxTokens,
      });

      const parsed = parseLlmDecision(extractJsonObject(result.content));
      const sanitized = sanitizeDecision(state, parsed, rng);
      const usedFallback = sanitized.strategy === "Repli heuristique";

      return {
        ...sanitized,
        opponentRead: parsed.opponentRead,
        confidence: parsed.confidence,
        reasoning: [
          sanitized.reasoning,
          "",
          `**Lecture adverse :** ${parsed.opponentRead}`,
          `**Confiance :** ${(parsed.confidence * 100).toFixed(0)} %`,
        ].join("\n"),
        llmMeta: {
          model: result.model,
          provider: result.provider,
          fallback: usedFallback,
        },
      };
    } catch (err) {
      const fb = fallbackDecision(state, rng, err instanceof Error ? err.message : "erreur LLM");
      return {
        ...fb,
        opponentRead: "Erreur modèle — repli.",
        confidence: 0.2,
        llmMeta: { model: options.config.model ?? "?", provider: options.config.provider, fallback: true },
      };
    }
  }

  return {
    id: options.id,
    displayName: options.displayName,
    kind: "llm",
    personalityId: options.personalityId,
    getMemorySummary: () => memorySummary(memory),
    async decide(state, rng) {
      if (options.config.provider === "local") return decideWithLocal(state, rng);
      if (options.config.provider === "mock") return decideWithLlm(state, rng);
      return decideWithLlm(state, rng);
    },
    async onTrickResolved(state, myPlayedLabel) {
      memory = recordTrickReveal(memory, state, seatId, myPlayedLabel);

      if (!options.reflectAfterTrick || options.config.provider === "local") return;
      if (options.config.provider !== "openai") return;

      const trickSummary = [
        `Tour ${state.turn} terminé.`,
        `Vainqueurs : ${state.lastWinnerIds.map((id) => state.players.find((p) => p.id === id)?.name).join(", ")}`,
        `J'ai posé : ${myPlayedLabel}`,
      ].join(" ");

      try {
        const result = await options.client.complete({
          messages: [
            { role: "system", content: buildSystemPrompt(personality) },
            { role: "user", content: buildReflectionPrompt(personality, trickSummary, memory) },
          ],
          jsonMode: true,
          temperature: 0.4,
          maxTokens: 500,
        });
        const reflection = extractJsonObject(result.content) as { notes?: string[]; plan?: string };
        if (reflection.plan) memory = { ...memory, selfNotes: [...memory.selfNotes, reflection.plan].slice(-8) };
        if (Array.isArray(reflection.notes)) {
          memory = {
            ...memory,
            selfNotes: [...memory.selfNotes, ...reflection.notes.slice(0, 3)].slice(-8),
          };
        }
      } catch {
        // reflection optional
      }
    },
  };
}

export async function createLlmAgents(
  specs: { name: string; personalityId: string }[],
  config?: LlmClientConfig,
  options?: { reflectAfterTrick?: boolean },
): Promise<AsyncSimAgent[]> {
  const resolved = config ?? (await import("./llmClient")).resolveLlmConfig();
  const client = await createLlmClient(resolved);
  const reflect = options?.reflectAfterTrick ?? resolved.provider === "openai";

  return specs.map((spec, i) =>
    createLlmAgent({
      id: `p${i}`,
      displayName: spec.name,
      personalityId: spec.personalityId,
      client,
      config: resolved,
      reflectAfterTrick: reflect,
    }),
  );
}

export function agentPlayerId(agent: AsyncSimAgent): number {
  return Number(agent.id.replace(/\D/g, "")) || 0;
}

export function playedLabel(state: GameState, cardIds: string[]): string {
  const player = state.players.find((p) => p.id === state.activePlayerId)!;
  const cards = player.hand.filter((c) => cardIds.includes(c.id));
  return formatCards(cards, state.rules);
}
