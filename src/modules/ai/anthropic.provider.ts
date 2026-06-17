import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmChatResult, LlmMessage, LlmProvider } from './llm.types';

interface AnthropicResponse {
  content?: { type: string; text?: string }[];
  usage?: { input_tokens: number; output_tokens: number };
  model?: string;
  error?: { message: string };
}

/**
 * Direct Anthropic Messages API client.
 * Anthropic separates the `system` prompt from the message list and has no
 * JSON-mode flag, so we rely on the prompt instruction + zod validation.
 */
@Injectable()
export class AnthropicProvider implements LlmProvider {
  private readonly endpoint = 'https://api.anthropic.com/v1/messages';
  private readonly version = '2023-06-01';
  private readonly maxTokens = 4096;

  constructor(private readonly config: ConfigService) {}

  async chatJson(messages: LlmMessage[], model: string): Promise<LlmChatResult> {
    const apiKey = this.config.get<string>('app.ai.anthropicApiKey');
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured');

    // Split system prompt from the conversation turns.
    const system = messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n\n');
    const turns = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': this.version,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: this.maxTokens,
        system,
        messages: turns,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Anthropic HTTP ${res.status}: ${text.slice(0, 300)}`);
    }

    const json = (await res.json()) as AnthropicResponse;
    if (json.error) throw new Error(`Anthropic error: ${json.error.message}`);

    const content = json.content
      ?.filter((b) => b.type === 'text')
      .map((b) => b.text ?? '')
      .join('');
    if (!content) throw new Error('Anthropic returned empty content');

    return {
      content,
      model: json.model ?? model,
      usage: {
        promptTokens: json.usage?.input_tokens ?? 0,
        completionTokens: json.usage?.output_tokens ?? 0,
        totalTokens: (json.usage?.input_tokens ?? 0) + (json.usage?.output_tokens ?? 0),
      },
    };
  }
}
