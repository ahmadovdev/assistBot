import { estimateCostUsd } from './model-pricing';

describe('estimateCostUsd', () => {
  it('prices a known model by input/output tokens', () => {
    // claude-sonnet-5: $2/M input, $10/M output
    const cost = estimateCostUsd('claude-sonnet-5', {
      promptTokens: 1_000_000,
      completionTokens: 1_000_000,
    });
    expect(cost).toBeCloseTo(12);
  });

  it('prices GPT-4.1 for planner/outline calls', () => {
    const cost = estimateCostUsd('openai/gpt-4.1', {
      promptTokens: 1_000_000,
      completionTokens: 1_000_000,
    });
    expect(cost).toBeCloseTo(10);
  });

  it('prices GPT-5.4 mini for the current OpenRouter card model', () => {
    const cost = estimateCostUsd('openai/gpt-5.4-mini', {
      promptTokens: 1_000_000,
      completionTokens: 1_000_000,
    });
    expect(cost).toBeCloseTo(5.25);
  });

  it('prices GPT-5 mini for cheap targeted repair calls', () => {
    const cost = estimateCostUsd('openai/gpt-5-mini', {
      promptTokens: 1_000_000,
      completionTokens: 1_000_000,
    });
    expect(cost).toBeCloseTo(2.25);
  });

  it('prices the dated haiku alias (AI_CARD_MODEL) instead of returning unknown', () => {
    const cost = estimateCostUsd('claude-haiku-4-5-20251001', {
      promptTokens: 1_000_000,
      completionTokens: 0,
    });
    expect(cost).toBeCloseTo(1);
  });

  it('prices the gemini fallback models', () => {
    expect(estimateCostUsd('gemini-2.5-flash', { promptTokens: 1_000_000, completionTokens: 0 })).toBeCloseTo(0.3);
    expect(estimateCostUsd('gemini-3.5-flash', { promptTokens: 0, completionTokens: 1_000_000 })).toBeCloseTo(2.5);
  });

  it('prices the OpenRouter Gemini card model id', () => {
    expect(estimateCostUsd('google/gemini-2.5-flash', { promptTokens: 0, completionTokens: 1_000_000 })).toBeCloseTo(2.5);
  });

  it('prices the OpenRouter Qwen card model id', () => {
    const cost = estimateCostUsd('qwen/qwen3.6-35b-a3b', {
      promptTokens: 1_000_000,
      completionTokens: 1_000_000,
    });
    expect(cost).toBeCloseTo(1.14);
  });

  it('prices the OpenRouter Qwen 3.7 Plus card model id', () => {
    const cost = estimateCostUsd('qwen/qwen3.7-plus', {
      promptTokens: 1_000_000,
      completionTokens: 1_000_000,
    });
    expect(cost).toBeCloseTo(1.6);
  });

  it('prices the OpenRouter DeepSeek fallback model id', () => {
    const cost = estimateCostUsd('deepseek/deepseek-v4-flash', {
      promptTokens: 1_000_000,
      completionTokens: 1_000_000,
    });
    expect(cost).toBeCloseTo(0.27);
  });

  it('returns undefined (not 0) for an unpriced model', () => {
    expect(estimateCostUsd('some-unknown-model', { promptTokens: 100, completionTokens: 100 })).toBeUndefined();
  });
});
