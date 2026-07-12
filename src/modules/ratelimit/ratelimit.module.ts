import { Global, Module } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';

/**
 * Rate limiting is used by both the bot (enforce at generation start) and the
 * workers (release the slot at terminal stages), so it's global.
 * Backed by the global RedisModule client.
 */
@Global()
@Module({
  providers: [RateLimitService],
  exports: [RateLimitService],
})
export class RateLimitModule {}
