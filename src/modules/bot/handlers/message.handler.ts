import { Injectable } from '@nestjs/common';
import { BotContext } from '../bot.types';
import { SessionService } from '../session.service';
import { BotState } from '../bot.constants';

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
        // Phase 2 will transition to AWAITING_SLIDE_COUNT with an inline keyboard.
        await this.session.setState(ctx.user.id, BotState.IDLE);
        await ctx.reply(
          `\u2705 Mavzu qabul qilindi:\n"${text}"\n\n` +
            `(Keyingi bosqich \u2014 slayd soni, til, uslub va tema tanlash \u2014 Faza 2.)`,
        );
        return;
      }
      default:
        await ctx.reply("Boshlash uchun /start buyrug'ini yuboring.");
    }
  }
}
