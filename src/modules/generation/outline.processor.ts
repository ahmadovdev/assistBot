import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUES } from '../../infra/queue/queue.constants';
import { OutlineJobData } from '../../infra/queue/queue.types';
import { OutlineService } from './outline.service';
import { PresentationsService } from '../presentations/presentations.service';
import { SessionService } from '../bot/session.service';
import { BotSender } from '../bot/bot.sender';
import { BotState } from '../bot/bot.constants';
import { formatOutline, outlineConfirmKeyboard } from './outline.formatter';

@Processor(QUEUES.OUTLINE)
export class OutlineProcessor extends WorkerHost {
  private readonly logger = new Logger(OutlineProcessor.name);

  constructor(
    private readonly outline: OutlineService,
    private readonly presentations: PresentationsService,
    private readonly session: SessionService,
    private readonly sender: BotSender,
  ) {
    super();
  }

  async process(job: Job<OutlineJobData>): Promise<void> {
    const { presentationId } = job.data;
    const presentation = await this.presentations.findByIdWithUser(presentationId);
    if (!presentation) {
      this.logger.warn(`Presentation ${presentationId} not found`);
      return;
    }

    const chatId = Number(presentation.user.telegramId);

    try {
      await this.presentations.setStatus(presentationId, 'outlining');

      const result = await this.outline.generate({
        topic: presentation.topicPrompt,
        slideCount: presentation.slideCount,
        language: presentation.language,
        tone: presentation.tone,
      });

      await this.presentations.saveOutline(presentationId, result.data);
      await this.presentations.recordJob(presentationId, {
        stage: 'outline',
        status: 'completed',
        modelUsed: result.model,
        tokensUsed: result.usage.totalTokens,
      });

      await this.session.setState(presentation.userId, BotState.AWAITING_OUTLINE_CONFIRM);
      await this.sender.sendMessage(
        chatId,
        formatOutline(result.data),
        outlineConfirmKeyboard(),
      );
    } catch (err) {
      this.logger.error(`Outline generation failed for ${presentationId}: ${String(err)}`);
      await this.presentations.setStatus(presentationId, 'failed', String(err));
      await this.presentations.recordJob(presentationId, {
        stage: 'outline',
        status: 'failed',
      });
      await this.session.setState(presentation.userId, BotState.IDLE);
      await this.sender.sendMessage(
        chatId,
        "\u274C Reja tayyorlashda xatolik yuz berdi. /start orqali qayta urinib ko'ring.",
      );
    }
  }
}
