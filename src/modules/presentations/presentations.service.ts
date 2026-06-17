import { Injectable } from '@nestjs/common';
import {
  JobStage,
  JobStatus,
  Prisma,
  Presentation,
  PresentationStatus,
  Theme,
  User,
} from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { WizardContext } from '../bot/bot.types';

export type PresentationWithRelations = Presentation & { user: User; theme: Theme | null };

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
