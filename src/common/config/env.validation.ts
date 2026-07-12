import { z } from 'zod';

/**
 * Single source of truth for all environment variables.
 * Validated once at boot — the app refuses to start with a bad/missing var.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  // Process role for the bot/worker split. 'all' (default) runs everything in
  // one process (dev / current behaviour). In production run two PM2 apps:
  // one 'bot' (Telegram long-polling + enqueues jobs) and one 'worker' (runs
  // the BullMQ processors) so a heavy render can never freeze the bot.
  APP_ROLE: z.enum(['all', 'bot', 'worker']).default('all'),

  // Per-user rate limiting (cost + abuse protection on a public bot).
  RATE_LIMIT_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  // Max completed/attempted generations per user per calendar day (UTC).
  RATE_LIMIT_DAILY: z.coerce.number().int().positive().default(10),
  // Safety TTL (seconds) on the per-user "generation in progress" lock, so a
  // crashed pipeline self-heals even if the explicit release is missed.
  GENERATION_LOCK_TTL_SEC: z.coerce.number().int().positive().default(1800),

  // PostgreSQL
  DATABASE_URL: z.string().url(),

  // Redis (BullMQ)
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().min(1, 'TELEGRAM_BOT_TOKEN is required'),

  // AI providers (optional until the relevant phase)
  AI_PROVIDER: z.enum(['anthropic', 'openrouter', 'gemini']).default('anthropic'),
  AI_OUTLINE_MODEL: z.string().default('claude-sonnet-4-6'),
  AI_CARD_MODEL: z.string().default('claude-sonnet-4-6'),
  // Automatic failover: if the primary provider errors or can't produce valid
  // output, retry once with this provider+model (e.g. Claude -> Gemini). Also
  // keeps the bot alive if the primary provider has an outage. 'none' = off.
  AI_FALLBACK_PROVIDER: z.enum(['none', 'anthropic', 'openrouter', 'gemini']).default('none'),
  AI_FALLBACK_MODEL: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  FAL_API_KEY: z.string().optional(),

  // Render
  PUPPETEER_EXECUTABLE_PATH: z.string().optional(),
  // Rendering engine: 'legacy' (default, existing 5 themes) or 'academic'
  // (new modern_academic HTML renderer). Off by default — nothing changes.
  RENDER_ENGINE: z.enum(['legacy', 'academic']).default('legacy'),

  // Wikimedia Commons visual layer. A product URL in User-Agent satisfies
  // Wikimedia's identification policy without requiring an API key.
  WIKIMEDIA_USER_AGENT: z.string().min(10).default(
    'LumioPresentationBot/1.0 (https://t.me/LumioApp_bot)',
  ),
  WIKIMEDIA_TIMEOUT_MS: z.coerce.number().int().min(1000).max(30000).default(8000),

  // Storage (MinIO / S3) — used from Phase 6
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_BUCKET: z.string().default('presentations'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`\u274c Invalid environment variables:\n${issues}`);
  }
  return parsed.data;
}
