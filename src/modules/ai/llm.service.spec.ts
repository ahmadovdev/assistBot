import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import { LlmService } from './llm.service';
import { LlmChatResult, LlmMessage, LlmProvider } from './llm.types';

class FakeProvider implements LlmProvider {
  readonly calls: Array<{ messages: LlmMessage[]; model: string }> = [];

  constructor(private readonly response: LlmChatResult) {}

  async chatJson(messages: LlmMessage[], model: string): Promise<LlmChatResult> {
    this.calls.push({ messages, model });
    return this.response;
  }
}

const config = {
  get: (key: string) => key === 'app.ai.responseCache.enabled' ? false : undefined,
} as ConfigService;

describe('LlmService direct structured generation', () => {
  it('accepts a valid response after exactly one provider call', async () => {
    const provider = new FakeProvider({
      content: '{"title":"Valid"}',
      model: 'test/model',
      usage: { promptTokens: 20, completionTokens: 5, totalTokens: 25 },
    });
    const service = new LlmService(provider, null, config);

    const result = await service.generateStructured({
      system: 'system',
      user: 'user',
      schema: z.object({ title: z.string() }),
      model: 'test/model',
    });

    expect(result.data).toEqual({ title: 'Valid' });
    expect(provider.calls).toHaveLength(1);
  });

  it('rejects invalid JSON without retrying or repairing it', async () => {
    const provider = new FakeProvider({
      content: '{"title":',
      model: 'test/model',
      usage: { promptTokens: 20, completionTokens: 2, totalTokens: 22 },
    });
    const service = new LlmService(provider, null, config);

    await expect(service.generateStructured({
      system: 'system',
      user: 'user',
      schema: z.object({ title: z.string() }),
      model: 'test/model',
    })).rejects.toThrow('invalid JSON');
    expect(provider.calls).toHaveLength(1);
  });

  it('rejects schema-invalid data without a second model call', async () => {
    const provider = new FakeProvider({
      content: '{"title":"x"}',
      model: 'test/model',
      usage: { promptTokens: 20, completionTokens: 3, totalTokens: 23 },
    });
    const service = new LlmService(provider, null, config);

    await expect(service.generateStructured({
      system: 'system',
      user: 'user',
      schema: z.object({ title: z.string().min(10) }),
      model: 'test/model',
    })).rejects.toThrow('does not match the slide contract');
    expect(provider.calls).toHaveLength(1);
  });
});
