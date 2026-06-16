import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { BotService } from './bot.service';
import { SessionService } from './session.service';
import { StartHandler } from './handlers/start.handler';
import { MessageHandler } from './handlers/message.handler';

@Module({
  imports: [UsersModule],
  providers: [BotService, SessionService, StartHandler, MessageHandler],
})
export class BotModule {}
