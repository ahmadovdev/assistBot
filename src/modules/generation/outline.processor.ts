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
import { RateLimitService } from '../ratelimit/rate-limit.service';
import { formatOutline, outlineConfirmKeyboard } from './outline.formatter';
import { estimateCostUsd } from '../ai/model-pricing';
import { LONG_PRESENTATION_JOB_OPTIONS } from '../../infra/queue/worker-options';

@Processor(QUEUES.OUTLINE, LONG_PRESENTATION_JOB_OPTIONS)
export class OutlineProcessor extends WorkerHost {
  private readonly logger = new Logger(OutlineProcessor.name);

  constructor(
    private readonly outline: OutlineService,
    private readonly presentations: PresentationsService,
    private readonly session: SessionService,
    private readonly sender: BotSender,
    private readonly rateLimit: RateLimitService,
  ) {
    super();
  }

  async process(job: Job<OutlineJobData>): Promise<void> {
    const { presentationId } = job.data;
    await job.updateProgress({ stage: 'outline_loading', presentationId });
    const presentation = await this.presentations.findByIdWithUser(presentationId);
    if (!presentation) {
      this.logger.warn(`Presentation ${presentationId} not found`);
      return;
    }

    const chatId = Number(presentation.user.telegramId);

    try {
      this.logger.log(`Outline job ${job.id} started for presentation ${presentationId}`);
      await job.updateProgress({ stage: 'outline_started', presentationId });
      await this.presentations.setStatus(presentationId, 'outlining');

      await job.updateProgress({ stage: 'outline_ai_request', presentationId });
      const result = await this.outline.generate({
        topic: presentation.topicPrompt,
        slideCount: presentation.slideCount,
        language: presentation.language,
      });
      await job.updateProgress({
        stage: 'outline_ai_done',
        presentationId,
        tokens: result.usage.totalTokens,
      });

      await this.presentations.saveOutline(presentationId, result.data);
      await job.updateProgress({ stage: 'outline_saved', presentationId });
      await this.presentations.recordJob(presentationId, {
        stage: 'outline',
        status: 'completed',
        modelUsed: result.model,
        tokensUsed: result.usage.totalTokens,
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        costUsd: result.costUsd ?? estimateCostUsd(result.model, result.usage),
      });

      await this.session.setState(presentation.userId, BotState.AWAITING_OUTLINE_CONFIRM);
      await this.sender.sendMessage(
        chatId,
        formatOutline(result.data),
        outlineConfirmKeyboard(),
      );
      await job.updateProgress({ stage: 'outline_done', presentationId });
      this.logger.log(`Outline job ${job.id} completed for presentation ${presentationId}`);
    } catch (err) {
      await job.updateProgress({ stage: 'outline_failed', presentationId, error: String(err).slice(0, 180) });
      this.logger.error(`Outline generation failed for ${presentationId}: ${String(err)}`);

      await this.presentations.setStatus(presentationId, 'failed', String(err));
      await this.presentations.recordJob(presentationId, {
        stage: 'outline',
        status: 'failed',
      });
      // Pipeline failed before it produced anything — free the slot and refund.
      await this.rateLimit.finishGeneration(presentation.userId, { refund: true });
      await this.session.setState(presentation.userId, BotState.IDLE);
      await this.sender.sendMessage(
        chatId,
        outlineFailureMessage(err),
      );
    }
  }
}

function isTransientAiError(err: unknown): boolean {
  const message = String(err);
  return /HTTP (429|500|502|503|504)|high demand|rate.?limit|quota exceeded|UNAVAILABLE/i.test(message);
}

function isProviderCreditError(err: unknown): boolean {
  return /credit balance is too low|purchase credits|billing/i.test(String(err));
}

function outlineFailureMessage(err: unknown): string {
  if (isProviderCreditError(err)) {
    return '❌ AI provayder balansi/limiti sabab reja tayyorlanmadi. Iltimos, keyinroq qayta urinib ko‘ring.';
  }
  if (isTransientAiError(err)) {
    return '❌ AI xizmati hozir band yoki limitga tushgan. Bir necha daqiqadan keyin /start orqali qayta urinib ko‘ring.';
  }
  return "❌ Reja tayyorlashda xatolik yuz berdi. /start orqali qayta urinib ko'ring.";
}
