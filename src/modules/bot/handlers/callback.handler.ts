import { Injectable, Logger } from '@nestjs/common';
import { BotContext, WizardContext } from '../bot.types';
import { SessionService } from '../session.service';
import { BotState } from '../bot.constants';
import { ThemesService } from '../../themes/themes.service';
import { PresentationsService } from '../../presentations/presentations.service';
import {
  QUESTIONS,
  LANG_LABELS,
  TONE_LABELS,
  languageKeyboard,
  toneKeyboard,
  themeKeyboard,
} from '../keyboards';

@Injectable()
export class CallbackHandler {
  private readonly logger = new Logger(CallbackHandler.name);

  constructor(
    private readonly session: SessionService,
    private readonly themes: ThemesService,
    private readonly presentations: PresentationsService,
  ) {}

  async handle(ctx: BotContext): Promise<void> {
    const data = ctx.callbackQuery?.data;
    if (!data) return;

    // Stop the button's loading spinner immediately.
    await ctx.answerCallbackQuery();

    const [action, value] = data.split(':');
    const userId = ctx.user.id;
    const { state, context } = await this.session.get(userId);

    switch (action) {
      case 'slides':
        if (state !== BotState.AWAITING_SLIDE_COUNT) return;
        await this.session.patchContext(userId, { slideCount: Number(value) });
        await this.session.setState(userId, BotState.AWAITING_LANGUAGE);
        await ctx.editMessageText(QUESTIONS.language, { reply_markup: languageKeyboard() });
        return;

      case 'lang':
        if (state !== BotState.AWAITING_LANGUAGE) return;
        await this.session.patchContext(userId, { language: value });
        await this.session.setState(userId, BotState.AWAITING_TONE);
        await ctx.editMessageText(QUESTIONS.tone, { reply_markup: toneKeyboard() });
        return;

      case 'tone': {
        if (state !== BotState.AWAITING_TONE) return;
        await this.session.patchContext(userId, { tone: value });
        await this.session.setState(userId, BotState.AWAITING_THEME);
        const themes = await this.themes.findAll();
        await ctx.editMessageText(QUESTIONS.theme, { reply_markup: themeKeyboard(themes) });
        return;
      }

      case 'theme': {
        if (state !== BotState.AWAITING_THEME) return;
        const theme = await this.themes.findByKey(value);
        if (!theme) {
          await ctx.editMessageText("Tema topilmadi. /start dan qayta boshlang.");
          await this.session.reset(userId);
          return;
        }

        const merged: WizardContext = { ...context, themeKey: value };
        const presentation = await this.presentations.createFromWizard(
          userId,
          theme.id,
          merged,
        );

        await this.session.patchContext(userId, {
          themeKey: value,
          presentationId: presentation.id,
        });
        // Phase 3 will transition to outline generation instead of IDLE.
        await this.session.setState(userId, BotState.IDLE);

        await ctx.editMessageText(
          `\u2705 Hammasi tayyor!\n\n` +
            `\u{1F4CC} Mavzu: ${merged.topic ?? '-'}\n` +
            `\u{1F4CA} Slaydlar: ${merged.slideCount ?? '-'}\n` +
            `\u{1F310} Til: ${LANG_LABELS[merged.language ?? ''] ?? merged.language}\n` +
            `\u{1F3A8} Uslub: ${TONE_LABELS[merged.tone ?? ''] ?? merged.tone}\n` +
            `\u{1F5BC} Tema: ${theme.name}\n\n` +
            `(Keyingi bosqich \u2014 reja generatsiyasi, Faza 3.)`,
        );
        return;
      }

      default:
        this.logger.warn(`Unknown callback action: ${action}`);
    }
  }
}
