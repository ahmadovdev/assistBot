import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUES } from '../../infra/queue/queue.constants';
import { RenderJobData } from '../../infra/queue/queue.types';
import { RenderService } from './render.service';
import { PresentationsService } from '../presentations/presentations.service';
import { SessionService } from '../bot/session.service';
import { BotSender } from '../bot/bot.sender';
import { BotState } from '../bot/bot.constants';
import { RateLimitService } from '../ratelimit/rate-limit.service';
import { LONG_PRESENTATION_JOB_OPTIONS } from '../../infra/queue/worker-options';

@Processor(QUEUES.RENDER, LONG_PRESENTATION_JOB_OPTIONS)
export class RenderProcessor extends WorkerHost {
  private readonly logger = new Logger(RenderProcessor.name);

  constructor(
    private readonly render: RenderService,
    private readonly presentations: PresentationsService,
    private readonly session: SessionService,
    private readonly sender: BotSender,
    private readonly rateLimit: RateLimitService,
  ) {
    super();
  }

  async process(job: Job<RenderJobData>): Promise<void> {
    const { presentationId } = job.data;
    await job.updateProgress({ stage: 'render_loading', presentationId });
    const p = await this.presentations.findByIdForRender(presentationId);
    if (!p) {
      this.logger.warn(`Presentation ${presentationId} not found`);
      return;
    }
    const chatId = Number(p.user.telegramId);

    try {
      this.logger.log(`Render job ${job.id} started for presentation ${presentationId}`);
      await job.updateProgress({ stage: 'render_started', presentationId });
      await this.presentations.setStatus(presentationId, 'rendering');
      await this.sender.sendMessage(chatId, '\u23F3 PDF va PowerPoint tayyorlanmoqda...');

      const slides = p.slides.map((s: { position: number; layout: string; content: unknown }) => ({
        position: s.position,
        type: s.layout,
        content: s.content,
      }));
      const themeId = p.theme?.key ?? 'dark_premium';
      const base = (p.title ?? 'taqdimot').slice(0, 40).replace(/[^\w\-]+/g, '_');
      const renderSlides = slides;

      // --- PDF ---
      await job.updateProgress({ stage: 'pdf_rendering', presentationId });
      const pdf = await this.render.renderPdf(themeId, renderSlides);
      await job.updateProgress({ stage: 'pdf_sending', presentationId, bytes: pdf.length });
      const pdfMsg = await this.sender.sendDocument(
        chatId,
        pdf,
        `${base}.pdf`,
        '\u2705 PDF tayyor!',
      );
      await this.presentations.recordExport(presentationId, {
        format: 'pdf',
        storageKey: pdfMsg.document?.file_id ?? 'telegram',
        telegramFileId: pdfMsg.document?.file_id,
        fileSize: pdf.length,
      });
      await job.updateProgress({ stage: 'pdf_done', presentationId, bytes: pdf.length });

      // --- PPTX (same source data and selected template as PDF) ---
      await job.updateProgress({ stage: 'pptx_rendering', presentationId });
      const pptx = await this.render.renderPptx(themeId, renderSlides, { debug: true });
      if (pptx.warnings.length) {
        this.logger.warn(`PPTX (${pptx.mode}) warnings for ${presentationId}: ${pptx.warnings.join('; ')}`);
      }
      const caption = '\u2705 PowerPoint tayyor!';
      await job.updateProgress({ stage: 'pptx_sending', presentationId, mode: pptx.mode, bytes: pptx.buffer.length });
      const pptxMsg = await this.sender.sendDocument(chatId, pptx.buffer, `${base}.pptx`, caption);
      await this.presentations.recordExport(presentationId, {
        format: 'pptx',
        storageKey: pptxMsg.document?.file_id ?? 'telegram',
        telegramFileId: pptxMsg.document?.file_id,
        fileSize: pptx.buffer.length,
      });
      await job.updateProgress({ stage: 'pptx_done', presentationId, mode: pptx.mode, bytes: pptx.buffer.length });

      await this.presentations.setStatus(presentationId, 'done');
      // Pipeline finished successfully — release the slot, keep the quota spent.
      await this.rateLimit.finishGeneration(p.userId, { refund: false });
      await this.session.setState(p.userId, BotState.IDLE);
      await job.updateProgress({ stage: 'render_done', presentationId });
      this.logger.log(`Render job ${job.id} completed for presentation ${presentationId}`);
    } catch (err) {
      await job.updateProgress({ stage: 'render_failed', presentationId, error: String(err).slice(0, 180) });
      this.logger.error(`Render failed for ${presentationId}: ${String(err)}`);
      await this.presentations.setStatus(presentationId, 'failed', String(err));
      await this.rateLimit.finishGeneration(p.userId, { refund: true });
      await this.session.setState(p.userId, BotState.IDLE);
      await this.sender.sendMessage(
        chatId,
        "\u274C PDF tayyorlashda xatolik. /start orqali qayta urinib ko'ring.",
      );
    }
  }
}
