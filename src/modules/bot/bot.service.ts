import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { Bot } from 'grammy';
import { BOT } from './bot.provider';
import { BotContext } from './bot.types';
import { UsersService } from '../users/users.service';
import { StartHandler } from './handlers/start.handler';
import { MessageHandler } from './handlers/message.handler';
import { CallbackHandler } from './handlers/callback.handler';
import { DebugHandler } from './handlers/debug.handler';
import { HelpHandler } from './handlers/help.handler';
import { HistoryHandler } from './handlers/history.handler';
import { OutlineEditHandler } from './handlers/outline-edit.handler';
import { TestSlideHandler } from './handlers/testslide.handler';
import { FullTypesHandler } from './handlers/fulltypes.handler';
import { runsBot } from '../../common/config/role';

@Injectable()
export class BotService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(BotService.name);
  private polling = false;

  constructor(
    @Inject(BOT) private readonly bot: Bot<BotContext>,
    private readonly users: UsersService,
    private readonly startHandler: StartHandler,
    private readonly messageHandler: MessageHandler,
    private readonly callbackHandler: CallbackHandler,
    private readonly debugHandler: DebugHandler,
    private readonly helpHandler: HelpHandler,
    private readonly historyHandler: HistoryHandler,
    private readonly outlineEditHandler: OutlineEditHandler,
    private readonly testSlideHandler: TestSlideHandler,
    private readonly fullTypesHandler: FullTypesHandler,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    // In 'worker' role this process must NOT poll Telegram (only one process
    // may long-poll a bot token, else Telegram returns 409 Conflict). The Bot
    // instance still exists so workers can push messages via BotSender.
    if (!runsBot()) {
      this.logger.log('APP_ROLE=worker — skipping Telegram polling (workers only)');
      return;
    }

    // 1) Auth middleware: resolve/attach our DB user on every update.
    this.bot.use(async (ctx, next) => {
      if (ctx.from && !ctx.from.is_bot) {
        ctx.user = await this.users.upsertFromTelegram(ctx.from);
      }
      await next();
    });

    // 2) Routes.
    this.bot.command('start', (ctx) => this.startHandler.handle(ctx));
    this.bot.command('help', (ctx) => this.helpHandler.handle(ctx));
    this.bot.command('history', (ctx) => this.historyHandler.handle(ctx));
    this.bot.command('debug', (ctx) => this.debugHandler.handle(ctx));
    this.bot.command('testslide', (ctx) => this.testSlideHandler.handleCommand(ctx));
    this.bot.command('fulltypes', (ctx) => this.fullTypesHandler.handleCommand(ctx));
    this.bot.callbackQuery(/^history:/, (ctx) => this.historyHandler.handleCallback(ctx));
    this.bot.callbackQuery(/^oe:/, (ctx) => this.outlineEditHandler.handleCallback(ctx));
    this.bot.callbackQuery(/^tstype:/, (ctx) => this.testSlideHandler.handleCallback(ctx));
    this.bot.callbackQuery(/^tstheme:/, (ctx) => this.testSlideHandler.handleCallback(ctx));
    this.bot.callbackQuery(/^fttheme:/, (ctx) => this.fullTypesHandler.handleCallback(ctx));
    this.bot.on('message:text', (ctx) => this.messageHandler.handle(ctx));
    this.bot.on('callback_query:data', (ctx) => this.callbackHandler.handle(ctx));

    // 3) Central error boundary so a single bad update never crashes polling.
    this.bot.catch((err) => {
      this.logger.error(
        `Update ${err.ctx.update.update_id} failed: ${String(err.error)}`,
      );
    });

    // 4) Telegram command menu (the "Menu" button + "/" list).
    try {
      await this.bot.api.setMyCommands([
        { command: 'start', description: '\u{1F3AF} Yangi taqdimot yaratish' },
        { command: 'history', description: '\u{1F4C2} Mening taqdimotlarim' },
        { command: 'help', description: '\u2753 Yordam va qo\u2018llanma' },
      ]);
    } catch (err) {
      this.logger.warn(`setMyCommands failed: ${String(err)}`);
    }

    // 5) Long polling. Do NOT await: start() resolves only when the bot stops.
    this.polling = true;
    void this.bot.start({
      onStart: (info) =>
        this.logger.log(`Bot @${info.username} started (long polling)`),
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.polling) await this.bot.stop();
  }
}
