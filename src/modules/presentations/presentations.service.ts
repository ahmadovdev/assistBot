import { Injectable } from '@nestjs/common';
import { Presentation } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { WizardContext } from '../bot/bot.types';

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
        // status defaults to 'draft'
      },
    });
  }
}
