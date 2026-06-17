import { TIER1_LAYOUTS } from '../layout.catalog';

export interface OutlineParams {
  topic: string;
  slideCount: number;
  language: string;
  tone: string;
}

export const OUTLINE_SYSTEM = `You are a professional presentation architect, similar to Gamma.
Given a TOPIC, produce a slide-by-slide OUTLINE for a deck.

RULES:
- Output ONLY valid JSON. No prose, no markdown, no code fences.
- All text (deck_title, titles, key_points) must be written in OUTPUT_LANGUAGE.
- Each slide has a "layout" chosen ONLY from this catalog: ${TIER1_LAYOUTS.join(', ')}.
- Layout guidance:
  * Slide 1 is ALWAYS "cover".
  * "stats_grid" when the slide centers on numbers/metrics.
  * "three_columns" for exactly 3 parallel items.
  * "image_text" when one idea benefits from a supporting illustration.
  * "bullet_list" for a list of points; "lead_paragraph" for an explanatory intro.
  * The LAST slide MUST be "split_conclusion" (summary + next steps).
- Keep titles short (max 8 words). Provide 2-4 short key_points per slide (hints only).
- Maintain a logical arc: intro -> body -> conclusion.
- Produce EXACTLY SLIDE_COUNT slides, positions starting at 1.

Required JSON shape:
{"deck_title": string, "slides": [{"position": number, "layout": string, "title": string, "key_points": string[]}]}`;

export function buildOutlineUser(p: OutlineParams): string {
  return [
    `TOPIC: ${p.topic}`,
    `OUTPUT_LANGUAGE: ${p.language}`,
    `TONE: ${p.tone}`,
    `SLIDE_COUNT: ${p.slideCount}`,
  ].join('\n');
}
