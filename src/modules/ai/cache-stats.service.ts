import { Injectable, Logger } from '@nestjs/common';

/**
 * Cumulative Anthropic prompt-cache statistics (process-lifetime), so we can
 * see how effective caching is at cutting input-token cost. "Hit rate" =
 * fraction of cacheable input tokens that were served from cache rather than
 * re-sent fresh:  cacheRead / (cacheRead + freshInput).
 *
 * Observability only — a running line is logged periodically and the current
 * snapshot is exposed (e.g. for the /debug command).
 */
@Injectable()
export class CacheStatsService {
  private readonly logger = new Logger('CacheStats');
  private cachedInput = 0; // input tokens served FROM cache (cache_read)
  private freshInput = 0; // input tokens NOT from cache (input_tokens)
  private cacheWrite = 0; // input tokens written TO cache (cache_creation)
  private calls = 0; // provider calls that reported any cache activity

  record(x: { cacheRead: number; cacheWrite: number; freshInput: number }): void {
    this.cachedInput += x.cacheRead;
    this.cacheWrite += x.cacheWrite;
    this.freshInput += x.freshInput;
    if (x.cacheRead > 0 || x.cacheWrite > 0) {
      this.calls += 1;
      // Log the running rate every 10 cache-active calls to avoid log spam.
      if (this.calls % 10 === 0) {
        const s = this.snapshot();
        this.logger.log(
          `Prompt cache hit rate: ${(s.hitRate * 100).toFixed(1)}% ` +
            `(${s.cachedInput} cached / ${s.cachedInput + s.freshInput} input tokens over ${s.calls} calls)`,
        );
      }
    }
  }

  private hitRate(): number {
    const total = this.cachedInput + this.freshInput;
    return total === 0 ? 0 : this.cachedInput / total;
  }

  snapshot(): {
    hitRate: number;
    cachedInput: number;
    freshInput: number;
    cacheWrite: number;
    calls: number;
  } {
    return {
      hitRate: this.hitRate(),
      cachedInput: this.cachedInput,
      freshInput: this.freshInput,
      cacheWrite: this.cacheWrite,
      calls: this.calls,
    };
  }
}
