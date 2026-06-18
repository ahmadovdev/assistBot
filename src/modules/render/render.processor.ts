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

@Processor(QUEUES.RENDER)
export class RenderProcessor extends WorkerHost {
  private readonly logger = new Logger(RenderProcessor.name);

  constructor(
    private readonly render: RenderService,
    private readonly presentations: PresentationsService,
    private readonly session: SessionService,
    private readonly sender: BotSender,
  ) {
    super();
  }

  async process(job: Job<RenderJobData>): Promise<void> {
    const { presentationId } = job.data;
    const p = await this.presentations.findByIdForRender(presentationId);
    if (!p) {
      this.logger.warn(`Presentation ${presentationId} not found`);
      return;
    }
    const chatId = Number(p.user.telegramId);

    try {
      await this.presentations.setStatus(presentationId, 'rendering');
      await this.sender.sendMessage(chatId, '\u23F3 PDF tayyorlanmoqda...');

      const slides = p.slides.map((s) => ({ layout: s.layout, content: s.content }));
      const pdf = await this.render.renderPdf(p.theme?.config, slides);

      const filename = `${(p.title ?? 'taqdimot').slice(0, 40).replace(/[^\w\-]+/g, '_')}.pdf`;
      const msg = await this.sender.sendDocument(
        chatId,
        pdf,
        filename,
        '\u2705 Taqdimotingiz tayyor!',
      );

      const fileId = msg.document?.file_id;
      await this.presentations.recordExport(presentationId, {
        format: 'pdf',
        storageKey: fileId ?? 'telegram',
        telegramFileId: fileId,
        fileSize: pdf.length,
      });

      await this.presentations.setStatus(presentationId, 'done');
      await this.session.setState(p.userId, BotState.IDLE);
    } catch (err) {
      this.logger.error(`Render failed for ${presentationId}: ${String(err)}`);
      await this.presentations.setStatus(presentationId, 'failed', String(err));
      await this.session.setState(p.userId, BotState.IDLE);
      await this.sender.sendMessage(
        chatId,
        "\u274C PDF tayyorlashda xatolik. /start orqali qayta urinib ko'ring.",
      );
    }
  }
}
