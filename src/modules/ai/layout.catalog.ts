/** The 13 slide types the AI may use. Stored in the Slide.layout column. */
export const SLIDE_TYPES = [
  'TITLE', 'STATS', 'PROBLEM', 'INSIGHT', 'COMPARISON', 'PROCESS',
  'TIMELINE', 'SOLUTION', 'OPPORTUNITY', 'CASE_STUDY', 'QUOTE', 'ROADMAP', 'CTA',
] as const;

export type SlideType = (typeof SLIDE_TYPES)[number];

export const SLIDE_EMOJI: Record<string, string> = {
  TITLE: '\u{1F3AC}', STATS: '\u{1F4CA}', PROBLEM: '\u26A0\uFE0F', INSIGHT: '\u{1F4A1}',
  COMPARISON: '\u2696\uFE0F', PROCESS: '\u{1F501}', TIMELINE: '\u{1F4C5}', SOLUTION: '\u2705',
  OPPORTUNITY: '\u{1F680}', CASE_STUDY: '\u{1F4C8}', QUOTE: '\u{1F4AC}', ROADMAP: '\u{1F5FA}\uFE0F', CTA: '\u{1F3AF}',
};

/** One-line guidance per type, injected into the outline prompt. */
export const SLIDE_GUIDE: Record<SlideType, string> = {
  TITLE: 'Opening slide: deck title + subtitle (slide 1 only).',
  STATS: 'A grid of 2-5 key numbers/metrics.',
  PROBLEM: 'A single bold problem statement, optional 3 supporting figures.',
  INSIGHT: 'One sharp realization/thesis with a short explanation. Also ideal as a CLOSING takeaway that wraps up the whole deck.',
  COMPARISON: 'Before vs after / old vs new, two columns of points.',
  PROCESS: 'A sequence of 3-5 steps (how it works).',
  TIMELINE: 'Dated milestones across time (3-5).',
  SOLUTION: 'The solution with up to 3 feature cards.',
  OPPORTUNITY: 'One huge headline number + a few supporting metrics (market size).',
  CASE_STUDY: 'A concrete example/customer with 2-4 result metrics.',
  QUOTE: 'A memorable statement with a persona attribution (not a real public figure).',
  ROADMAP: 'Phased plan ahead (3 phases with items).',
  CTA: 'Call to action (contact, sign up, invest). ONLY for sales/pitch/proposal decks \u2014 never for purely informational or educational topics.',
};

/** Per-language writing guidance, injected into OUTPUT_LANGUAGE in the outline + card prompts. */
export const LANGUAGE_GUIDE: Record<string, string> = {
  uz: "Uzbek (o'zbek tili). Write in the Latin alphabet ONLY \u2014 never mix in Cyrillic. Use correct case and possessive suffixes with proper vowel harmony (e.g. \"kompaniyaning\", \"bozorda\", \"mijozlarga\"), natural word order (Subject + Object + Verb), and standard literary Uzbek. Do NOT produce literal word-for-word translations from Russian or English \u2014 rephrase naturally as a native speaker would.",
  ru: 'Russian (\u0440\u0443\u0441\u0441\u043a\u0438\u0439 \u044f\u0437\u044b\u043a). Use natural, grammatically correct Russian with correct case endings and agreement.',
  en: 'English.',
};

export function languageGuide(code: string): string {
  return LANGUAGE_GUIDE[code] ?? code;
}
