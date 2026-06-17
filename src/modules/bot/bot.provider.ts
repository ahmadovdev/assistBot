import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot } from 'grammy';
import { BotContext } from './bot.types';

/** DI token for the single shared grammy Bot instance. */
export const BOT = Symbol('BOT');

export const botProvider: Provider = {
  provide: BOT,
  inject: [ConfigService],
  useFactory: (config: ConfigService): Bot<BotContext> => {
    const token = config.get<string>('app.telegram.botToken');
    // env validation guarantees the token exists at boot.
    return new Bot<BotContext>(token as string);
  },
};
