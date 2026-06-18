import { Inject, Injectable } from '@nestjs/common';
import { Bot, InlineKeyboard, InputFile } from 'grammy';
import { Message } from 'grammy/types';
import { BOT } from './bot.provider';
import { BotContext } from './bot.types';

/**
 * Lets background workers (which have no grammy ctx) push messages to a user
 * by their Telegram id, using the shared Bot's API.
 */
@Injectable()
export class BotSender {
  constructor(@Inject(BOT) private readonly bot: Bot<BotContext>) {}

  sendMessage(chatId: number, text: string, keyboard?: InlineKeyboard): Promise<unknown> {
    return this.bot.api.sendMessage(chatId, text, {
      reply_markup: keyboard,
    });
  }

  sendDocument(
    chatId: number,
    buffer: Buffer,
    filename: string,
    caption?: string,
  ): Promise<Message.DocumentMessage> {
    return this.bot.api.sendDocument(chatId, new InputFile(buffer, filename), { caption });
  }
}
