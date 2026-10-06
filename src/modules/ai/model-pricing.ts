// model-pricing.ts
// Approximate USD cost per LLM call, for server-log observability only —
// NOT used for billing/invoicing. Extend this table whenever a new model
// shows up in AI_OUTLINE_MODEL/AI_CARD_MODEL (.env) or LANGUAGE_MODEL_OVERRIDE
// (layout.catalog.ts), or the estimate silently falls back to "unknown".

export interface TokenUsageLike {
  promptTokens: number;
  completionTokens: number;
}

const PRICE_PER_MILLION_USD: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
  'claude-sonnet-5': { input: 2.0, output: 10.0 }, // intro pricing through 2026-08-31
  'claude-opus-4-8': { input: 5.0, output: 25.0 },
  'claude-haiku-4-5': { input: 1.0, output: 5.0 },
  'claude-haiku-4-5-20251001': { input: 1.0, output: 5.0 }, // dated alias of the above (AI_CARD_MODEL)
  'openai/gpt-4.1': { input: 2.0, output: 8.0 },
  'openai/gpt-4.1-mini': { input: 0.4, output: 1.6 },
  'openai/gpt-5.4-mini': { input: 0.75, output: 4.5 },
  'openai/gpt-5-mini': { input: 0.25, output: 2.0 },
  'google/gemini-2.5-flash': { input: 0.3, output: 2.5 },
  'qwen/qwen3.6-35b-a3b': { input: 0.14, output: 1.0 },
  'qwen/qwen3.7-plus': { input: 0.32, output: 1.28 },
  'deepseek/deepseek-v4-flash': { input: 0.09, output: 0.18 },
  // Gemini fallback models (Google AI Studio list price, approximate). The
  // fallback uses the `gemini-flash-latest` alias; the API returns the resolved
  // concrete version (e.g. gemini-2.5-flash / gemini-3.5-flash) for cost lookup.
  'gemini-2.5-flash': { input: 0.3, output: 2.5 },
  'gemini-3.5-flash': { input: 0.3, output: 2.5 },
  'gemini-2.5-pro': { input: 1.25, output: 10.0 },
  'gemini-2.5-flash-lite': { input: 0.1, output: 0.4 },
};

/** Returns undefined for a model not in the table above, rather than
 *  guessing a price — callers should treat that as "cost unknown", not $0. */
export function estimateCostUsd(model: string, usage: TokenUsageLike): number | undefined {
  const price = PRICE_PER_MILLION_USD[model];
  if (!price) return undefined;
  return (usage.promptTokens / 1_000_000) * price.input + (usage.completionTokens / 1_000_000) * price.output;
}
