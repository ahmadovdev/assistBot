import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { BotState } from './bot.constants';

export interface SessionData {
  state: BotState;
  context: Record<string, unknown>;
}

/**
 * FSM session persisted in the `bot_sessions` table (keyed by internal user id).
 * Survives restarts — unlike in-memory grammy sessions.
 */
@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: bigint): Promise<SessionData> {
    const row = await this.prisma.botSession.findUnique({ where: { userId } });
    return {
      state: (row?.state as BotState) ?? BotState.IDLE,
      context: (row?.context as Record<string, unknown> | null) ?? {},
    };
  }

  async setState(userId: bigint, state: BotState): Promise<void> {
    await this.prisma.botSession.upsert({
      where: { userId },
      create: { userId, state, context: {} },
      update: { state },
    });
  }

  /** Shallow-merge new values into the stored context. */
  async patchContext(userId: bigint, patch: Record<string, unknown>): Promise<void> {
    const current = await this.get(userId);
    const merged = { ...current.context, ...patch } as Prisma.InputJsonValue;
    await this.prisma.botSession.upsert({
      where: { userId },
      create: { userId, state: current.state, context: merged },
      update: { context: merged },
    });
  }

  async reset(userId: bigint): Promise<void> {
    await this.prisma.botSession.upsert({
      where: { userId },
      create: { userId, state: BotState.IDLE, context: {} },
      update: { state: BotState.IDLE, context: {} },
    });
  }
}
