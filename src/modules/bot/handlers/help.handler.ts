import { Injectable } from '@nestjs/common';
import { BotContext } from '../bot.types';

@Injectable()
export class HelpHandler {
  async handle(ctx: BotContext): Promise<void> {
    const text = [
      '\u{1F4A1} *Lumio* \u2014 AI taqdimot generatori',
      '',
      'Men mavzuingiz bo\u2018yicha chiroyli, professional taqdimot (PDF) yarataman.',
      '',
      '*Qanday ishlaydi:*',
      '1\uFE0F\u20E3 /start bosing yoki mavzu yozing',
      '2\uFE0F\u20E3 Slayd soni, til va uslubni tanlang',
      '3\uFE0F\u20E3 5 ta dizayndan birini tanlang',
      '4\uFE0F\u20E3 Rejani ko\u2018rib tasdiqlang',
      '5\uFE0F\u20E3 Tayyor PDF\u2019ni yuklab oling',
      '',
      '*Komandalar:*',
      '/start \u2014 yangi taqdimot',
      '/history \u2014 mening taqdimotlarim',
      '/help \u2014 ushbu yordam',
      '',
      '\u{1F4A1} Maslahat: mavzuni aniq yozing, masalan',
      '\u201CFintech startap uchun investorlarga pitch\u201D.',
    ].join('\n');
    await ctx.reply(text, { parse_mode: 'Markdown' });
  }
}
