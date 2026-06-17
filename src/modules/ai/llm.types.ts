export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
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
