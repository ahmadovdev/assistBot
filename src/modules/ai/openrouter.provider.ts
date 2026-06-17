import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmChatResult, LlmMessage, LlmProvider } from './llm.types';

interface ChatCompletionResponse {
  choices?: { message?: { content?: string } }[];
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  model?: string;
  error?: { message: string };
}

/** Thin OpenRouter client (OpenAI-compatible). Uses global fetch (Node 20+). */
@Injectable()
export class OpenRouterProvider implements LlmProvider {
  private readonly endpoint = 'https://openrouter.ai/api/v1/chat/completions';

  constructor(private readonly config: ConfigService) {}

  async chatJson(messages: LlmMessage[], model: string): Promise<LlmChatResult> {
    const apiKey = this.config.get<string>('app.ai.openrouterApiKey');
    if (!apiKey) throw new Error('OPENROUTER_API_KEY is not configured');

    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenRouter HTTP ${res.status}: ${text.slice(0, 300)}`);
    }

    const json = (await res.json()) as ChatCompletionResponse;
    if (json.error) throw new Error(`OpenRouter error: ${json.error.message}`);

    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error('OpenRouter returned empty content');

    return {
      content,
      model: json.model ?? model,
      usage: {
        promptTokens: json.usage?.prompt_tokens ?? 0,
        completionTokens: json.usage?.completion_tokens ?? 0,
        totalTokens: json.usage?.total_tokens ?? 0,
      },
    };
  }
}
