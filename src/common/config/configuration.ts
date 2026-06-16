import { validateEnv } from './env.validation';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  database: { url: string };
  redis: { host: string; port: number; password?: string };
  telegram: { botToken: string };
  ai: { openrouterApiKey?: string; anthropicApiKey?: string; falApiKey?: string };
  storage: { endpoint?: string; accessKey?: string; secretKey?: string; bucket: string };
}

/**
 * Builds a strongly-typed, nested config object from validated env vars.
 * Access via ConfigService, e.g. config.get('app.redis.host').
 */
export function configuration(): { app: AppConfig } {
  const env = validateEnv(process.env);
  return {
    app: {
      nodeEnv: env.NODE_ENV,
      port: env.PORT,
      database: { url: env.DATABASE_URL },
      redis: { host: env.REDIS_HOST, port: env.REDIS_PORT, password: env.REDIS_PASSWORD },
      telegram: { botToken: env.TELEGRAM_BOT_TOKEN },
      ai: {
        openrouterApiKey: env.OPENROUTER_API_KEY,
        anthropicApiKey: env.ANTHROPIC_API_KEY,
        falApiKey: env.FAL_API_KEY,
      },
      storage: {
        endpoint: env.S3_ENDPOINT,
        accessKey: env.S3_ACCESS_KEY,
        secretKey: env.S3_SECRET_KEY,
        bucket: env.S3_BUCKET,
      },
    },
  };
}
