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
