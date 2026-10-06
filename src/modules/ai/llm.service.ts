import { createHash } from 'node:crypto';
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { ZodType } from 'zod';
import { REDIS } from '../../infra/redis/redis.module';
import { estimateCostUsd } from './model-pricing';
import {
  LlmMessage,
  LlmProvider,
  LlmResult,
  LLM_PROVIDER,
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
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly responseCacheEnabled: boolean;
  private readonly responseCacheTtlSec: number;

  constructor(
    @Inject(LLM_PROVIDER) private readonly provider: LlmProvider,
    @Optional() @Inject(REDIS) private readonly redis: Redis | null = null,
    @Optional() private readonly config?: ConfigService,
  ) {
    this.responseCacheEnabled = this.config?.get<boolean>('app.ai.responseCache.enabled') ?? true;
    this.responseCacheTtlSec = this.config?.get<number>('app.ai.responseCache.ttlSec') ?? 7 * 24 * 60 * 60;
  }

  /** One model call, one JSON parse, and one schema-contract parse. */
  async generateStructured<T>(opts: GenerateStructuredOptions<T>): Promise<LlmResult<T>> {
    const cacheKey = this.cacheKey(opts.model, opts);
    const cached = await this.readResponseCache(cacheKey, opts.schema);
    if (cached) return cached;

    const messages: LlmMessage[] = [
      { role: 'system', content: opts.system },
      ...(opts.systemCacheable
        ? [{ role: 'system' as const, content: opts.systemCacheable, cacheControl: true }]
        : []),
      { role: 'user', content: opts.user },
    ];
    const response = await this.provider.chatJson(messages, opts.model);
    const parsed = this.tryParse(response.content);
    if (!parsed.ok) {
      throw new Error(`LLM returned invalid JSON: ${parsed.error}`);
    }
    const validated = opts.schema.safeParse(parsed.value);
    if (!validated.success) {
      const issues = validated.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');
      throw new Error(`LLM response does not match the slide contract: ${issues}`);
    }

    const result: LlmResult<T> = {
      data: validated.data,
      model: response.model,
      usage: response.usage,
      costUsd:
        estimateCostUsd(response.model, response.usage) ??
        estimateCostUsd(opts.model, response.usage),
    };
    await this.writeResponseCache(cacheKey, result);
    return result;
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

  private cacheKey<T>(model: string, opts: GenerateStructuredOptions<T>): string {
    const payload = JSON.stringify({
      v: 1,
      provider: this.provider.constructor.name,
      model,
      system: opts.system,
      systemCacheable: opts.systemCacheable ?? '',
      user: opts.user,
    });
    return `lumio:ai-response:${createHash('sha256').update(payload).digest('hex')}`;
  }

  private async readResponseCache<T>(
    key: string,
    schema: ZodType<T, any, any>,
  ): Promise<LlmResult<T> | undefined> {
    if (!this.responseCacheEnabled || !this.redis) return undefined;
    try {
      const raw = await this.redis.get(key);
      if (!raw) return undefined;
      const cached = JSON.parse(raw) as { data: unknown; model: string };
      const parsed = schema.safeParse(cached.data);
      if (!parsed.success) {
        await this.redis.del(key);
        return undefined;
      }
      this.logger.debug(`AI response cache hit: model=${cached.model}`);
      return {
        data: parsed.data,
        model: cached.model,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      };
    } catch (err) {
      this.logger.warn(`AI response cache read failed: ${String(err)}`);
      return undefined;
    }
  }

  private async writeResponseCache<T>(key: string, result: LlmResult<T>): Promise<void> {
    if (!this.responseCacheEnabled || !this.redis || this.responseCacheTtlSec <= 0) return;
    try {
      await this.redis.set(
        key,
        JSON.stringify({ data: result.data, model: result.model }),
        'EX',
        this.responseCacheTtlSec,
      );
    } catch (err) {
      this.logger.warn(`AI response cache write failed: ${String(err)}`);
    }
  }
}
