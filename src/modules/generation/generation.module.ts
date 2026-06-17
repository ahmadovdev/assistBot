import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiModule } from '../ai/ai.module';
import { BotModule } from '../bot/bot.module';
import { PresentationsModule } from '../presentations/presentations.module';
import { SlidesModule } from '../slides/slides.module';
import { QUEUES } from '../../infra/queue/queue.constants';
import { OutlineService } from './outline.service';
import { OutlineProcessor } from './outline.processor';
import { CardService } from './card.service';
import { CardsProcessor } from './cards.processor';

@Module({
  imports: [
    AiModule,
    BotModule,
    PresentationsModule,
    SlidesModule,
    BullModule.registerQueue({ name: QUEUES.OUTLINE }, { name: QUEUES.CARDS }),
  ],
  providers: [OutlineService, OutlineProcessor, CardService, CardsProcessor],
})
export class GenerationModule {}
