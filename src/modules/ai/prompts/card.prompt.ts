import { SlideType } from '../layout.catalog';

export interface CardInput {
  deckTitle: string;
  topic: string;
  language: string;
  tone: string;
  totalSlides: number;
  position: number;
  title: string;
  keyPoints: string[];
  type: SlideType;
}

export const CARD_SYSTEM = `You are an elite presentation content writer powering a Gamma-class deck builder. You write the content for ONE slide, of a given TYPE, as a single JSON object.

NON-NEGOTIABLE RULES:
- Output ONLY one valid JSON object. No prose, no markdown, no code fences.
- Match the EXACT JSON STRUCTURE given for this slide TYPE: exact keys, correct types, no extra keys.
- Write ALL human-readable text in OUTPUT_LANGUAGE, in a natural NATIVE voice. Honor the TONE.
- Be sharp and CONCRETE: real figures, named examples, specific outcomes. Invent plausible, realistic specifics that fit the topic; never contradict the SLIDE TITLE or KEY_POINTS.
- Slides are not documents. Keep it tight:
  * Headlines / statements: <= 14 words, punchy.
  * Supporting lines / bodies: 1-2 sentences.
  * Numbers ("value"): short tokens only ("94%", "$1.2M", "3x", "18h", "1200+").
  * Labels: 1-6 words.
- You MAY wrap at most ONE key phrase per text field in <strong>...</strong> for emphasis. Use NO other HTML.
- QUOTE slides: the author must be a PLAUSIBLE PERSONA relevant to the topic (e.g. a role + realistic name), NEVER a real, named public figure. "initials" must match the name.
- Use KEY_POINTS as the backbone but expand them into polished content.

You receive DECK context, the slide SPEC (type, title, key_points), the exact JSON STRUCTURE, and one EXAMPLE (English style reference; your output must be in OUTPUT_LANGUAGE). Produce JSON for THIS slide only.`;

interface Spec { structure: string; example: string; }

