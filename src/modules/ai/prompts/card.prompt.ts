import { Tier1Layout } from '../layout.catalog';

export interface CardInput {
  deckTitle: string;
  topic: string;
  language: string;
  tone: string;
  totalSlides: number;
  position: number;
  title: string;
  keyPoints: string[];
  layout: Tier1Layout;
}

/**
 * Gamma-class card writer. The quality bar lives here: sharp, concrete,
 * presentation-grade copy with zero filler, plus art-directed image prompts.
 */
export const CARD_SYSTEM = `You are an elite presentation content designer — the writing engine behind a Gamma-class deck builder. You write the content for ONE slide at a time. Your copy is sharp, concrete, and presentation-grade: short scannable lines, real substance, zero filler.

NON-NEGOTIABLE RULES:
- Output ONLY a single valid JSON object. No prose, no markdown, no code fences.
- Write ALL human-readable text in OUTPUT_LANGUAGE, in a natural NATIVE voice — never translated-sounding. Honor the requested TONE.
- Match the EXACT JSON STRUCTURE given for this slide's LAYOUT: exact keys, no extra keys, no missing keys, correct types.
- Slides are NOT documents. Be ruthless about length:
  * Titles: punchy, <= 8 words, no trailing period.
  * Body: 1-2 sentences, <= 40 words. NEVER restate the title.
  * Headings/labels: 1-4 words. Stat "value": short tokens only ("300+", "$120M", "70%", "12").
- Be CONCRETE: favor specific facts, figures and named examples over vague claims. You may invent plausible, realistic specifics that fit the topic, but NEVER contradict the slide's KEY_POINTS.
- BANNED filler — never write: "in today's world", "it is important to note", "the realm of", "ever-evolving", "plays a crucial role", empty intros that say nothing. Cut all throat-clearing.
- Treat KEY_POINTS as the backbone of the slide, but EXPAND them into polished copy — do not paste them verbatim.
- IMAGE prompts: always written in ENGLISH (even if OUTPUT_LANGUAGE differs). Art-direct them — subject + style + mood + composition. Prefer "flat editorial illustration" / "clean vector" styles, no text inside the image. Always set "url": null.
- "icon" fields (when present) must be a single emoji that fits the item.

You receive the DECK context, this slide's SPEC, the LAYOUT, its exact JSON STRUCTURE, and one EXAMPLE for that layout (a style reference in English — your output must be in OUTPUT_LANGUAGE). Produce the JSON for THIS slide only.`;

interface LayoutSpec {
  structure: string;
  example: string;
}

const LAYOUT_SPECS: Record<Tier1Layout, LayoutSpec> = {
  cover: {
    structure:
      '{ "title": string, "subtitle": string, "tags": string[] (0-4 short tags), "image": { "prompt": string, "url": null } }',
    example:
      '{"title":"The Future of Urban Mobility","subtitle":"How electric micro-transit is reshaping how cities move","tags":["2025","MOBILITY","CITIES"],"image":{"prompt":"flat editorial illustration of a sleek electric scooter gliding through a sunlit modern city street, warm tones, clean lines","url":null}}',
  },
  lead_paragraph: {
    structure:
      '{ "title": string, "body": string (1-2 sentences), "image"?: { "prompt": string, "url": null } }',
    example:
      '{"title":"A Market at an Inflection Point","body":"Micro-transit ridership tripled in three years as cities raced to cut congestion and emissions. The infrastructure, however, is still catching up.","image":{"prompt":"flat editorial illustration of a busy bike-share dock at golden hour, clean vector style","url":null}}',
  },
  bullet_list: {
    structure:
      '{ "title": string, "body"?: string, "bullets": [{ "text": string }] (2-6 items, each one crisp sentence) }',
    example:
      '{"title":"Why Adoption Stalls","body":"Three friction points keep riders from switching.","bullets":[{"text":"Patchy vehicle availability during peak commute hours."},{"text":"Confusing pricing split across four separate apps."},{"text":"Sparse safe-parking zones outside the city core."}]}',
  },
  stats_grid: {
    structure:
      '{ "title": string, "body"?: string, "stats": [{ "value": string (short token), "label": string (1-3 words), "desc"?: string }] (2-4 items) }',
    example:
      '{"title":"The Market in Numbers","body":"Growth is real, but capital lags demand.","stats":[{"value":"3x","label":"Ridership","desc":"Growth over three years"},{"value":"$120M","label":"Invested","desc":"2021-2024 total"},{"value":"40%","label":"Emissions cut","desc":"Per trip vs car"}]}',
  },
  image_text: {
    structure:
      '{ "title": string, "body": string, "points": string[] (0-4 short points), "image": { "prompt": string, "url": null }, "image_side": "left" | "right" }',
    example:
      '{"title":"Designed for the Last Mile","body":"Lightweight vehicles close the gap between transit stops and front doors.","points":["Foldable, 12kg frame","Swappable battery","Geo-fenced parking"],"image":{"prompt":"flat editorial illustration of a commuter folding an e-scooter beside a train platform, warm palette","url":null},"image_side":"right"}',
  },
  three_columns: {
    structure:
      '{ "title": string, "body"?: string, "columns": [{ "heading": string, "text": string, "icon"?: string (single emoji) }] (exactly 3) }',
    example:
      '{"title":"Three Pillars of Rollout","columns":[{"heading":"Coverage","text":"Dense networks within a 300m walk of any rider.","icon":"📍"},{"heading":"Pricing","text":"One flat tap-to-ride fare across all vehicles.","icon":"💳"},{"heading":"Safety","text":"Protected lanes and mandatory speed caps.","icon":"🛡"}]}',
  },
  split_conclusion: {
    structure:
      '{ "title": string, "summary": [{ "heading": string, "text": string }] (2-4 items), "next_steps": [{ "number": string, "text": string }] (1-4 items) }',
    example:
      '{"title":"Where We Go From Here","summary":[{"heading":"Demand is proven","text":"Riders have voted with millions of trips."},{"heading":"Infrastructure lags","text":"Parking and lanes need public investment."}],"next_steps":[{"number":"01","text":"Pilot unified fares in two districts by Q3."},{"number":"02","text":"Add 500 protected parking bays citywide."}]}',
  },
};

export function buildCardUser(input: CardInput): string {
  const spec = LAYOUT_SPECS[input.layout];
  return [
    `DECK_TITLE: ${input.deckTitle}`,
    `TOPIC: ${input.topic}`,
    `OUTPUT_LANGUAGE: ${input.language}`,
    `TONE: ${input.tone}`,
    `TOTAL_SLIDES: ${input.totalSlides}`,
    '',
    'SLIDE SPEC:',
    `  position: ${input.position}`,
    `  title: ${input.title}`,
    `  key_points: ${JSON.stringify(input.keyPoints)}`,
    '',
    `LAYOUT: ${input.layout}`,
    `JSON STRUCTURE: ${spec.structure}`,
    '',
    'EXAMPLE (style reference in English; your output MUST be in OUTPUT_LANGUAGE):',
    spec.example,
    '',
    'Now produce the JSON object for THIS slide. Output ONLY the JSON.',
  ].join('\n');
}
