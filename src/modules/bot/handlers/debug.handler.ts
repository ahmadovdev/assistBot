import { Injectable } from '@nestjs/common';
import { InputFile } from 'grammy';
import { BotContext } from '../bot.types';
import { PresentationsService } from '../../presentations/presentations.service';

/** /debug — sends the latest presentation's full JSON (outline + slides) as a file. */
@Injectable()
export class DebugHandler {
  constructor(private readonly presentations: PresentationsService) {}

  async handle(ctx: BotContext): Promise<void> {
    const p = await this.presentations.findLatestWithSlides(ctx.user.id);
    if (!p) {
      await ctx.reply('Hali taqdimot yo\'q. Avval /start orqali bittasini yarating.');
      return;
    }

    const payload = {
      presentationId: p.id,
      topic: p.topicPrompt,
      language: p.language,
      tone: p.tone,
      status: p.status,
      outline: p.outline,
      slides: p.slides.map((s: { position: number; layout: string; content: unknown }) => ({
        position: s.position,
        layout: s.layout,
        content: s.content,
      })),
    };

    const json = JSON.stringify(payload, null, 2);
    const buffer = Buffer.from(json, 'utf-8');
    await ctx.replyWithDocument(new InputFile(buffer, `presentation-${p.id}.json`), {
      caption: `\u{1F4C4} ${p.slides.length} ta slayd \u2014 JSON (status: ${p.status})`,
    });
  }
}
