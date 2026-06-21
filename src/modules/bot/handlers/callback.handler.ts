import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BotContext, WizardContext } from '../bot.types';
import { SessionService } from '../session.service';
import { BotState } from '../bot.constants';
import { ThemesService } from '../../themes/themes.service';
import { buildThemePreviewMedia } from '../theme-previews';
import { PresentationsService } from '../../presentations/presentations.service';
import { QUEUES } from '../../../infra/queue/queue.constants';
import { OutlineJobData, CardsJobData } from '../../../infra/queue/queue.types';
import {
  QUESTIONS,
  LANG_LABELS,
  TONE_LABELS,
  EXAMPLE_TOPICS,
  examplesKeyboard,
  slideCountKeyboard,
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
    @InjectQueue(QUEUES.OUTLINE) private readonly outlineQueue: Queue<OutlineJobData>,
    @InjectQueue(QUEUES.CARDS) private readonly cardsQueue: Queue<CardsJobData>,
  ) {}

  async handle(ctx: BotContext): Promise<void> {
    const data = ctx.callbackQuery?.data;
    if (!data) return;
    await ctx.answerCallbackQuery();

    const [action, value] = data.split(':');
    const userId = ctx.user.id;
    const { state, context } = await this.session.get(userId);

    switch (action) {
      case 'ex': {
        if (state !== BotState.AWAITING_TOPIC) return;
        const topic = EXAMPLE_TOPICS[Number(value)];
        if (!topic) return;
        await this.session.patchContext(userId, { topic });
        await this.session.setState(userId, BotState.AWAITING_SLIDE_COUNT);
        await ctx.editMessageText(`\u{1F4CC} Mavzu: ${topic}\n\n${QUESTIONS.slideCount}`, {
          reply_markup: slideCountKeyboard(),
        });
        return;
      }

      case 'back': {
        switch (value) {
          case 'topic':
            await this.session.setState(userId, BotState.AWAITING_TOPIC);
            await ctx.editMessageText(QUESTIONS.topic, { reply_markup: examplesKeyboard() });
            return;
          case 'slides':
            await this.session.setState(userId, BotState.AWAITING_SLIDE_COUNT);
            await ctx.editMessageText(QUESTIONS.slideCount, { reply_markup: slideCountKeyboard() });
            return;
          case 'lang':
            await this.session.setState(userId, BotState.AWAITING_LANGUAGE);
            await ctx.editMessageText(QUESTIONS.language, { reply_markup: languageKeyboard() });
            return;
          case 'tone':
            await this.session.setState(userId, BotState.AWAITING_TONE);
            await ctx.editMessageText(QUESTIONS.tone, { reply_markup: toneKeyboard() });
            return;
        }
        return;
      }

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
        await ctx.editMessageText('\u{1F5BC} Dizayn tanlang \u2014 5 ta namuna quyida \u{1F447}');
        const media = buildThemePreviewMedia(themes);
        if (media.length) {
          try {
            await ctx.replyWithMediaGroup(media);
          } catch {
            /* album optional; fall through to keyboard */
          }
        }
        await ctx.reply(QUESTIONS.theme, { reply_markup: themeKeyboard(themes) });
        return;
      }

      case 'theme': {
        if (state !== BotState.AWAITING_THEME) return;
        const theme = await this.themes.findByKey(value);
        if (!theme) {
          await ctx.editMessageText('Tema topilmadi. /start dan qayta boshlang.');
          await this.session.reset(userId);
          return;
        }

        const merged: WizardContext = { ...context, themeKey: value };
        const presentation = await this.presentations.createFromWizard(userId, theme.id, merged);

        await this.session.patchContext(userId, {
          themeKey: value,
          presentationId: presentation.id,
        });
        await this.session.setState(userId, BotState.GENERATING);

        await ctx.editMessageText(
          `\u2705 Parametrlar tayyor!\n\n` +
            `\u{1F4CC} Mavzu: ${merged.topic ?? '-'}\n` +
            `\u{1F4CA} Slaydlar: ${merged.slideCount ?? '-'}\n` +
            `\u{1F310} Til: ${LANG_LABELS[merged.language ?? ''] ?? merged.language}\n` +
            `\u{1F3A8} Uslub: ${TONE_LABELS[merged.tone ?? ''] ?? merged.tone}\n` +
            `\u{1F5BC} Tema: ${theme.name}\n\n` +
            `\u23F3 Reja tayyorlanmoqda...`,
        );

        await this.outlineQueue.add(
          'generate',
          { presentationId: presentation.id },
          { attempts: 1 },
        );
        return;
      }

      case 'outline': {
        if (state !== BotState.AWAITING_OUTLINE_CONFIRM) return;
        const original = ctx.callbackQuery?.message?.text ?? '';

        if (value === 'confirm') {
          const presentationId = (context as WizardContext).presentationId;
          if (!presentationId) {
            await ctx.editMessageText('Sessiya topilmadi. /start dan qayta boshlang.');
            await this.session.reset(userId);
            return;
          }
          await this.session.setState(userId, BotState.GENERATING);
          await ctx.editMessageText(`${original}\n\n\u23F3 Slaydlar tayyorlanmoqda...`);
          await this.cardsQueue.add('generate', { presentationId }, { attempts: 1 });
          return;
        }

        if (value === 'regenerate') {
          const presentationId = (context as WizardContext).presentationId;
          if (!presentationId) {
            await ctx.editMessageText('Sessiya topilmadi. /start dan qayta boshlang.');
            await this.session.reset(userId);
            return;
          }
          await this.session.setState(userId, BotState.GENERATING);
          await ctx.editMessageText('\u23F3 Boshqa reja tayyorlanmoqda...');
          await this.outlineQueue.add('generate', { presentationId }, { attempts: 1 });
          return;
        }
        return;
      }

      default:
        this.logger.warn(`Unknown callback action: ${action}`);
    }
  }
}
