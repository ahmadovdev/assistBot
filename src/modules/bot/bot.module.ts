import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { ThemesModule } from '../themes/themes.module';
import { PresentationsModule } from '../presentations/presentations.module';
import { BotService } from './bot.service';
import { SessionService } from './session.service';
import { StartHandler } from './handlers/start.handler';
import { MessageHandler } from './handlers/message.handler';
import { CallbackHandler } from './handlers/callback.handler';

@Module({
  imports: [UsersModule, ThemesModule, PresentationsModule],
  providers: [
    BotService,
    SessionService,
    StartHandler,
    MessageHandler,
    CallbackHandler,
  ],
})
export class BotModule {}
