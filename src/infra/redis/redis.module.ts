import { Global, Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/** DI token for the shared ioredis client (separate from BullMQ's own pool). */
export const REDIS = Symbol('REDIS');

const redisProvider: Provider = {
  provide: REDIS,
  inject: [ConfigService],
  useFactory: (config: ConfigService): Redis => {
    return new Redis({
      host: config.get<string>('app.redis.host'),
      port: config.get<number>('app.redis.port'),
      password: config.get<string>('app.redis.password'),
      // Fail fast instead of buffering commands forever if Redis is down —
      // a rate-limit check must never hang the request path.
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: false,
    });
  },
};

/**
 * Provides a plain ioredis client for app-level use (rate limiting, locks).
 * Global so any feature module can inject `@Inject(REDIS)` without re-importing.
 */
@Global()
@Module({
  providers: [redisProvider],
  exports: [REDIS],
})
export class RedisModule {}
