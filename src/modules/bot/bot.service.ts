import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot } from 'grammy';
import { BotContext } from './bot.types';
import { UsersService } from '../users/users.service';
import { StartHandler } from './handlers/start.handler';
import { MessageHandler } from './handlers/message.handler';
import { CallbackHandler } from './handlers/callback.handler';

@Injectable()
export class BotService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(BotService.name);
  private bot?: Bot<BotContext>;

  constructor(
    private readonly config: ConfigService,
    private readonly users: UsersService,
    private readonly startHandler: StartHandler,
    private readonly messageHandler: MessageHandler,
    private readonly callbackHandler: CallbackHandler,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const token = this.config.get<string>('app.telegram.botToken');
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN missing \u2014 bot not started');
      return;
    }

    this.bot = new Bot<BotContext>(token);

    // 1) Auth middleware: resolve/attach our DB user on every update.
    this.bot.use(async (ctx, next) => {
      if (ctx.from && !ctx.from.is_bot) {
        ctx.user = await this.users.upsertFromTelegram(ctx.from);
      }
      await next();
    });

    // 2) Routes.
    this.bot.command('start', (ctx) => this.startHandler.handle(ctx));
    this.bot.on('message:text', (ctx) => this.messageHandler.handle(ctx));
    this.bot.on('callback_query:data', (ctx) => this.callbackHandler.handle(ctx));

    // 3) Central error boundary so a single bad update never crashes polling.
    this.bot.catch((err) => {
      this.logger.error(
        `Update ${err.ctx.update.update_id} failed: ${String(err.error)}`,
      );
    });

    // 4) Long polling. Do NOT await: start() resolves only when the bot stops.
    void this.bot.start({
      onStart: (info) =>
        this.logger.log(`Bot @${info.username} started (long polling)`),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.bot?.stop();
  }
}
