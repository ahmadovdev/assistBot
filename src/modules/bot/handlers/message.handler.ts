import { Injectable } from '@nestjs/common';
import { BotContext } from '../bot.types';
import { SessionService } from '../session.service';
import { BotState } from '../bot.constants';
import { QUESTIONS, slideCountKeyboard } from '../keyboards';

@Injectable()
export class MessageHandler {
  constructor(private readonly session: SessionService) {}

  async handle(ctx: BotContext): Promise<void> {
    const text = ctx.message?.text?.trim();
    if (!text) return;

    const { state } = await this.session.get(ctx.user.id);

    switch (state) {
      case BotState.AWAITING_TOPIC: {
        await this.session.patchContext(ctx.user.id, { topic: text });
        await this.session.setState(ctx.user.id, BotState.AWAITING_SLIDE_COUNT);
        await ctx.reply(QUESTIONS.slideCount, { reply_markup: slideCountKeyboard() });
        return;
      }

      case BotState.GENERATING:
        await ctx.reply('\u23F3 Iltimos kuting, jarayon davom etmoqda...');
        return;

      case BotState.AWAITING_OUTLINE_CONFIRM:
        await ctx.reply('Yuqoridagi tugmalardan birini tanlang: \u2705 yoki \u{1F504}');
        return;

      default:
        await ctx.reply("Boshlash uchun /start buyrug'ini yuboring.");
    }
  }
}
