import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BotContext, WizardContext } from '../bot.types';
import { SessionService } from '../session.service';
import { BotState } from '../bot.constants';
import { ThemesService } from '../../themes/themes.service';
import {
  displayableThemes,
  themePreviewSource,
  rememberThemeFileId,
  themeCaption,
} from '../theme-previews';
import { PresentationsService } from '../../presentations/presentations.service';
import { RateLimitService } from '../../ratelimit/rate-limit.service';
import { QUEUES } from '../../../infra/queue/queue.constants';
import { OutlineJobData, CardsJobData } from '../../../infra/queue/queue.types';
import {
  QUESTIONS,
  LANG_LABELS,
  EXAMPLE_TOPICS,
  examplesKeyboard,
  titulChoiceKeyboard,
  slideCountKeyboard,
  languageKeyboard,
  themeKeyboard,
  themeCarouselKeyboard,
  contentModeKeyboard,
} from '../keyboards';
import type { PhotoSize } from 'grammy/types';

@Injectable()
export class CallbackHandler {
  private readonly logger = new Logger(CallbackHandler.name);

  constructor(
    private readonly session: SessionService,
    private readonly themes: ThemesService,
    private readonly presentations: PresentationsService,
    private readonly rateLimit: RateLimitService,
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
        await this.session.setState(userId, BotState.AWAITING_TITLE_CHOICE);
        await ctx.editMessageText(`\u{1F4CC} Mavzu: ${topic}\n\n${QUESTIONS.titulChoice}`, {
          reply_markup: titulChoiceKeyboard(),
        });
        return;
      }

