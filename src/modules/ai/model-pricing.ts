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
};

/** Returns undefined for a model not in the table above, rather than
 *  guessing a price — callers should treat that as "cost unknown", not $0. */
export function estimateCostUsd(model: string, usage: TokenUsageLike): number | undefined {
  const price = PRICE_PER_MILLION_USD[model];
  if (!price) return undefined;
  return (usage.promptTokens / 1_000_000) * price.input + (usage.completionTokens / 1_000_000) * price.output;
}
