import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

/** Minimal shape of Telegram's `ctx.from`, decoupled from grammy types. */
interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
  language_code?: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Create the user on first contact, or refresh their profile fields. */
  async upsertFromTelegram(from: TelegramUser): Promise<User> {
    const telegramId = BigInt(from.id);

    return this.prisma.user.upsert({
      where: { telegramId },
      create: {
        telegramId,
        username: from.username ?? null,
        firstName: from.first_name ?? null,
        languageCode: from.language_code ?? 'uz',
      },
      update: {
        username: from.username ?? null,
        firstName: from.first_name ?? null,
      },
    });
  }
}
