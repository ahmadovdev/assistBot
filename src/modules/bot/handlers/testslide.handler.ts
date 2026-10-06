import { Injectable, Logger } from '@nestjs/common';
import { InlineKeyboard, InputFile } from 'grammy';
import { BotContext } from '../bot.types';
import { SessionService } from '../session.service';
import { BotState } from '../bot.constants';
import { RenderService } from '../../render/render.service';
import { ThemesService } from '../../themes/themes.service';
import { SLIDE_TYPES, SLIDE_EMOJI, SlideType } from '../../ai/layout.catalog';
import testCatalog from '../testslide.catalog.json';

const TEST_SLIDES = testCatalog.slides as Record<SlideType, Record<string, unknown>>;

/**
 * /testslide — admin-only debug command, completely separate from the main
 * generation wizard (see bot.constants.ts). Uses the saved 19-type
 * `Fotosintez` catalog, lets the admin pick a type and theme, then renders a
 * single-slide PDF. No AI request is made, so every test costs zero tokens.
 *
 * Gated by TESTSLIDE_ADMIN_ID (a raw env var, deliberately NOT added to the
 * shared Zod env schema/AppConfig — this is a dev tool, not a product
 * feature, so it shouldn't grow the surface area other code depends on).
 */
@Injectable()
export class TestSlideHandler {
  private readonly logger = new Logger(TestSlideHandler.name);

  constructor(
    private readonly session: SessionService,
    private readonly renderService: RenderService,
    private readonly themes: ThemesService,
  ) {}

  private isAdmin(ctx: BotContext): boolean {
    const adminId = process.env.TESTSLIDE_ADMIN_ID;
    return !!adminId && String(ctx.from?.id) === adminId;
  }

  async handleCommand(ctx: BotContext): Promise<void> {
    if (!this.isAdmin(ctx)) return; // silently ignore for everyone else
    await this.session.reset(ctx.user.id);
    await this.session.setState(ctx.user.id, BotState.TESTSLIDE_AWAITING_TYPE);

    const kb = new InlineKeyboard();
    SLIDE_TYPES.forEach((type, i) => {
      kb.text(`${SLIDE_EMOJI[type] ?? ''} ${type}`, `tstype:${type}`);
      if (i % 2 === 1) kb.row();
    });
    await ctx.reply(
      `\u{1F9EA} Token-free test rejimi\nKatalog: ${testCatalog.topic} · ${SLIDE_TYPES.length} type · 0 token\n\nQaysi slayd turini render qilamiz?`,
      { reply_markup: kb },
    );
  }

  /** Routes tstype:/tstheme: callbacks by current state. */
  async handleCallback(ctx: BotContext): Promise<void> {
    if (!this.isAdmin(ctx)) return;
    const data = ctx.callbackQuery?.data;
    if (!data) return;

    const [prefix] = data.split(':');
    if (prefix === 'tstype') return this.handleTypeChoice(ctx, data);
    if (prefix === 'tstheme') return this.handleThemeChoice(ctx, data);
  }

  private async handleTypeChoice(ctx: BotContext, data: string): Promise<void> {
    await ctx.answerCallbackQuery();
    const { state } = await this.session.get(ctx.user.id);
    if (state !== BotState.TESTSLIDE_AWAITING_TYPE) return;

    const type = data.split(':')[1] as SlideType;
    if (!SLIDE_TYPES.includes(type)) return;

    await this.session.patchContext(ctx.user.id, { testType: type });
    await this.session.setState(ctx.user.id, BotState.TESTSLIDE_AWAITING_THEME);

    const themes = await this.themes.findAll();
    const kb = new InlineKeyboard();
    themes.forEach((t, i) => {
      kb.text(t.name, `tstheme:${t.key}`);
      if (i % 2 === 1) kb.row();
    });
    await ctx.reply(`${type} — qaysi dizaynda?`, { reply_markup: kb });
  }

  private async handleThemeChoice(ctx: BotContext, data: string): Promise<void> {
    await ctx.answerCallbackQuery();
    const { state, context } = await this.session.get(ctx.user.id);
    if (state !== BotState.TESTSLIDE_AWAITING_THEME) return;

    const themeKey = data.split(':')[1];
    const type = (context as { testType?: SlideType }).testType;
    if (!type) return;

    await ctx.reply(`⏳ ${type} (${themeKey}) saqlangan katalogdan render qilinmoqda...`);

    try {
      const content = TEST_SLIDES[type];
      if (!content) throw new Error(`${type} uchun test katalogida data topilmadi`);

      const pdf = await this.renderService.renderPdf(themeKey, [
        { type, content },
      ]);

      await ctx.replyWithDocument(new InputFile(pdf, `test-${type}-${themeKey}.pdf`), {
        caption: `✅ ${type} — ${themeKey} — 0 token · ${testCatalog.topic} katalogi`,
      });
    } catch (err) {
      this.logger.error(`/testslide generation failed for ${type}/${themeKey}: ${String(err)}`);
      await ctx.reply(`❌ Xatolik: ${String(err)}`);
    } finally {
      await this.session.reset(ctx.user.id);
    }
  }
}
