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
import { BriefService } from './brief.service';
import { WikimediaService } from '../visuals/wikimedia.service';
import { VisualValidatorService } from '../visuals/visual-validator.service';
import { ImageScriptGuardService } from '../visuals/image-script-guard.service';
import { TopicVisualService } from '../visuals/topic-visual.service';
import { runsWorkers } from '../../common/config/role';

// BullMQ processors attach workers that consume jobs — only register them in
// processes that should run workers ('all'/'worker'), never in the bot process.
const processors = runsWorkers() ? [OutlineProcessor, CardsProcessor] : [];

@Module({
  imports: [
    AiModule,
    BotModule,
    PresentationsModule,
    SlidesModule,
    BullModule.registerQueue(
      { name: QUEUES.OUTLINE },
      { name: QUEUES.CARDS },
      { name: QUEUES.RENDER },
    ),
  ],
  providers: [
    OutlineService,
    CardService,
    BriefService,
    TopicVisualService,
    WikimediaService,
    VisualValidatorService,
    ImageScriptGuardService,
    ...processors,
  ],
})
export class GenerationModule {}
