import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BotModule } from '../bot/bot.module';
import { PresentationsModule } from '../presentations/presentations.module';
import { QUEUES } from '../../infra/queue/queue.constants';
import { BrowserService } from './browser.service';
import { RenderService } from './render.service';
import { RenderProcessor } from './render.processor';

@Module({
  imports: [
    BotModule,
    PresentationsModule,
    BullModule.registerQueue({ name: QUEUES.RENDER }),
  ],
  providers: [BrowserService, RenderService, RenderProcessor],
})
export class RenderModule {}
