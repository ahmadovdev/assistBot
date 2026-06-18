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

@Injectable()
export class BotService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(BotService.name);

  constructor(
    @Inject(BOT) private readonly bot: Bot<BotContext>,
    private readonly users: UsersService,
    private readonly startHandler: StartHandler,
    private readonly messageHandler: MessageHandler,
    private readonly callbackHandler: CallbackHandler,
    private readonly debugHandler: DebugHandler,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    // 1) Auth middleware: resolve/attach our DB user on every update.
    this.bot.use(async (ctx, next) => {
      if (ctx.from && !ctx.from.is_bot) {
        ctx.user = await this.users.upsertFromTelegram(ctx.from);
      }
      await next();
    });

    // 2) Routes.
    this.bot.command('start', (ctx) => this.startHandler.handle(ctx));
    this.bot.command('debug', (ctx) => this.debugHandler.handle(ctx));
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
    await this.bot.stop();
  }
}
