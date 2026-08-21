export type LlmMessage = { role: "system" | "user" | "assistant"; content: string };

export type LlmCompletionRequest = {
  messages: LlmMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
};

export type LlmCompletionResult = {
  content: string;
  model: string;
  provider: string;
  usage?: { promptTokens?: number; completionTokens?: number };
};

export type LlmClient = {
  name: string;
  complete(request: LlmCompletionRequest): Promise<LlmCompletionResult>;
};

export type LlmClientConfig = {
  provider: "openai" | "mock" | "local";
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
};

export function resolveLlmConfig(env: NodeJS.ProcessEnv = process.env): LlmClientConfig {
  const provider = (env.PRISME_LLM_PROVIDER ?? env.LLM_PROVIDER ?? "auto") as string;
  const apiKey = env.OPENAI_API_KEY ?? env.PRISME_LLM_API_KEY;
  const baseUrl = env.OPENAI_BASE_URL ?? env.PRISME_LLM_BASE_URL ?? "https://api.openai.com/v1";
  const model = env.OPENAI_MODEL ?? env.PRISME_LLM_MODEL ?? "gpt-4o-mini";

  if (provider === "mock") return { provider: "mock", model: "mock", temperature: 0.4, maxTokens: 1200 };
  if (provider === "local") return { provider: "local", model: "local-strategic", temperature: 0.4, maxTokens: 1200 };
  if (provider === "openai" || (provider === "auto" && apiKey)) {
    return {
      provider: "openai",
      apiKey,
      baseUrl,
      model,
      temperature: Number(env.PRISME_LLM_TEMPERATURE ?? 0.55),
      maxTokens: Number(env.PRISME_LLM_MAX_TOKENS ?? 1400),
    };
  }
  return { provider: "local", model: "local-strategic", temperature: 0.4, maxTokens: 1200 };
}

export async function createLlmClient(config: LlmClientConfig): Promise<LlmClient> {
  switch (config.provider) {
    case "openai":
      if (!config.apiKey) throw new Error("OPENAI_API_KEY requis pour provider openai");
      return createOpenAiClient(config);
    case "mock":
      return createMockClient(config);
    case "local":
    default:
      return createLocalClient(config);
  }
}

function createOpenAiClient(config: LlmClientConfig): LlmClient {
  return {
    name: `openai:${config.model}`,
    async complete(request) {
      const res = await fetch(`${config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.model,
          messages: request.messages,
          temperature: request.temperature ?? config.temperature ?? 0.55,
          max_tokens: request.maxTokens ?? config.maxTokens ?? 1400,
          response_format: request.jsonMode ? { type: "json_object" } : undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`OpenAI API ${res.status}: ${body.slice(0, 400)}`);
      }

      const data = (await res.json()) as {
        model: string;
        choices: { message: { content: string } }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };

      return {
        content: data.choices[0]?.message?.content ?? "",
        model: data.model,
        provider: "openai",
        usage: {
          promptTokens: data.usage?.prompt_tokens,
          completionTokens: data.usage?.completion_tokens,
        },
      };
    },
  };
}

function createMockClient(config: LlmClientConfig): LlmClient {
  return {
    name: "mock",
    async complete(request) {
      const user = request.messages.find((m) => m.role === "user")?.content ?? "";
      const ids = [...user.matchAll(/- ([^\s]+) →/g)].map((m) => m[1]);
      const cardIds = ids.slice(0, Math.min(2, ids.length)) || ["mock"];
      const payload = {
        cardIds,
        target: null,
        strategy: "Mock — test",
        reasoning: "Réponse simulée pour les tests automatisés.",
        bullets: ["mock"],
        opponentRead: "Je simule une lecture de table.",
        confidence: 0.5,
      };

      return {
        content: JSON.stringify(payload),
        model: config.model ?? "mock",
        provider: "mock",
      };
    },
  };
}

function createLocalClient(_config: LlmClientConfig): LlmClient {
  return {
    name: "local-strategic",
    async complete() {
      throw new Error("local client should be handled by LlmAgent directly");
    },
  };
}

export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    throw new Error(`Réponse LLM non JSON : ${trimmed.slice(0, 200)}`);
  }
}
