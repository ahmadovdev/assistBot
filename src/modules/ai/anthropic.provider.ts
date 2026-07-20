import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmChatResult, LlmMessage, LlmProvider } from './llm.types';
import { CacheStatsService } from './cache-stats.service';

interface AnthropicResponse {
  content?: { type: string; text?: string }[];
  usage?: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
  model?: string;
  error?: { message: string };
}

interface SystemBlock {
  type: 'text';
  text: string;
  cache_control?: { type: 'ephemeral' };
}

/**
 * Direct Anthropic Messages API client.
 * Anthropic separates the `system` prompt from the message list and has no
 * JSON-mode flag, so we rely on the prompt instruction + zod validation.
 */
@Injectable()
export class AnthropicProvider implements LlmProvider {
  private readonly logger = new Logger(AnthropicProvider.name);
  private readonly endpoint = 'https://api.anthropic.com/v1/messages';
  private readonly version = '2023-06-01';
  private readonly maxTokens = 4096;
  /** Hard cap per request so a stalled/black-holed connection can't hang the
   * worker forever (undici's fetch has no default response timeout). On timeout
   * the fetch aborts and the generation job fails explicitly. */
  private readonly defaultTimeoutMs = 45_000;

  constructor(
    private readonly config: ConfigService,
    private readonly cacheStats: CacheStatsService,
  ) {}

  /**
   * Plain string when there's exactly one system message and it isn't
   * marked for caching (the common case — outline/brief calls) — byte-for-
   * byte identical to the pre-caching request shape. Anthropic's array form
   * (with `cache_control` breakpoints) is used only when a caller actually
   * opted into caching via `systemCacheable` (see llm.service.ts), e.g. the
   * per-slide card-generation calls that share a deck-wide preamble.
   */
  private buildSystem(systemMessages: LlmMessage[]): string | SystemBlock[] {
    if (systemMessages.length === 0) return '';
    if (systemMessages.length === 1 && !systemMessages[0].cacheControl) {
      return systemMessages[0].content;
    }
    return systemMessages.map((m) => ({
      type: 'text' as const,
      text: m.content,
      ...(m.cacheControl ? { cache_control: { type: 'ephemeral' as const } } : {}),
    }));
  }

  async chatJson(messages: LlmMessage[], model: string): Promise<LlmChatResult> {
    const apiKey = this.config.get<string>('app.ai.anthropicApiKey');
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured');

    // Split system prompt(s) from the conversation turns.
    const system = this.buildSystem(messages.filter((m) => m.role === 'system'));
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
      signal: AbortSignal.timeout(
        this.config.get<number>('app.ai.requestTimeoutMs') ?? this.defaultTimeoutMs,
      ),
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

    const cacheRead = json.usage?.cache_read_input_tokens ?? 0;
    const cacheWrite = json.usage?.cache_creation_input_tokens ?? 0;
    if (cacheRead > 0 || cacheWrite > 0) {
      this.logger.debug(`Prompt cache: read=${cacheRead} write=${cacheWrite} tokens`);
    }
    // Feed the running cache hit-rate metric (input_tokens = non-cached input).
    this.cacheStats.record({
      cacheRead,
      cacheWrite,
      freshInput: json.usage?.input_tokens ?? 0,
    });

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
