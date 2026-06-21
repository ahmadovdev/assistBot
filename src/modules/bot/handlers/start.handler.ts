import { Injectable } from '@nestjs/common';
import { BotContext } from '../bot.types';
import { SessionService } from '../session.service';
import { BotState } from '../bot.constants';
import { examplesKeyboard } from '../keyboards';

@Injectable()
export class StartHandler {
  constructor(private readonly session: SessionService) {}

  async handle(ctx: BotContext): Promise<void> {
    await this.session.reset(ctx.user.id);
    await this.session.setState(ctx.user.id, BotState.AWAITING_TOPIC);

    const name = ctx.user.firstName ? `, ${ctx.user.firstName}` : '';
    await ctx.reply(
      `\u{1F44B} Salom${name}! Men \u2014 Lumio, mavzudan professional taqdimot (PDF) yarataman.\n\n` +
        `\u270D\uFE0F Taqdimot mavzusini yozing,\n` +
        `yoki quyidagi tayyor namunalardan birini tanlang \u{1F447}`,
      { reply_markup: examplesKeyboard() },
    );
  }
}
