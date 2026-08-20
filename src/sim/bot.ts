import { greedyBot, noisyBot, randomBot } from "./bot-shared";
import { strategicBot, strategicNoisyBot } from "./strategic";

export type { Bot, BotChoice } from "./bot-shared";
export { greedyBot, noisyBot, randomBot, pickEchangeTarget, specialsOf, subsets } from "./bot-shared";
export { strategicBot, strategicNoisyBot, scoreStrategicPlay, tablePressure, playOrder } from "./strategic";

export const BOTS: Record<string, import("./bot-shared").Bot> = {
  greedy: greedyBot,
  noisy: noisyBot,
  random: randomBot,
  strategic: strategicBot,
  "strategic-noisy": strategicNoisyBot,
};
