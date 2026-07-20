import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS } from '../../infra/redis/redis.module';

export type StartDecision =
  | { allowed: true; used: number; limit: number; unlimited?: true }
  | { allowed: false; reason: 'daily'; used: number; limit: number; resetsAt: Date }
  | { allowed: false; reason: 'inflight' }
  | { allowed: false; reason: 'busy'; active: number; limit: number };

/**
 * Per-user rate limiting for the expensive generation pipeline (each run costs
 * real LLM + render resources). Three independent guards, enforced atomically:
 *
 *  1. Daily quota  — at most `daily` generations per user per UTC day.
 *  2. Global slot — at most N active generation pipelines on this server.
 *  3. In-flight lock — at most ONE active generation per user at a time, so a
 *     single user can't flood the (shared) worker with a burst of jobs.
 *
 * Both live in Redis so the limits hold across the bot/worker process split.
 */
@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly enabled: boolean;
  private readonly daily: number;
  private readonly lockTtlSec: number;
  private readonly globalConcurrency: number;
  private readonly adminTelegramIds: Set<string>;

  // Atomic "try to start a generation": checks the per-user lock, reserves a
  // global slot, then charges daily quota for non-admins. Returns [status, used].
  private static readonly START_LUA = `
    if redis.call('EXISTS', KEYS[1]) == 1 then
      return {'inflight', 0}
    end

    local active = redis.call('INCR', KEYS[3])
    if active == 1 then
      redis.call('EXPIRE', KEYS[3], ARGV[4])
    end
    if active > tonumber(ARGV[2]) then
      redis.call('DECR', KEYS[3])
      return {'busy', active - 1}
    end

    if ARGV[5] == '1' then
      redis.call('SET', KEYS[1], 'admin', 'EX', ARGV[4])
      return {'ok_admin', 0}
    end

    local used = redis.call('INCR', KEYS[2])
    if used == 1 then
      redis.call('EXPIRE', KEYS[2], ARGV[3])
    end
    if used > tonumber(ARGV[1]) then
      redis.call('DECR', KEYS[2])
      redis.call('DECR', KEYS[3])
      return {'daily', used - 1}
    end
    redis.call('SET', KEYS[1], 'standard', 'EX', ARGV[4])
    return {'ok', used}
  `;

  // Release the in-flight lock; optionally refund one daily unit (floor 0) when
  // the pipeline failed through no fault of the user.
  private static readonly FINISH_LUA = `
    local lock_kind = redis.call('GET', KEYS[1])
    local released = redis.call('DEL', KEYS[1])
    if released == 1 then
      local active = redis.call('DECR', KEYS[3])
      if tonumber(active) < 0 then redis.call('SET', KEYS[3], '0') end
    end
    if ARGV[1] == '1' and lock_kind ~= 'admin' then
      local v = redis.call('DECR', KEYS[2])
      if tonumber(v) < 0 then redis.call('SET', KEYS[2], '0') end
    end
    return 1
  `;

  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    config: ConfigService,
  ) {
    this.enabled = config.get<boolean>('app.rateLimit.enabled') ?? true;
    this.daily = config.get<number>('app.rateLimit.daily') ?? 10;
    this.lockTtlSec = config.get<number>('app.rateLimit.lockTtlSec') ?? 1800;
    this.globalConcurrency = config.get<number>('app.rateLimit.globalConcurrency') ?? 1;
    this.adminTelegramIds = new Set(config.get<string[]>('app.admin.telegramIds') ?? []);
  }

  private inflightKey(userId: bigint): string {
    return `lumio:inflight:${userId}`;
  }

  private dailyKey(userId: bigint): string {
    return `lumio:quota:${userId}:${new Date().toISOString().slice(0, 10)}`;
  }

  private globalActiveKey(): string {
    return 'lumio:generation:active';
  }

  /**
   * Attempt to start a generation for a user. On success the caller MUST later
   * call {@link finishGeneration}. Fails open (allows) on an unexpected Redis
   * error — Redis being down already breaks the whole pipeline downstream, so
   * blocking here adds nothing but hides the real outage.
   */
  async startGeneration(userId: bigint, telegramId?: bigint): Promise<StartDecision> {
    if (!this.enabled) return { allowed: true, used: 0, limit: this.daily };
    const isAdmin = telegramId !== undefined && this.adminTelegramIds.has(String(telegramId));
    try {
      const res = (await this.redis.eval(
        RateLimitService.START_LUA,
        3,
        this.inflightKey(userId),
        this.dailyKey(userId),
        this.globalActiveKey(),
        String(this.daily),
        String(this.globalConcurrency),
        String(90_000), // daily-counter TTL: >24h so the dated key self-cleans
        String(this.lockTtlSec),
        isAdmin ? '1' : '0',
      )) as [string, number];

      const [status, used] = res;
      if (status === 'ok_admin') {
        return { allowed: true, used: 0, limit: this.daily, unlimited: true };
      }
      if (status === 'ok') return { allowed: true, used, limit: this.daily };
      if (status === 'inflight') return { allowed: false, reason: 'inflight' };
      if (status === 'busy') return { allowed: false, reason: 'busy', active: used, limit: this.globalConcurrency };
      return { allowed: false, reason: 'daily', used, limit: this.daily, resetsAt: nextUtcMidnight() };
    } catch (err) {
      this.logger.error(`Rate-limit check failed (allowing): ${String(err)}`);
      return { allowed: true, used: 0, limit: this.daily };
    }
  }

  /**
   * Release a user's generation slot. Call on every terminal outcome.
   * @param refund true when the pipeline failed (don't burn the user's quota).
   */
  async finishGeneration(userId: bigint, opts: { refund: boolean }): Promise<void> {
    if (!this.enabled) return;
    try {
      await this.redis.eval(
        RateLimitService.FINISH_LUA,
        3,
        this.inflightKey(userId),
        this.dailyKey(userId),
        this.globalActiveKey(),
        opts.refund ? '1' : '0',
      );
    } catch (err) {
      // Best-effort: the lock has a TTL and will self-heal.
      this.logger.warn(`Rate-limit release failed for ${userId}: ${String(err)}`);
    }
  }
}

/** Start of the next UTC day — used to tell the user when their quota resets. */
function nextUtcMidnight(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
}
