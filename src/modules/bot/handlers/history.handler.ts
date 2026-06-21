import { Injectable } from '@nestjs/common';
import { InlineKeyboard } from 'grammy';
import { BotContext } from '../bot.types';
import { PresentationsService } from '../../presentations/presentations.service';

const STATUS_ICON: Record<string, string> = {
  done: '\u{1F4C4}', rendering: '\u23F3', generating: '\u23F3', failed: '\u26A0\uFE0F', draft: '\u{1F4DD}',
};

@Injectable()
export class HistoryHandler {
  constructor(private readonly presentations: PresentationsService) {}

  async handle(ctx: BotContext): Promise<void> {
    const items = await this.presentations.listRecent(ctx.user.id, 8);
    if (!items.length) {
      await ctx.reply(
        "\u{1F4C2} Sizda hali taqdimot yo\u2018q.\n/start bosib birinchisini yarating!",
      );
      return;
    }

    const kb = new InlineKeyboard();
    for (const p of items) {
      const label = (p.title ?? p.topicPrompt).slice(0, 32);
      const icon = STATUS_ICON[p.status] ?? '\u{1F4C4}';
      kb.text(`${icon} ${label}`, `history:get:${p.id}`).row();
    }
    await ctx.reply('\u{1F4C2} *Mening taqdimotlarim:*', {
      parse_mode: 'Markdown',
      reply_markup: kb,
    });
  }

  async handleCallback(ctx: BotContext): Promise<void> {
    const data = ctx.callbackQuery?.data ?? '';
    const id = data.split(':')[2];
    await ctx.answerCallbackQuery();
    if (!id) return;

    const fileId = await this.presentations.latestFileId(id, ctx.user.id);
    if (!fileId) {
      await ctx.reply(
        "\u26A0\uFE0F Bu taqdimot uchun tayyor PDF topilmadi. U muvaffaqiyatsiz tugagan yoki hali tayyorlanmagan bo\u2018lishi mumkin.",
      );
      return;
    }
    await ctx.replyWithDocument(fileId, { caption: '\u{1F4C4} Taqdimotingiz' });
  }
}
