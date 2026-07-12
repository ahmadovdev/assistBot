import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { SlideVisual } from '../visuals/visual.types';

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
    await this.prisma.$transaction(async (tx) => {
      await tx.slide.deleteMany({ where: { presentationId } });
      await tx.slide.createMany({
        data: slides.map((s) => ({
          presentationId,
          position: s.position,
          layout: s.layout,
          content: s.content as Prisma.InputJsonValue,
          status: 'generated' as const,
        })),
      });

      const created = await tx.slide.findMany({
        where: { presentationId },
        select: { id: true, position: true },
      });
      const idByPosition = new Map(created.map((slide) => [slide.position, slide.id]));
      const assets = slides.flatMap((slide) => {
        const content = (slide.content ?? {}) as Record<string, unknown>;
        const visual = content.visual as SlideVisual | undefined;
        const slideId = idByPosition.get(slide.position);
        if (!slideId || !visual?.url) return [];
        return [{
          slideId,
          type: 'image' as const,
          prompt: visual.query,
          provider: visual.provider,
          url: visual.url,
          status: 'done' as const,
          meta: {
            sourceUrl: visual.sourceUrl,
            author: visual.author,
            license: visual.license,
            licenseUrl: visual.licenseUrl ?? null,
            fit: visual.fit ?? 'cover',
            alt: visual.alt,
            width: visual.width ?? null,
            height: visual.height ?? null,
          } as Prisma.InputJsonValue,
        }];
      });
      if (assets.length) await tx.asset.createMany({ data: assets });
    });
  }
}
