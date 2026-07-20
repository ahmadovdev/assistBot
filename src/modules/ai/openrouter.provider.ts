import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmChatResult, LlmMessage, LlmProvider } from './llm.types';

interface ChatCompletionResponse {
  choices?: { message?: { content?: string } }[];
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  model?: string;
  error?: { message: string };
}

export function reasoningForJsonModel(
  model: string,
): { effort: 'none'; exclude: true } | undefined {
  // Some reasoning models enable thinking by default. For short schema-bound
  // JSON calls this adds latency and cost without improving the rendered card.
  return model === 'qwen/qwen3.6-35b-a3b' ||
    model === 'qwen/qwen3.7-plus' ||
    model === 'deepseek/deepseek-v4-flash'
    ? { effort: 'none', exclude: true }
    : undefined;
}

/** Thin OpenRouter client (OpenAI-compatible). Uses global fetch (Node 20+). */
@Injectable()
export class OpenRouterProvider implements LlmProvider {
  private readonly endpoint = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly defaultTimeoutMs = 45_000;

  constructor(private readonly config: ConfigService) {}

  async chatJson(messages: LlmMessage[], model: string): Promise<LlmChatResult> {
    const apiKey = this.config.get<string>('app.ai.openrouterApiKey');
    if (!apiKey) throw new Error('OPENROUTER_API_KEY is not configured');
    const reasoning = reasoningForJsonModel(model);

    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://t.me/LumioApp_bot',
        'X-Title': 'Lumio Presentation Bot',
      },
      body: JSON.stringify({
        model,
        messages,
        response_format: { type: 'json_object' },
        ...(reasoning ? { reasoning } : {}),
        temperature: 0.7,
      }),
      // Hard cap so a stalled connection can't hang the worker forever.
      signal: AbortSignal.timeout(
        this.config.get<number>('app.ai.requestTimeoutMs') ?? this.defaultTimeoutMs,
      ),
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
