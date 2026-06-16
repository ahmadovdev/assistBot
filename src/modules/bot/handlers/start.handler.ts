import { Injectable } from '@nestjs/common';
import { BotContext } from '../bot.types';
import { SessionService } from '../session.service';
import { BotState } from '../bot.constants';

@Injectable()
export class StartHandler {
  constructor(private readonly session: SessionService) {}

  async handle(ctx: BotContext): Promise<void> {
    await this.session.reset(ctx.user.id);
    await this.session.setState(ctx.user.id, BotState.AWAITING_TOPIC);

    const name = ctx.user.firstName ? `, ${ctx.user.firstName}` : '';
    await ctx.reply(
      `\u{1F44B} Salom${name}! Men mavzudan professional taqdimot yarataman.\n\n` +
        `Taqdimot mavzusini yozing.\n` +
        `Masalan: "O'zbekistonda startap ekotizimi \u2014 muammolar va imkoniyatlar"`,
    );
  }
}
