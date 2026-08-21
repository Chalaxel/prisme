export { BOTS, greedyBot, noisyBot, randomBot, strategicBot, strategicNoisyBot } from "./bot";
export type { Bot, BotChoice } from "./bot";
export {
  aggregateReports,
  buildGameReport,
  deriveInsights,
  formatAggregate,
  formatGameReport,
} from "./metrics";
export type { AggregateMetrics, DesignInsight, GameReport } from "./metrics";
export { autoStep, runBatch, runSimulation } from "./play";
export type { SimOptions, TrickSnapshot } from "./play";
export { evaluateGameReport, evaluateGameState, formatEvaluation } from "./evaluate";
export { mulberry32 } from "./rng";
export type { AgentDecision, SimAgent } from "./agent";
export { createMixedAgents, createStrategicAgent, createGreedyExplainAgent, AGENT_FACTORIES } from "./agents/explainable";
export { runTracedGame, summarizeFinal } from "./tracedGame";
export type { TracedGame, TurnTrace, PlayTrace } from "./tracedGame";
export { formatTracedGameMarkdown, formatTurnMarkdown, traceOutputPath } from "./traceMarkdown";
export { runAsyncTracedGame } from "./asyncTracedGame";
export type { LlmTracedGame, LlmTurnTrace, LlmPlayTrace } from "./asyncTracedGame";
export { formatLlmTracedGameMarkdown, llmTraceOutputPath } from "./llmTraceMarkdown";
export { projectObservation, observationToPromptText } from "./observe";
export type { AgentObservation } from "./observe";
export { createLlmAgents } from "./agents/llmAgent";
export { resolveLlmConfig, createLlmClient } from "./agents/llmClient";
export { PERSONALITIES, DEFAULT_PERSONALITY_IDS } from "./agents/personalities";
export type { AsyncSimAgent } from "./agent";
