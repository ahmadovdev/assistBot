import { VisualSlideInput } from './visual.types';

const VISUAL_LAYOUTS = new Set(['CONTENT']);

function hasProseParagraph(slide: VisualSlideInput): boolean {
  return typeof slide.content?.paragraph === 'string' && slide.content.paragraph.trim().length > 0;
}

export function imageCountForSlideCount(slideCount: number): 0 | 1 | 2 {
  if (slideCount < 10) return 0;
  if (slideCount < 15) return 1;
  return 2;
}

/**
 * Returns eligible slides ordered for each visual slot. The anchors keep two
 * visuals separated across a long deck while avoiding example/case-study
 * slides, where a topic-level image can clash with the specific scenario.
 */
export function rankVisualCandidates(
  slides: VisualSlideInput[],
  slot: number,
  totalSlots: number,
  excludedPositions: ReadonlySet<number> = new Set(),
): VisualSlideInput[] {
  // For two-image decks, resolve the later slot first. If two queries map to
  // the same Commons file, the duplicate fallback then moves toward the
  // earlier anchor instead of clustering both visuals in the first half.
  const anchor = totalSlots === 1 ? 0.55 : slot === 0 ? 0.70 : 0.34;
  const total = Math.max(slides.length, 1);

  return slides
    .filter((slide) =>
      VISUAL_LAYOUTS.has(slide.layout) &&
      !hasProseParagraph(slide) &&
      !excludedPositions.has(slide.position),
    )
    .map((slide) => {
      const normalizedPosition = slide.position / total;
      return { slide, score: Math.abs(normalizedPosition - anchor) };
    })
    .sort((a, b) => a.score - b.score || a.slide.position - b.slide.position)
    .map(({ slide }) => slide);
}
