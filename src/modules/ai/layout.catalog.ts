/** The slide types the AI may use \u2014 ACADEMIC, for Uzbek university students.
 * Concept/explanation-driven, NOT number/pitch-driven. Stored in Slide.layout. */
export const SLIDE_TYPES = [
  'TITLE', 'AGENDA', 'CONTENT', 'DEFINITION', 'BATAFSIL',
  'MISOL', 'TURLAR', 'COMPARISON', 'PROCESS', 'TIMELINE',
  'STATS', 'CONCLUSION', 'REFERENCES', 'CLOSING',
  // Presentation-focused academic backbone. "Maqsad va vazifalar" is
  // intentionally excluded: it reads like kurs ishi/referat paperwork, not a
  // concise presentation slide.
  'RELEVANCE', 'OBJECT_SUBJECT', 'FINDING',
  'PROBLEMS_SOLUTIONS',
] as const;

export type SlideType = (typeof SLIDE_TYPES)[number];

export const SLIDE_EMOJI: Record<string, string> = {
  TITLE: '\u{1F393}', AGENDA: '\u{1F4CB}', CONTENT: '\u{1F4DD}',
  DEFINITION: '\u{1F4D6}', BATAFSIL: '\u{1F50D}', MISOL: '\u{1F4CC}', TURLAR: '\u{1F5C2}\uFE0F',
  COMPARISON: '\u2696\uFE0F', PROCESS: '\u{1F504}', TIMELINE: '\u{1F4C5}',
  STATS: '\u{1F4CA}', CONCLUSION: '\u{1F3AF}', REFERENCES: '\u{1F4DA}', CLOSING: '\u{1F64F}',
  RELEVANCE: '\u{1F525}', OBJECT_SUBJECT: '\u{1F52C}',
  FINDING: '\u{1F4A1}', PROBLEMS_SOLUTIONS: '\u{1F9E9}',
};

/** One-line guidance per type, injected into the outline prompt. */
export const SLIDE_GUIDE: Record<SlideType, string> = {
  TITLE: 'Academic title page: university/faculty, the TOPIC, and author/supervisor/year lines (slide 1 only).',
  AGENDA: 'The "Reja" / table of contents: exactly 4 concise items listing what the talk covers. Best as slide 2.',
  CONTENT: 'The WORKHORSE. Its title is a full-sentence ASSERTION (a claim), with 2-4 explanatory points below. Use for most explaining/teaching.',
  DEFINITION: 'Defines ONE key term/concept: the term, a clear definition, and a few defining aspects.',
  BATAFSIL: 'A deep-dive on ONE sub-topic: a rich explanatory paragraph plus a few key sub-points. For depth.',
  MISOL: 'A concrete, illustrative EXAMPLE that makes an abstract concept tangible.',
  TURLAR: 'A classification: the types / categories / kinds of the subject (2-4), each briefly explained.',
  COMPARISON: 'Two things side by side \u2014 their characteristics/differences in two columns (NOT which one "wins").',
  PROCESS: 'The stages/steps of how something happens or works (3-5).',
  TIMELINE: 'A chronology \u2014 dates and the events at each (great for history topics).',
  STATS: 'Key figures WITH a source. ONLY when the topic genuinely has real numbers (e.g. economics, statistics). Skip for purely qualitative topics.',
  CONCLUSION: 'The "Xulosa": 2-4 summary takeaways near the end.',
  REFERENCES: 'The "Foydalanilgan adabiyotlar": a list of 3-8 real sources (books/articles/sites).',
  CLOSING: 'A minimal thank-you slide with only the localized equivalent of "E\'tiboringiz uchun rahmat!" (always LAST).',
  RELEVANCE: 'The "Dolzarblik": why the topic matters NOW — a framing statement plus 2-3 concrete supporting points (add ONE figure only if genuinely real). Best early, after KIRISH.',
  OBJECT_SUBJECT: 'The "Ob\'ekt va predmet": the research OBJECT (what/who is studied) vs the PREDMET (which aspect of it is examined). Only for research-type topics.',
  FINDING: 'A single research RESULT stated as a claim-headline, with the evidence explained and a few supporting sub-points. Use in the results part of a kurs ishi / BMI.',
  PROBLEMS_SOLUTIONS: 'The "Muammolar va yechimlar": 2-3 matched pairs, each a concrete problem beside its proposed solution.',
};

/** Per-language writing guidance, injected into OUTPUT_LANGUAGE in the outline + card prompts. */
export const LANGUAGE_GUIDE: Record<string, string> = {
  uz: "Uzbek (o'zbek tili). Write in the Latin alphabet ONLY — never mix in Cyrillic. Use correct case and possessive suffixes with proper vowel harmony (e.g. \"kompaniyaning\", \"bozorda\", \"mijozlarga\"), natural word order (Subject + Object + Verb), and standard literary Uzbek. Do NOT produce literal word-for-word translations from Russian or English — rephrase naturally as a native speaker would.",
  ru: 'Russian (русский язык). Use natural, grammatically correct Russian with correct case endings and agreement.',
  en: 'English.',
  kaa: "Karakalpak (Qaraqalpaq tili). Write in the Latin alphabet ONLY — never mix in Cyrillic. Karakalpak is a DISTINCT Kipchak-Nogai language, NOT an Uzbek dialect — never substitute Uzbek grammar, vocabulary or suffixes, even though the two languages share the same country and script. Use the Karakalpak-specific Latin letters correctly where the word calls for them (Ǵ/ǵ, Ó/ó, Ń/ń, Ú/ú), correct case/possessive suffixes with proper vowel harmony, and natural Karakalpak word order (Subject + Object + Verb). Do NOT produce literal word-for-word translations from Uzbek, Russian or English — rephrase naturally as a native Karakalpak speaker would.",
};

export function languageGuide(code: string): string {
  return LANGUAGE_GUIDE[code] ?? code;
}

/** Per-language model override — e.g. Karakalpak reads noticeably more
 *  natural on Claude Sonnet 5 than on the deck's normally-configured model
 *  (user's own comparison). Falls back to `defaultModel` for every language
 *  without an override, so this never affects uz/ru/en. */
export const LANGUAGE_MODEL_OVERRIDE: Record<string, string> = {
  kaa: 'claude-sonnet-5',
};

export function resolveModel(defaultModel: string, language: string): string {
  return LANGUAGE_MODEL_OVERRIDE[language] ?? defaultModel;
}
