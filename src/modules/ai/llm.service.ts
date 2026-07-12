import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ZodType } from 'zod';
import {
  LlmMessage,
  LlmProvider,
  LlmResult,
  LlmFallback,
  LLM_PROVIDER,
  LLM_FALLBACK,
} from './llm.types';

interface GenerateStructuredOptions<T> {
  system: string;
  /** Optional second system block, appended after `system` and marked as an
   *  Anthropic cache breakpoint — for content that's stable across a BATCH
   *  of calls (e.g. every slide of one deck sharing the same deck-context
   *  preamble) but not necessarily forever (unlike `system` itself, which
   *  callers might reuse across totally unrelated requests). Ignored by
   *  providers that don't support caching. */
  systemCacheable?: string;
  user: string;
  schema: ZodType<T, any, any>;
  model: string;
  maxRepairs?: number;
  /** Applied to the validated data before it's returned, e.g. language-specific text cleanup. */
  postprocess?: (data: T) => T;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(
    @Inject(LLM_PROVIDER) private readonly provider: LlmProvider,
    @Optional() @Inject(LLM_FALLBACK) private readonly fallback: LlmFallback | null = null,
  ) {}

  /**
   * Calls the active provider in JSON mode, validates against a zod schema, and
   * runs a repair loop until valid. If the primary provider fails entirely
   * (network/timeout error, or invalid JSON after all repairs) and a fallback
   * provider is configured, the whole request is retried once on the fallback
   * (e.g. Claude -> Gemini) — for resilience and provider-outage survival.
   */
  async generateStructured<T>(opts: GenerateStructuredOptions<T>): Promise<LlmResult<T>> {
    try {
      return await this.attempt(this.provider, opts.model, opts);
    } catch (primaryErr) {
      if (!this.fallback) throw primaryErr;
      this.logger.warn(
        `Primary LLM (${opts.model}) failed: ${String(primaryErr)}. ` +
          `Falling back to ${this.fallback.model}.`,
      );
      try {
        return await this.attempt(this.fallback.provider, this.fallback.model, opts);
      } catch (fallbackErr) {
        this.logger.error(`Fallback LLM (${this.fallback.model}) also failed: ${String(fallbackErr)}`);
        throw fallbackErr;
      }
    }
  }

  /** One provider's full attempt: generate + validate + repair loop. */
  private async attempt<T>(
    provider: LlmProvider,
    model: string,
    opts: GenerateStructuredOptions<T>,
  ): Promise<LlmResult<T>> {
    const { system, systemCacheable, user, schema, maxRepairs = 2 } = opts;

    // Built fresh per attempt so a fallback starts from a clean conversation,
    // not the primary's failed repair turns.
    const messages: LlmMessage[] = [
      { role: 'system', content: system },
      ...(systemCacheable ? [{ role: 'system' as const, content: systemCacheable, cacheControl: true }] : []),
      { role: 'user', content: user },
    ];

    let lastError = 'unknown error';

    for (let attempt = 0; attempt <= maxRepairs; attempt++) {
      const { content, usage, model: usedModel } = await provider.chatJson(messages, model);

      const parsed = this.tryParse(content);
      if (parsed.ok) {
        const result = schema.safeParse(parsed.value);
        if (result.success) {
          const data = opts.postprocess ? opts.postprocess(result.data) : result.data;
          return { data, model: usedModel, usage };
        }
        lastError = result.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ');
      } else {
        lastError = parsed.error;
      }

      this.logger.warn(`Structured generation attempt ${attempt + 1} invalid: ${lastError}`);
      messages.push({ role: 'assistant', content });
      messages.push({
        role: 'user',
        content:
          `Your previous response was invalid: ${lastError}. ` +
          `Return ONLY corrected JSON that matches the required structure. No prose, no markdown.`,
      });
    }

    throw new Error(
      `LLM failed schema validation after ${maxRepairs + 1} attempts: ${lastError}`,
    );
  }

  private tryParse(
    content: string,
  ): { ok: true; value: unknown } | { ok: false; error: string } {
    const cleaned = content
      .replace(/```json\s*/gi, '')
      .replace(/```/g, '')
      .trim();
    try {
      return { ok: true, value: JSON.parse(cleaned) };
    } catch (e) {
      return { ok: false, error: `Invalid JSON: ${(e as Error).message}` };
    }
  }
}
