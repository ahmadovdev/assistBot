import { Injectable } from '@nestjs/common';
import { BotContext, WizardContext } from '../bot.types';
import { SessionService } from '../session.service';
import { BotState } from '../bot.constants';
import { PresentationsService } from '../../presentations/presentations.service';
import { outlineSchema, Outline } from '../../ai/schemas/outline.schema';
import { SlideType, SLIDE_EMOJI } from '../../ai/layout.catalog';
import {
  formatOutline,
  outlineConfirmKeyboard,
  formatOutlineEdit,
  outlineEditKeyboard,
  slideActionKeyboard,
  slideTypeKeyboard,
} from '../../generation/outline.formatter';

const MIN_SLIDES = 2;
const MAX_SLIDES = 20;

@Injectable()
export class OutlineEditHandler {
  constructor(
    private readonly session: SessionService,
    private readonly presentations: PresentationsService,
  ) {}

  private async loadOutline(presentationId: string): Promise<Outline | null> {
    const raw = await this.presentations.getOutlineRaw(presentationId);
    const parsed = outlineSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  }

  private renumber(outline: Outline): void {
    outline.slides
      .sort((a, b) => a.position - b.position)
      .forEach((s, i) => (s.position = i + 1));
  }

  private async save(presentationId: string, outline: Outline): Promise<void> {
    this.renumber(outline);
    await this.presentations.saveOutline(presentationId, outline);
  }

  private async showList(ctx: BotContext, outline: Outline, note?: string): Promise<void> {
    await ctx.editMessageText(formatOutlineEdit(outline, note), {
      reply_markup: outlineEditKeyboard(outline),
    });
  }

  async handleCallback(ctx: BotContext): Promise<void> {
    const data = ctx.callbackQuery?.data ?? '';
    await ctx.answerCallbackQuery();
    const parts = data.split(':'); // oe:<action>:<arg>
    const action = parts[1];
    const arg = parts[2];

    const userId = ctx.user.id;
    const { context } = await this.session.get(userId);
    const presentationId = (context as WizardContext).presentationId;
    if (!presentationId) {
      await ctx.editMessageText('Sessiya topilmadi. /start orqali qayta boshlang.');
      return;
    }
    const outline = await this.loadOutline(presentationId);
    if (!outline) {
      await ctx.editMessageText('Reja topilmadi. /start orqali qayta boshlang.');
      return;
    }
    const list = [...outline.slides].sort((a, b) => a.position - b.position);

    switch (action) {
      case 'open':
      case 'list':
        await this.session.setState(userId, BotState.AWAITING_OUTLINE_CONFIRM);
        await this.showList(ctx, outline);
        return;

      case 'slide': {
        const i = Number(arg);
        const s = list[i];
        if (!s) return;
        await ctx.editMessageText(
          `${s.position}. ${SLIDE_EMOJI[s.type] ?? ''} ${s.title}\n\nAmalni tanlang:`,
          { reply_markup: slideActionKeyboard(i, list.length) },
        );
        return;
      }

      case 'del': {
        const i = Number(arg);
        const target = list[i];
        if (!target) return;
        if (list.length <= MIN_SLIDES) {
          await this.showList(ctx, outline, `\u26A0\uFE0F Kamida ${MIN_SLIDES} ta slayd bo\u2018lishi kerak.`);
          return;
        }
        outline.slides = outline.slides.filter((s) => s.position !== target.position);
        await this.save(presentationId, outline);
        await this.showList(ctx, outline);
        return;
      }

      case 'up':
      case 'down': {
        const i = Number(arg);
        const j = action === 'up' ? i - 1 : i + 1;
        if (j < 0 || j >= list.length) return;
        const a = list[i];
        const b = list[j];
        const tmp = a.position;
        a.position = b.position;
        b.position = tmp;
        await this.save(presentationId, outline);
        await this.showList(ctx, outline);
        return;
      }

      case 'title': {
        const i = Number(arg);
        const s = list[i];
        if (!s) return;
        await this.session.patchContext(userId, {
          editIndex: s.position,
          editMsgId: ctx.callbackQuery?.message?.message_id,
        });
        await this.session.setState(userId, BotState.AWAITING_SLIDE_TITLE_EDIT);
        await ctx.editMessageText(
          `\u270F\uFE0F Yangi sarlavhani yozing.\n\nJoriy: ${s.title}`,
        );
        return;
      }

      case 'add': {
        if (list.length >= MAX_SLIDES) {
          await this.showList(ctx, outline, `\u26A0\uFE0F Eng ko\u2018pi ${MAX_SLIDES} ta slayd.`);
          return;
        }
        await this.session.patchContext(userId, {
          editMsgId: ctx.callbackQuery?.message?.message_id,
        });
        await this.session.setState(userId, BotState.AWAITING_NEW_SLIDE_TITLE);
        await ctx.editMessageText('\u2795 Yangi slayd sarlavhasini yozing:');
        return;
      }

      case 'type': {
        const type = arg as SlideType;
        const pendingTitle = (context as WizardContext).pendingTitle;
        await this.session.setState(userId, BotState.AWAITING_OUTLINE_CONFIRM);
        if (!pendingTitle) {
          await this.showList(ctx, outline);
          return;
        }
        outline.slides.push({
          position: outline.slides.length + 1,
          type,
          title: pendingTitle,
          key_points: [],
        });
        await this.save(presentationId, outline);
        await this.session.patchContext(userId, { pendingTitle: undefined });
        await this.showList(ctx, outline);
        return;
      }

      case 'done':
        await this.session.setState(userId, BotState.AWAITING_OUTLINE_CONFIRM);
        await ctx.editMessageText(formatOutline(outline), {
          reply_markup: outlineConfirmKeyboard(),
        });
        return;
    }
  }

  /** Handles free-text replies for title edit and new-slide title. */
  async handleText(ctx: BotContext, state: BotState): Promise<void> {
    const text = ctx.message?.text?.trim();
    if (!text) return;
    const userId = ctx.user.id;
    const { context } = await this.session.get(userId);
    const presentationId = (context as WizardContext).presentationId;
    if (!presentationId) return;
    const outline = await this.loadOutline(presentationId);
    if (!outline) return;

    const chatId = ctx.chat?.id;
    const msgId = (context as WizardContext).editMsgId;
    const editOrReply = async (body: string, kb: any): Promise<void> => {
      if (chatId && msgId) {
        try {
          await ctx.api.editMessageText(chatId, msgId, body, {
            reply_markup: kb,
          });
          return;
        } catch {
          /* fall through to a fresh message */
        }
      }
      await ctx.reply(body, { reply_markup: kb });
    };

    if (state === BotState.AWAITING_SLIDE_TITLE_EDIT) {
      const pos = (context as WizardContext).editIndex;
      const s = outline.slides.find((x) => x.position === pos);
      if (s) s.title = text.slice(0, 120);
      await this.save(presentationId, outline);
      await this.session.setState(userId, BotState.AWAITING_OUTLINE_CONFIRM);
      await editOrReply(formatOutlineEdit(outline), outlineEditKeyboard(outline));
      return;
    }

    if (state === BotState.AWAITING_NEW_SLIDE_TITLE) {
      await this.session.patchContext(userId, { pendingTitle: text.slice(0, 120) });
      await this.session.setState(userId, BotState.AWAITING_OUTLINE_CONFIRM);
      await editOrReply(
        `\u{1F9E9} "${text.slice(0, 80)}" \u2014 slayd turini tanlang:`,
        slideTypeKeyboard(),
      );
      return;
    }
  }
}
