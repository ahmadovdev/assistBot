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
- Slide 1 MUST be "TITLE". The LAST slide MUST CONCLUDE the deck and fit the topic:
  * Use "INSIGHT" for a closing takeaway / summary of the whole deck (DEFAULT for informational, educational, analytical or general topics).
  * Use "ROADMAP" when the natural ending is a forward plan / next phases.
  * Use "CTA" ONLY for sales, pitch, fundraising or proposal decks where a genuine call-to-action (contact us, invest, sign up) is appropriate.
  * NEVER end an informational or educational deck with a salesy CTA. The ending should wrap up the SUBJECT, not advertise a service.
- Maintain a logical arc: TITLE -> context/problem -> insight/solution -> evidence (stats/case/comparison) -> optional roadmap -> a fitting CONCLUSION.
- Choose a VARIETY of types that genuinely fit the content; avoid repeating one type back-to-back.
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
