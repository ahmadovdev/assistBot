import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

export interface SlideInput {
  position: number;
  layout: string;
  content: unknown;
}

@Injectable()
export class SlidesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Atomically replace all slides of a presentation (safe for regeneration). */
  async replaceAll(presentationId: string, slides: SlideInput[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.slide.deleteMany({ where: { presentationId } }),
      this.prisma.slide.createMany({
        data: slides.map((s) => ({
          presentationId,
          position: s.position,
          layout: s.layout,
          content: s.content as Prisma.InputJsonValue,
          status: 'generated' as const,
        })),
      }),
    ]);
  }
}
