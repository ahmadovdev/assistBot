import { Injectable, Logger } from '@nestjs/common';
import { imageCountForSlideCount, rankVisualCandidates } from './visual.policy';
import { SlideVisual, VisualSlideInput } from './visual.types';

function text(value: unknown): string {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clamp(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, Math.max(0, max - 1)).trim()}…` : value;
}

@Injectable()
export class TopicVisualService {
  private readonly logger = new Logger(TopicVisualService.name);

  async enrichSlides(
    slides: VisualSlideInput[],
    topic: string,
    _language: string,
  ): Promise<VisualSlideInput[]> {
    const desired = imageCountForSlideCount(slides.length);
    if (!desired) return slides;

    const enriched = slides.map((slide) => ({ ...slide, content: { ...slide.content } }));
    const used = new Set<number>();

    for (let slot = 0; slot < desired; slot += 1) {
      const slide = rankVisualCandidates(enriched, slot, desired, used)[0];
      if (!slide) break;

      const visual = this.createVisual(topic, slide.content, slot);
      slide.content.visual = visual;
      used.add(slide.position);
      this.logger.log(`Geometric visual attached: slide=${slide.position} type=${slide.layout} slot=${slot + 1}/${desired}`);
    }

    return enriched;
  }

  private createVisual(topic: string, content: Record<string, unknown>, slot: number): SlideVisual {
    const title = text(content.title ?? topic);
    return {
      provider: 'Lumio Geometry',
      query: `${topic} ${clamp(title, 90)} slot-${slot + 1}`,
      url: '',
      alt: `Geometric decoration for ${title || topic}`,
      author: 'Generated geometric layout',
      license: 'decorative visual',
      fit: 'cover',
    };
  }
}
