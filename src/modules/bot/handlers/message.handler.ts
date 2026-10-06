import { Injectable } from '@nestjs/common';
import { BotContext } from '../bot.types';
import { SessionService } from '../session.service';
import { BotState } from '../bot.constants';
import { QUESTIONS, slideCountKeyboard, titulChoiceKeyboard } from '../keyboards';
import { OutlineEditHandler } from './outline-edit.handler';
import { TestSlideHandler } from './testslide.handler';
import { FullTypesHandler } from './fulltypes.handler';

@Injectable()
export class MessageHandler {
  constructor(
    private readonly session: SessionService,
    private readonly outlineEdit: OutlineEditHandler,
    private readonly testSlide: TestSlideHandler,
    private readonly fullTypes: FullTypesHandler,
  ) {}

  async handle(ctx: BotContext): Promise<void> {
    const text = ctx.message?.text?.trim();
    if (!text) return;

    const { state } = await this.session.get(ctx.user.id);

    switch (state) {
      case BotState.AWAITING_TOPIC: {
        await this.session.patchContext(ctx.user.id, { topic: text });
        await this.session.setState(ctx.user.id, BotState.AWAITING_TITLE_CHOICE);
        await ctx.reply(QUESTIONS.titulChoice, { reply_markup: titulChoiceKeyboard() });
        return;
      }

      case BotState.AWAITING_TITLE_UNIVERSITY: {
        await this.session.patchContext(ctx.user.id, { titulUniversity: text });
        await this.session.setState(ctx.user.id, BotState.AWAITING_TITLE_FACULTY);
        await ctx.reply(QUESTIONS.titulFaculty);
        return;
      }

      case BotState.AWAITING_TITLE_FACULTY: {
        await this.session.patchContext(ctx.user.id, { titulFaculty: text });
        await this.session.setState(ctx.user.id, BotState.AWAITING_TITLE_STUDENT);
        await ctx.reply(QUESTIONS.titulStudent);
        return;
      }

      case BotState.AWAITING_TITLE_STUDENT: {
        await this.session.patchContext(ctx.user.id, { titulStudent: text });
        await this.session.setState(ctx.user.id, BotState.AWAITING_SLIDE_COUNT);
        await ctx.reply(QUESTIONS.slideCount, { reply_markup: slideCountKeyboard() });
        return;
      }

      case BotState.AWAITING_TITLE_CHOICE:
        await ctx.reply('Yuqoridagi tugmalardan birini tanlang \u{1F446}');
        return;

      case BotState.AWAITING_SLIDE_TITLE_EDIT:
      case BotState.AWAITING_NEW_SLIDE_TITLE:
        await this.outlineEdit.handleText(ctx, state);
        return;

      case BotState.GENERATING:
        await ctx.reply('\u23F3 Iltimos kuting, jarayon davom etmoqda...');
        return;

      case BotState.TESTSLIDE_AWAITING_TYPE:
      case BotState.TESTSLIDE_AWAITING_THEME:
        await ctx.reply('Yuqoridagi tugmalardan birini tanlang \u{1F446}');
        return;

      case BotState.FULLTYPES_AWAITING_TOPIC:
        await this.fullTypes.handleTopic(ctx, text);
        return;

      case BotState.FULLTYPES_AWAITING_THEME:
        await ctx.reply('Yuqoridagi dizaynlardan birini tanlang \u{1F446}');
        return;

      case BotState.AWAITING_OUTLINE_CONFIRM:
      case BotState.AWAITING_CONTENT_MODE:
        await ctx.reply('Yuqoridagi tugmalardan birini tanlang \u{1F446}');
        return;

      default:
        await ctx.reply("Boshlash uchun /start buyrug'ini yuboring.");
    }
  }
}
