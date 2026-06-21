import { Injectable } from '@nestjs/common';
import {
  Export,
  ExportFormat,
  JobStage,
  JobStatus,
  Prisma,
  Presentation,
  PresentationStatus,
  Slide,
  Theme,
  User,
} from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { WizardContext } from '../bot/bot.types';

export type PresentationWithRelations = Presentation & { user: User; theme: Theme | null };
export type PresentationForRender = Presentation & {
  user: User;
  theme: Theme | null;
  slides: Slide[];
};

@Injectable()
export class PresentationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Persist a presentation from the data collected by the bot wizard. */
  async createFromWizard(
    userId: bigint,
    themeId: string,
    ctx: WizardContext,
  ): Promise<Presentation> {
    return this.prisma.presentation.create({
      data: {
        userId,
        themeId,
        topicPrompt: ctx.topic ?? '',
        language: ctx.language ?? 'uz',
        tone: ctx.tone ?? 'professional',
        slideCount: ctx.slideCount ?? 10,
      },
    });
  }

  findByIdWithUser(id: string): Promise<PresentationWithRelations | null> {
    return this.prisma.presentation.findUnique({
      where: { id },
      include: { user: true, theme: true },
    });
  }

  /** Latest presentation for a user, with its slides ordered by position. */
  findLatestWithSlides(
    userId: bigint,
  ): Promise<(Presentation & { slides: Slide[] }) | null> {
    return this.prisma.presentation.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { slides: { orderBy: { position: 'asc' } } },
    });
  }

  /** Full payload needed by the render worker: user + theme + ordered slides. */
  findByIdForRender(id: string): Promise<PresentationForRender | null> {
    return this.prisma.presentation.findUnique({
      where: { id },
      include: { user: true, theme: true, slides: { orderBy: { position: 'asc' } } },
    });
  }

  /** Recent presentations for /history, with the latest cached PDF file id. */
  listRecent(userId: bigint, limit = 8): Promise<(Presentation & { exports: Export[] })[]> {
    return this.prisma.presentation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        exports: {
          where: { telegramFileId: { not: null } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  latestFileId(presentationId: string, userId: bigint): Promise<string | null> {
    return this.prisma.export
      .findFirst({
        where: { presentationId, telegramFileId: { not: null }, presentation: { userId } },
        orderBy: { createdAt: 'desc' },
      })
      .then((e: { telegramFileId: string | null } | null) => e?.telegramFileId ?? null);
  }

  recordExport(
    presentationId: string,
    data: {
      format: ExportFormat;
      storageKey: string;
      telegramFileId?: string;
      fileSize?: number;
    },
  ): Promise<void> {
    return this.prisma.export
      .create({
        data: {
          presentationId,
          format: data.format,
          storageKey: data.storageKey,
          telegramFileId: data.telegramFileId,
          fileSize: data.fileSize,
        },
      })
      .then(() => undefined);
  }

  setStatus(
    id: string,
    status: PresentationStatus,
    errorMessage?: string,
  ): Promise<Presentation> {
    return this.prisma.presentation.update({
      where: { id },
      data: { status, errorMessage: errorMessage ?? null },
    });
  }

  async getOutlineRaw(id: string): Promise<unknown> {
    const p = await this.prisma.presentation.findUnique({
      where: { id },
      select: { outline: true },
    });
    return p?.outline ?? null;
  }

  saveOutline(id: string, outline: unknown): Promise<Presentation> {
    return this.prisma.presentation.update({
      where: { id },
      data: {
        outline: outline as Prisma.InputJsonValue,
        status: 'outlined',
        errorMessage: null,
      },
    });
  }

  recordJob(
    presentationId: string,
    data: {
      stage: JobStage;
      status: JobStatus;
      modelUsed?: string;
      tokensUsed?: number;
    },
  ): Promise<void> {
    return this.prisma.generationJob
      .create({
        data: {
          presentationId,
          stage: data.stage,
          status: data.status,
          modelUsed: data.modelUsed,
          tokensUsed: data.tokensUsed,
          finishedAt: new Date(),
        },
      })
      .then(() => undefined);
  }
}
