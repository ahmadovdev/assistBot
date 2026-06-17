import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUES } from '../../infra/queue/queue.constants';
import { CardsJobData } from '../../infra/queue/queue.types';
import { CardService } from './card.service';
import { mapLimit } from './map-limit';
import { PresentationsService } from '../presentations/presentations.service';
import { SlidesService } from '../slides/slides.service';
import { SessionService } from '../bot/session.service';
import { BotSender } from '../bot/bot.sender';
import { BotState } from '../bot/bot.constants';
import { outlineSchema } from '../ai/schemas/outline.schema';

const CARD_CONCURRENCY = 3;

@Processor(QUEUES.CARDS)
export class CardsProcessor extends WorkerHost {
  private readonly logger = new Logger(CardsProcessor.name);

  constructor(
    private readonly cards: CardService,
    private readonly presentations: PresentationsService,
    private readonly slides: SlidesService,
    private readonly session: SessionService,
    private readonly sender: BotSender,
  ) {
    super();
  }

  async process(job: Job<CardsJobData>): Promise<void> {
    const { presentationId } = job.data;
    const presentation = await this.presentations.findByIdWithUser(presentationId);
    if (!presentation) {
      this.logger.warn(`Presentation ${presentationId} not found`);
      return;
    }

    const chatId = Number(presentation.user.telegramId);

    try {
      const outline = outlineSchema.parse(presentation.outline);
      const total = outline.slides.length;

      await this.presentations.setStatus(presentationId, 'generating');
      await this.sender.sendMessage(chatId, `\u23F3 ${total} ta slayd tayyorlanmoqda...`);

      const results = await mapLimit(outline.slides, CARD_CONCURRENCY, (slide) =>
        this.cards.generate({
          deckTitle: outline.deck_title,
          topic: presentation.topicPrompt,
          language: presentation.language,
          tone: presentation.tone,
          totalSlides: total,
          position: slide.position,
          title: slide.title,
          keyPoints: slide.key_points,
          layout: slide.layout,
        }),
      );

      await this.slides.replaceAll(
        presentationId,
        outline.slides.map((slide, i) => ({
          position: slide.position,
          layout: slide.layout,
          content: results[i].data,
        })),
      );

      const tokens = results.reduce((sum, r) => sum + r.usage.totalTokens, 0);
      await this.presentations.recordJob(presentationId, {
        stage: 'cards',
        status: 'completed',
        modelUsed: results[0]?.model,
        tokensUsed: tokens,
      });

      await this.session.setState(presentation.userId, BotState.IDLE);
      await this.sender.sendMessage(
        chatId,
        `\u2705 ${total} ta slayd tayyor! (Keyingi bosqich \u2014 PDF render, Faza 5)`,
      );
    } catch (err) {
      this.logger.error(`Card generation failed for ${presentationId}: ${String(err)}`);
      await this.presentations.setStatus(presentationId, 'failed', String(err));
      await this.presentations.recordJob(presentationId, { stage: 'cards', status: 'failed' });
      await this.session.setState(presentation.userId, BotState.IDLE);
      await this.sender.sendMessage(
        chatId,
        "\u274C Slaydlar tayyorlashda xatolik. /start orqali qayta urinib ko'ring.",
      );
    }
  }
}
