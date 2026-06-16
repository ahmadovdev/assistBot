import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { AppConfigModule } from './common/config/config.module';
import { PrismaModule } from './infra/prisma/prisma.module';
import { QueueModule } from './infra/queue/queue.module';
import { UsersModule } from './modules/users/users.module';
import { BotModule } from './modules/bot/bot.module';

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
    BotModule, // Phase 1
    // AiModule,             // Phase 3
    // PresentationModule,   // Phase 3-4
    // RenderModule,         // Phase 5
    // StorageModule,        // Phase 6
  ],
})
export class AppModule {}
