import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { UsersModule } from '../users/users.module';
import { ThemesModule } from '../themes/themes.module';
import { PresentationsModule } from '../presentations/presentations.module';
import { QUEUES } from '../../infra/queue/queue.constants';
import { botProvider } from './bot.provider';
import { BotService } from './bot.service';
import { BotSender } from './bot.sender';
import { SessionService } from './session.service';
import { StartHandler } from './handlers/start.handler';
import { MessageHandler } from './handlers/message.handler';
import { CallbackHandler } from './handlers/callback.handler';

@Module({
  imports: [
    UsersModule,
    ThemesModule,
    PresentationsModule,
    BullModule.registerQueue({ name: QUEUES.OUTLINE }),
  ],
  providers: [
    botProvider,
    BotService,
    BotSender,
    SessionService,
    StartHandler,
    MessageHandler,
    CallbackHandler,
  ],
  exports: [BotSender, SessionService],
})
export class BotModule {}