      case 'titul': {
        if (state !== BotState.AWAITING_TITLE_CHOICE) return;
        if (value === 'yes') {
          await this.session.patchContext(userId, { titulEnabled: true });
          await this.session.setState(userId, BotState.AWAITING_TITLE_UNIVERSITY);
          await ctx.editMessageText(QUESTIONS.titulUniversity);
          return;
        }
        // "no" — skip metadata, slide 1 shows only the topic.
        await this.session.patchContext(userId, { titulEnabled: false });
        await this.session.setState(userId, BotState.AWAITING_SLIDE_COUNT);
        await ctx.editMessageText(QUESTIONS.slideCount, { reply_markup: slideCountKeyboard() });
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
        }
        return;
      }

      case 'slides':
        if (state !== BotState.AWAITING_SLIDE_COUNT) return;
        await this.session.patchContext(userId, { slideCount: Number(value) });
        await this.session.setState(userId, BotState.AWAITING_LANGUAGE);
        await ctx.editMessageText(QUESTIONS.language, { reply_markup: languageKeyboard() });
        return;

      case 'lang': {
        if (state !== BotState.AWAITING_LANGUAGE) return;
        await this.session.patchContext(userId, { language: value });
        await this.session.setState(userId, BotState.AWAITING_THEME);

        const all = await this.themes.findAll();
        const themes = displayableThemes(all);

        // No preview images available \u2014 fall back to the plain text list.
        if (!themes.length) {
          await ctx.editMessageText(QUESTIONS.theme, { reply_markup: themeKeyboard(all) });
          return;
        }

        await ctx.editMessageText(
          '\u{1F3A8} Dizayn tanlang \u2014 namunalarni varaqlab ko\u02bbring \u{1F447}',
        );

        const first = themes[0];
        const sent = await ctx.replyWithPhoto(themePreviewSource(first), {
          caption: themeCaption(first, 0, themes.length),
          parse_mode: 'HTML',
          reply_markup: themeCarouselKeyboard(themes, 0),
        });
        rememberThemeFileId(first.key, this.largestPhotoId(sent.photo));
        return;
      }

      case 'tnav': {
        if (state !== BotState.AWAITING_THEME) return;
        const themes = displayableThemes(await this.themes.findAll());
        const index = Number(value);
        const theme = themes[index];
        if (!theme) return;
        try {
          const edited = await ctx.editMessageMedia(
            {
              type: 'photo',
              media: themePreviewSource(theme),
              caption: themeCaption(theme, index, themes.length),
              parse_mode: 'HTML',
            },
            { reply_markup: themeCarouselKeyboard(themes, index) },
          );
          if (typeof edited !== 'boolean') {
            rememberThemeFileId(theme.key, this.largestPhotoId(edited.photo));
          }
        } catch (err) {
          this.logger.warn(`Theme carousel edit failed: ${String(err)}`);
        }
        return;
      }

      case 'theme_back': {
        if (state !== BotState.AWAITING_THEME) return;
        await this.session.setState(userId, BotState.AWAITING_LANGUAGE);
        try {
          await ctx.deleteMessage();
        } catch {
          /* message already gone; ignore */
        }
        await ctx.reply(QUESTIONS.language, { reply_markup: languageKeyboard() });
        return;
      }

      case 'theme': {
        if (state !== BotState.AWAITING_THEME) return;
        const theme = await this.themes.findByKey(value);
        if (!theme) {
          await this.replaceSelectionMessage(ctx, 'Tema topilmadi. /start dan qayta boshlang.');
          await this.session.reset(userId);
          return;
        }

        // Rate-limit gate: this is where the expensive pipeline (LLM + render)
        // actually starts, so guard cost/abuse here before creating anything.
        const decision = await this.rateLimit.startGeneration(userId);
        if (!decision.allowed) {
          const msg =
            decision.reason === 'inflight'
              ? '⏳ Avvalgi taqdimotingiz hali tayyorlanmoqda. Tugashini kuting, keyin yangisini boshlaysiz.'
              : `\u{1F6D1} Bugungi limit tugadi (${decision.limit} ta/kun). ` +
                `Ertaga (UTC ${decision.resetsAt.getUTCHours().toString().padStart(2, '0')}:00 dan keyin) qayta urinib ko‘ring.`;
          await this.replaceSelectionMessage(ctx, msg);
          return;
        }

        const merged: WizardContext = { ...context, themeKey: value };
        let presentation;
        try {
          presentation = await this.presentations.createFromWizard(userId, theme.id, merged);
        } catch (err) {
          // Nothing was queued yet — release the slot so the failure is free.
          await this.rateLimit.finishGeneration(userId, { refund: true });
          throw err;
        }

        await this.session.patchContext(userId, {
          themeKey: value,
          presentationId: presentation.id,
        });
        await this.session.setState(userId, BotState.GENERATING);

        await this.replaceSelectionMessage(
          ctx,
          `\u2705 Parametrlar tayyor!\n\n` +
            `\u{1F4CC} Mavzu: ${merged.topic ?? '-'}\n` +
            `\u{1F4CA} Slaydlar: ${merged.slideCount ?? '-'}\n` +
            `\u{1F310} Til: ${LANG_LABELS[merged.language ?? ''] ?? merged.language}\n` +
            `\u{1F5BC} Tema: ${theme.name}\n\n` +
            `\u23F3 Reja tayyorlanmoqda...`,
        );

        // attempts: 3 (inherits exponential backoff from the queue default).
        // Processors catch their own errors, so retries only fire for
        // pre-processing/infra blips (e.g. a transient DB read) — safe to retry.
        await this.outlineQueue.add(
          'generate',
          { presentationId: presentation.id },
          { attempts: 3 },
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
          // Content style is asked once per deck, right before generation \u2014
          // not per slide type. Cards mode remains the default either way.
          await this.session.setState(userId, BotState.AWAITING_CONTENT_MODE);
          await ctx.editMessageText(`${original}\n\n${QUESTIONS.contentMode}`, {
            reply_markup: contentModeKeyboard(),
          });
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
          await this.outlineQueue.add('generate', { presentationId }, { attempts: 3 });
          return;
        }
        return;
      }

      case 'contentMode': {
        if (state !== BotState.AWAITING_CONTENT_MODE) return;
        const wctx = context as WizardContext;
        const presentationId = wctx.presentationId;
        if (!presentationId) {
          await ctx.editMessageText('Sessiya topilmadi. /start dan qayta boshlang.');
          await this.session.reset(userId);
          return;
        }
        const contentMode = value === 'prose' ? 'prose' : 'cards';
        await this.session.patchContext(userId, { contentMode });
        await this.session.setState(userId, BotState.GENERATING);

        const original = ctx.callbackQuery?.message?.text ?? '';
        await ctx.editMessageText(`${original}\n\n\u23F3 Slaydlar tayyorlanmoqda...`);
        await this.cardsQueue.add(
          'generate',
          {
            presentationId,
            titul: {
              enabled: wctx.titulEnabled === true,
              university: wctx.titulUniversity,
              faculty: wctx.titulFaculty,
              student: wctx.titulStudent,
            },
            contentMode,
          },
          { attempts: 3 },
        );
        return;
      }

      default:
        this.logger.warn(`Unknown callback action: ${action}`);
    }
  }

  /** file_id of the largest rendition in a Telegram photo array, if present. */
  private largestPhotoId(photo?: PhotoSize[]): string | undefined {
    return photo?.[photo.length - 1]?.file_id;
  }

  /**
   * Finalize the theme-selection message. When the source is the preview
   * carousel (a photo message) we edit its caption so the chosen design stays
   * visible; otherwise we edit the text. In both cases the buttons are cleared.
   */
  private async replaceSelectionMessage(ctx: BotContext, text: string): Promise<void> {
    const isPhoto = Boolean(ctx.callbackQuery?.message?.photo);
    if (isPhoto) {
      await ctx.editMessageCaption({ caption: text, reply_markup: undefined });
    } else {
      await ctx.editMessageText(text);
    }
  }
}
