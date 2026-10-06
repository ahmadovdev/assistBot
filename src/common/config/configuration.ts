import { validateEnv } from './env.validation';

export type AppRole = 'all' | 'bot' | 'worker';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  role: AppRole;
  admin: { telegramIds: string[] };
  rateLimit: { enabled: boolean; daily: number; lockTtlSec: number; globalConcurrency: number };
  database: { url: string };
  redis: { host: string; port: number; password?: string };
  telegram: { botToken: string };
  ai: {
    provider: 'anthropic' | 'openrouter' | 'gemini';
    openrouterApiKey?: string;
    anthropicApiKey?: string;
    geminiApiKey?: string;
    falApiKey?: string;
    outlineModel: string;
    cardModel: string;
    responseCache: { enabled: boolean; ttlSec: number };
    requestTimeoutMs: number;
  };
  render: {
    puppeteerExecutablePath?: string;
    engine: 'legacy' | 'academic';
  };
  visuals: { wikimediaUserAgent: string; timeoutMs: number };
  storage: { endpoint?: string; accessKey?: string; secretKey?: string; bucket: string };
  imageLab: { token?: string };
}

/**
 * Builds a strongly-typed, nested config object from validated env vars.
 * Access via ConfigService, e.g. config.get('app.redis.host').
 */
export function configuration(): { app: AppConfig } {
  const env = validateEnv(process.env);
  const adminTelegramIds = Array.from(new Set([
    ...env.ADMIN_TELEGRAM_IDS.split(',').map((id) => id.trim()).filter(Boolean),
    ...(env.TESTSLIDE_ADMIN_ID ? [env.TESTSLIDE_ADMIN_ID] : []),
  ]));
  return {
    app: {
      nodeEnv: env.NODE_ENV,
      port: env.PORT,
      role: env.APP_ROLE,
      admin: { telegramIds: adminTelegramIds },
      rateLimit: {
        enabled: env.RATE_LIMIT_ENABLED,
        daily: env.RATE_LIMIT_DAILY,
        lockTtlSec: env.GENERATION_LOCK_TTL_SEC,
        globalConcurrency: env.GENERATION_GLOBAL_CONCURRENCY,
      },
      database: { url: env.DATABASE_URL },
      redis: { host: env.REDIS_HOST, port: env.REDIS_PORT, password: env.REDIS_PASSWORD },
      telegram: { botToken: env.TELEGRAM_BOT_TOKEN },
      ai: {
        provider: env.AI_PROVIDER,
        openrouterApiKey: env.OPENROUTER_API_KEY,
        anthropicApiKey: env.ANTHROPIC_API_KEY,
        geminiApiKey: env.GEMINI_API_KEY,
        falApiKey: env.FAL_API_KEY,
        outlineModel: env.AI_OUTLINE_MODEL,
        cardModel: env.AI_CARD_MODEL,
        responseCache: {
          enabled: env.AI_RESPONSE_CACHE_ENABLED,
          ttlSec: env.AI_RESPONSE_CACHE_TTL_SEC,
        },
        requestTimeoutMs: env.AI_REQUEST_TIMEOUT_MS,
      },
      render: {
        puppeteerExecutablePath: env.PUPPETEER_EXECUTABLE_PATH,
        engine: env.RENDER_ENGINE,
      },
      visuals: {
        wikimediaUserAgent: env.WIKIMEDIA_USER_AGENT,
        timeoutMs: env.WIKIMEDIA_TIMEOUT_MS,
      },
      storage: {
        endpoint: env.S3_ENDPOINT,
        accessKey: env.S3_ACCESS_KEY,
        secretKey: env.S3_SECRET_KEY,
        bucket: env.S3_BUCKET,
      },
      imageLab: { token: env.IMAGE_LAB_TOKEN },
    },
  };
}
