export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  /** Anthropic prompt caching (see anthropic.provider.ts) — marks this block
   *  as a cache breakpoint when it (plus everything before it) is stable
   *  across repeated calls, e.g. the same deck's per-slide card generations.
   *  Ignored by providers that don't support it (Gemini, OpenRouter) — the
   *  field is simply absent from the request they build. */
  cacheControl?: boolean;
}

export interface LlmUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LlmResult<T> {
  data: T;
  model: string;
  usage: LlmUsage;
  /** Optional aggregate cost estimate when one logical generation used
   *  multiple provider calls (e.g. topic planner + outline). */
  costUsd?: number;
}

export interface LlmChatResult {
  content: string;
  usage: LlmUsage;
  model: string;
}

/** Common contract every provider (Anthropic, OpenRouter, ...) implements. */
export interface LlmProvider {
  chatJson(messages: LlmMessage[], model: string): Promise<LlmChatResult>;
}

/** DI token for the active provider, chosen at runtime by AI_PROVIDER. */
export const LLM_PROVIDER = Symbol('LLM_PROVIDER');
