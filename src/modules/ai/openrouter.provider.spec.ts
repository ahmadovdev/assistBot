import { reasoningForJsonModel } from './openrouter.provider';

describe('reasoningForJsonModel', () => {
  it('disables Qwen thinking for schema-bound JSON generation', () => {
    expect(reasoningForJsonModel('qwen/qwen3.6-35b-a3b')).toEqual({
      effort: 'none',
      exclude: true,
    });
    expect(reasoningForJsonModel('qwen/qwen3.7-plus')).toEqual({
      effort: 'none',
      exclude: true,
    });
  });

  it('disables DeepSeek thinking for schema-bound fallback generation', () => {
    expect(reasoningForJsonModel('deepseek/deepseek-v4-flash')).toEqual({
      effort: 'none',
      exclude: true,
    });
  });

  it('does not alter other OpenRouter models', () => {
    expect(reasoningForJsonModel('openai/gpt-4.1-mini')).toBeUndefined();
    expect(reasoningForJsonModel('google/gemini-2.5-flash')).toBeUndefined();
  });
});
