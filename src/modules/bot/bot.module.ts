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
import { DebugHandler } from './handlers/debug.handler';
import { HelpHandler } from './handlers/help.handler';
import { HistoryHandler } from './handlers/history.handler';
import { OutlineEditHandler } from './handlers/outline-edit.handler';
import { TestSlideHandler } from './handlers/testslide.handler';
import { FullTypesHandler } from './handlers/fulltypes.handler';
import { BrowserService } from '../render/browser.service';
import { RenderService } from '../render/render.service';

@Module({
  imports: [
    UsersModule,
    ThemesModule,
    PresentationsModule,
    BullModule.registerQueue({ name: QUEUES.OUTLINE }, { name: QUEUES.CARDS }),
  ],
  providers: [
    botProvider,
    BotService,
    BotSender,
    SessionService,
    StartHandler,
    MessageHandler,
    CallbackHandler,
    DebugHandler,
    HelpHandler,
    HistoryHandler,
    OutlineEditHandler,
    // /testslide (admin-only debug command) — its own isolated Browser +
    // Render instances, deliberately NOT sharing RenderModule's/
    // GenerationModule's, since both of those already import BotModule and
    // importing them back here would create a circular module graph. The
    // extra idle Puppeteer instance is an acceptable cost for a debug tool.
    TestSlideHandler,
    FullTypesHandler,
    BrowserService,
    RenderService,
  ],
  exports: [BotSender, SessionService],
})
export class BotModule {}
