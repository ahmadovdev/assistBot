import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { AppConfigModule } from './common/config/config.module';
import { PrismaModule } from './infra/prisma/prisma.module';
import { QueueModule } from './infra/queue/queue.module';
import { UsersModule } from './modules/users/users.module';
import { BotModule } from './modules/bot/bot.module';
import { AiModule } from './modules/ai/ai.module';
import { GenerationModule } from './modules/generation/generation.module';

@Module({
  imports: [
    // --- Foundation (Phase 0) ---
    AppConfigModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
      },
    }),
    PrismaModule,
    QueueModule,

    // --- Feature modules ---
    UsersModule, // Phase 1
    BotModule, // Phase 1-2
    AiModule, // Phase 3
    GenerationModule, // Phase 3
    // RenderModule,         // Phase 5
    // StorageModule,        // Phase 6
  ],
})
export class AppModule {}
