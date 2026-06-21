import { SLIDE_TYPES, SLIDE_GUIDE } from '../layout.catalog';

export interface OutlineParams {
  topic: string;
  slideCount: number;
  language: string;
  tone: string;
}

const GUIDE = Object.entries(SLIDE_GUIDE)
  .map(([k, v]) => `  * ${k}: ${v}`)
  .join('\n');

export const OUTLINE_SYSTEM = `You are a professional presentation architect, similar to Gamma.
Given a TOPIC, produce a slide-by-slide OUTLINE for a deck.

RULES:
- Output ONLY valid JSON. No prose, no markdown, no code fences.
- All text (deck_title, titles, key_points) must be written in OUTPUT_LANGUAGE.
- Each slide has a "type" chosen ONLY from this set: ${SLIDE_TYPES.join(', ')}.
- Type guidance:
${GUIDE}
- Slide 1 MUST be "TITLE". The LAST slide MUST be "CTA".
- Choose a VARIETY of types that genuinely fit the content; avoid repeating one type back-to-back.
- Maintain a logical arc: TITLE -> context/problem -> insight/solution -> evidence (stats/case) -> roadmap -> CTA.
- Keep titles short (max 9 words). Provide 2-4 short key_points per slide (hints only).
- Produce EXACTLY SLIDE_COUNT slides, positions starting at 1.

Required JSON shape:
{"deck_title": string, "slides": [{"position": number, "type": string, "title": string, "key_points": string[]}]}`;

export function buildOutlineUser(p: OutlineParams): string {
  return [
    `TOPIC: ${p.topic}`,
    `OUTPUT_LANGUAGE: ${p.language}`,
    `TONE: ${p.tone}`,
    `SLIDE_COUNT: ${p.slideCount}`,
  ].join('\n');
}
