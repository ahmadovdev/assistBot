import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiModule } from '../ai/ai.module';
import { BotModule } from '../bot/bot.module';
import { PresentationsModule } from '../presentations/presentations.module';
import { QUEUES } from '../../infra/queue/queue.constants';
import { OutlineService } from './outline.service';
import { OutlineProcessor } from './outline.processor';

@Module({
  imports: [
    AiModule,
    BotModule,
    PresentationsModule,
    BullModule.registerQueue({ name: QUEUES.OUTLINE }),
  ],
  providers: [OutlineService, OutlineProcessor],
})
export class GenerationModule {}