const SPECS: Record<SlideType, Spec> = {
  TITLE: {
    structure: '{ "kicker"?: string, "title": string, "subtitle"?: string, "meta"?: [{ "label": string, "value": string }] (0-4) }',
    example: '{"kicker":"AI Presentation Generator","title":"Turn one prompt into a board-ready deck","subtitle":"Built for teams who care how it looks.","meta":[{"label":"Sector","value":"SaaS"},{"label":"Year","value":"2026"}]}',
  },
  STATS: {
    structure: '{ "title": string, "subtitle"?: string, "stats": [{ "value": string, "label": string }] (2-5) }',
    example: '{"title":"The measurable impact","subtitle":"Across 12,000 decks last quarter.","stats":[{"value":"94%","label":"rated client-ready with no edits"},{"value":"2.4x","label":"faster outline to finished"},{"value":"18h","label":"saved per deck"}]}',
  },
  PROBLEM: {
    structure: '{ "kicker"?: string, "statement": string, "context"?: [{ "value": string, "description": string }] (0-3) }',
    example: '{"kicker":"The problem","statement":"Decks fail less from weak ideas than from the high cost of making them clear.","context":[{"value":"5.2 hrs","description":"median time spent per deck on layout, not analysis."},{"value":"68%","description":"of decks miss their review window."}]}',
  },
  INSIGHT: {
    structure: '{ "kicker"?: string, "statement": string, "body"?: string }',
    example: '{"kicker":"The insight","statement":"Design is not decoration \u2014 it is how trust is transferred.","body":"When the format is effortless to read, the argument feels more credible before a word is spoken."}',
  },
  COMPARISON: {
    structure: '{ "title": string, "subtitle"?: string, "before": { "label": string, "title"?: string, "items": string[] (2-5) }, "after": { "label": string, "title"?: string, "items": string[] (2-5) } }',
    example: '{"title":"Old way vs new way","before":{"label":"Before","title":"Manual decks","items":["Hours in slide tools","Inconsistent branding","Rebuilt from scratch"]},"after":{"label":"After","title":"Generated decks","items":["Minutes from prompt","On-brand by default","Edit, don\'t rebuild"]}}',
  },
  PROCESS: {
    structure: '{ "title": string, "subtitle"?: string, "steps": [{ "label"?: string, "title": string, "body": string }] (2-5) }',
    example: '{"title":"How it works","steps":[{"label":"Step 1","title":"Describe","body":"Type your topic and audience."},{"label":"Step 2","title":"Generate","body":"AI drafts a structured outline."},{"label":"Step 3","title":"Refine","body":"Tweak, then export to PDF."}]}',
  },
  TIMELINE: {
    structure: '{ "title": string, "subtitle"?: string, "steps": [{ "date": string, "title": string, "body": string }] (2-5) }',
    example: '{"title":"Our path so far","steps":[{"date":"2023","title":"Founded","body":"First prototype shipped."},{"date":"2024","title":"Traction","body":"1,000 paying teams."},{"date":"2025","title":"Scale","body":"Enterprise launch."}]}',
  },
  SOLUTION: {
    structure: '{ "kicker"?: string, "title": string, "body"?: string, "features"?: [{ "title": string, "body": string }] (0-3) }',
    example: '{"kicker":"The solution","title":"One engine, three guarantees","body":"Structure, design and content handled together.","features":[{"title":"Structured","body":"A clear narrative arc every time."},{"title":"On-brand","body":"Themes apply consistently."},{"title":"Fast","body":"Minutes, not hours."}]}',
  },
  OPPORTUNITY: {
    structure: '{ "title": string, "subtitle"?: string, "big": { "value": string, "label": string }, "supports"?: [{ "value": string, "label": string }] (0-4) }',
    example: '{"title":"A market at an inflection point","subtitle":"Demand is outpacing the tools.","big":{"value":"$12B","label":"presentation software market by 2027"},"supports":[{"value":"35M","label":"knowledge workers"},{"value":"21%","label":"annual growth"}]}',
  },
  CASE_STUDY: {
    structure: '{ "kicker"?: string, "title": string, "body": string, "customer"?: string, "metrics": [{ "value": string, "label": string }] (2-4) }',
    example: '{"kicker":"Case study","title":"From 6 hours to 20 minutes","body":"A 12-person consultancy replaced its manual deck workflow and reclaimed a full day each week.","customer":"Mid-size strategy firm","metrics":[{"value":"18x","label":"faster"},{"value":"40%","label":"more pitches sent"}]}',
  },
  QUOTE: {
    structure: '{ "kicker"?: string, "quote": string, "author": { "initials": string, "name": string, "role": string } }',
    example: '{"kicker":"Why it matters","quote":"We stopped dreading decks and started shipping them daily.","author":{"initials":"DK","name":"Diyora Karimova","role":"Head of Product, fictional persona"}}',
  },
  ROADMAP: {
    structure: '{ "title": string, "subtitle"?: string, "phases": [{ "date": string, "title": string, "body": string, "items"?: string[] (0-4) }] (2-4) }',
    example: '{"title":"Where we go next","phases":[{"date":"Q1","title":"Foundation","body":"Core engine and themes.","items":["5 themes","PDF export"]},{"date":"Q2","title":"Scale","body":"Team features.","items":["Shared decks","Brand kits"]},{"date":"Q3","title":"Expand","body":"New formats.","items":["Web export"]}]}',
  },
  CTA: {
    structure: '{ "kicker"?: string, "title": string, "body"?: string, "actions": [{ "label": string, "primary"?: boolean }] (1-3), "footnote"?: string }',
    example: '{"kicker":"Get started","title":"Build your first deck today","body":"Five free slides, no card required.","actions":[{"label":"Start free","primary":true},{"label":"See examples"}],"footnote":"Join 12,000 teams already shipping."}',
  },
};

export function buildCardUser(input: CardInput): string {
  const spec = SPECS[input.type];
  return [
    `DECK_TITLE: ${input.deckTitle}`,
    `TOPIC: ${input.topic}`,
    `OUTPUT_LANGUAGE: ${input.language}`,
    `TONE: ${input.tone}`,
    `TOTAL_SLIDES: ${input.totalSlides}`,
    '',
    'SLIDE SPEC:',
    `  position: ${input.position}`,
    `  type: ${input.type}`,
    `  title: ${input.title}`,
    `  key_points: ${JSON.stringify(input.keyPoints)}`,
    '',
    `JSON STRUCTURE: ${spec.structure}`,
    '',
    'EXAMPLE (English style reference; output MUST be in OUTPUT_LANGUAGE):',
    spec.example,
    '',
    'Now produce the JSON object for THIS slide. Output ONLY the JSON.',
  ].join('\n');
}
