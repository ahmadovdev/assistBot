import { SlideType, languageGuide } from '../layout.catalog';
import { ICON_NAMES } from '../../render/templates/icons';
import { PROSE_SPECS, PROSE_SYSTEM_ADDENDUM } from './card.prompt.prose';

const ICON_USING_TYPES: SlideType[] = ['CONTENT', 'DEFINITION', 'TURLAR', 'MISOL'];

export interface CardInput {
  deckTitle: string;
  topic: string;
  language: string;
  totalSlides: number;
  position: number;
  title: string;
  keyPoints: string[];
  type: SlideType;
  /** Deck-coherence context (from the deck brief). All optional — absent on fallback. */
  deckThesis?: string;
  deckNarrative?: string;
  sharedFacts?: string[];
  slideFocus?: string;
  /** Ordered "N. TYPE — Title" lines for every slide, so this card avoids repeating others. */
  outlineTitles?: string[];
  /** Card-based points/bullets (default) vs one flowing paragraph — see
   *  card.prompt.prose.ts. Only affects types with a prose variant; every
   *  other type ignores this and always uses its normal card structure. */
  contentMode?: 'cards' | 'prose';
}

export const CARD_SYSTEM = `You are an expert ACADEMIC content writer creating one slide of a university student's presentation (referat / kurs ishi / mavzu taqdimoti). Your job is to EXPLAIN a subject clearly, accurately and at an academic level — never to pitch, sell or hype. You write the content for ONE slide, of a given TYPE, as a single JSON object.

NON-NEGOTIABLE RULES:
- Output ONLY one valid JSON object. No prose, no markdown, no code fences.
- Match the EXACT JSON STRUCTURE given for this slide TYPE: exact keys, correct types, no extra keys.
- Write ALL human-readable text in OUTPUT_LANGUAGE, in a natural NATIVE academic voice.
- VOICE: clear, precise, educational and academically rigorous. Use correct terminology. Explain concepts so a student audience genuinely understands. Never salesy, never marketing-speak.
- ASSERTION-EVIDENCE: a slide's TITLE should state a full, meaningful POINT (a claim/takeaway), not a vague label. Prefer "Fotosintez quyosh energiyasini kimyoviy energiyaga aylantiradi" over just "Fotosintez". The body then explains that point.
- ACCURACY OVER INVENTION (STRICT): write TRUE, well-established facts. NEVER fabricate precise specifics — no invented statistics, decree/law numbers (e.g. "PF-1234"), page numbers, dates, or specific author names. Use a figure/source ONLY if it is genuinely real and widely known; otherwise stay general (no fake precision). An EMPTY stats/references list is BETTER than a fabricated one — when in doubt, omit.
- LENGTH IS A HARD CONSTRAINT. Each slide is a FIXED-SIZE canvas: text that is too long overflows and breaks the layout \u2014 this is a critical failure. Respect EVERY character limit given in the JSON STRUCTURE exactly. When in doubt, write SHORTER. Tight is always better than full.
  * Titles / claims: a full-sentence assertion, but kept concise — HARD LIMIT ~80 characters (these render very large; longer WILL overflow).
  * Bodies / explanations: 1-3 clear sentences that actually teach; respect the char cap.
  * Labels: 1-4 words.
- You MAY wrap at most ONE key phrase per text field in <strong>...</strong> for emphasis. Use NO other HTML.
- Use KEY_POINTS as the backbone but expand them into polished, CONCISE content.
- Provide genuine, specific content for context fields (subtitle, description, body) \u2014 but always within the length limits. A short, sharp line beats a long, full one.

DECK COHERENCE (honor whenever these are provided):
- You are writing ONE slide inside a larger, coherent deck. Serve the DECK_THESIS and advance the DECK_NARRATIVE.
- Make ONLY this slide's THIS_SLIDE_FOCUS. Do NOT repeat points already owned by other slides (see DECK_OUTLINE) \u2014 each slide must add something new.
- Reuse the SHARED_FACTS verbatim where relevant; never invent figures that contradict them. These are the deck's single source of truth. If SHARED_FACTS contains no verified number/source for this slide, keep the claim conceptual instead of adding precise data.
- Depth over breadth: make one sharp, well-supported point (with a mechanism, named example, or cause-and-effect) rather than several shallow assertions — but ALWAYS within the character limits. Coherence and depth never justify overflowing the slide.
- ADAPTIVE CONTENT DENSITY for structured slides: with 2 items, make each explanation substantial and close to its allowed character limit; with 3 items, use medium-depth explanations; with 4 or more, keep each item concise. Add useful substance, never repetition or filler.

You receive DECK context, the slide SPEC (type, title, key_points), the exact JSON STRUCTURE, and one EXAMPLE (English style reference; your output must be in OUTPUT_LANGUAGE). Produce JSON for THIS slide only.`;

interface Spec { structure: string; example: string; }

const SPECS: Record<SlideType, Spec> = {
  TITLE: {
    structure: '{ "layout": one of "editorial_split" | "classical_centered" | "bento_academic" | "typographic_statement" | "vertical_ribbon" (CHOOSE by the topic\'s academic field: editorial_split → iqtisod/huquq/boshqaruv/tibbiyot; classical_centered → fizika/matematika/kimyo/pedagogika/falsafa (conservative, safest); bento_academic → IT/informatika/muhandislik/dizayn; typographic_statement → ONLY if the mavzu is ≤8 words (adabiyot/san\'at); vertical_ribbon → tarix/o\'zbek adabiyoti/sharqshunoslik/milliy mavzular), "title": string (the MAVZU — a clean academic thesis title, NOT a sentence; the single largest element), "subtitle"?: string (optional one-line clarifier, max 180) }. Do NOT invent a university, faculty, student name, advisor, city or year — those are supplied separately by the user.',
    example: '{"layout":"vertical_ribbon","title":"Amir Temur va uning markazlashgan davlati"}',
  },
  STATS: {
    structure: '{ "title": string (≤68 chars), "subtitle": string (short framing sentence, REQUIRED, max 105 chars), "stats": [{ "value": string (JUST the number core, e.g. "56", "90", "3.4" — NO unit, NO "~", max 10 chars), "unit"?: string (unit separately, max 14 chars), "approx"?: boolean (true if approximate — renders a "~"), "label": string (max 28 chars), "description": string (ONE compact context line, max 54 chars, REQUIRED) }] (0-3 IDEAL; 4 ONLY if every label/description is very short; include ONLY genuinely REAL, widely known figures; if unsure, return [] — NEVER invent numbers), "insight": string (one-line takeaway, REQUIRED when stats present, max 82 chars), "source"?: string (REQUIRED when stats is non-empty, max 55 chars; omit only when stats is []) }',
    example: '{"title":"Photosynthesis works at planetary scale","subtitle":"A few figures show why the process matters globally.","stats":[{"value":"100","unit":"bln tonnes","approx":true,"label":"carbon fixed","description":"estimated each year by photosynthesis"},{"value":"50","unit":"%","label":"oxygen share","description":"linked to ocean phytoplankton"},{"value":"3.4","unit":"bln years","approx":true,"label":"evolution age","description":"early photosynthesis timeline"}],"insight":"Almost all food chains start from this energy conversion.","source":"Field et al., Science, 1998"}',
  },
  BATAFSIL: {
    structure: '{ "kicker"?: string, "title": string (a full assertion headline), "body": string (a rich, accurate explanatory PARAGRAPH that teaches this sub-topic in depth, max 400 chars), "points"?: [{ "text": string (a key sub-point, max 85 chars) }] (0-3, shown beside the paragraph) }',
    example: '{"kicker":"Batafsil","title":"The Calvin cycle builds sugar in the stroma","body":"After the light reactions, the enzyme RuBisCO fixes carbon dioxide onto a five-carbon molecule. Powered by the ATP and NADPH made earlier, this carbon is reduced and rearranged into glucose, while the starting molecule is regenerated so the cycle can continue indefinitely.","points":[{"text":"Occurs in the stroma"},{"text":"Uses ATP and NADPH"},{"text":"Regenerates RuBP"}]}',
  },
  MISOL: {
    structure: '{ "kicker"?: string, "title": string (assertion headline), "body": string (describe the concrete example clearly, max 340 chars), "icon"?: string (ONE relevant icon name from AVAILABLE_ICONS), "takeaway"?: string (one line: what this example illustrates, max 140 chars) }',
    example: '{"kicker":"Misol","title":"A single oak leaf is a miniature solar factory","body":"One broad oak leaf holds millions of chloroplasts. Across a sunny day it captures light over its whole surface, splitting water and fixing carbon so effectively that a mature oak releases enough oxygen for several people.","icon":"leaf","takeaway":"Scale one leaf up to a forest to grasp the global impact."}',
  },
  TURLAR: {
    structure: '{ "kicker"?: string, "title": string (assertion headline), "items": [{ "icon"?: string (ONE relevant icon name from AVAILABLE_ICONS), "label": string (the type/category name, max 45 chars), "text": string (its explanation, max 130 chars) }] (2-4) }',
    example: '{"kicker":"Turlari","title":"Plants use three distinct photosynthetic pathways","items":[{"icon":"sun","label":"C3 pathway","text":"The most common route; fixes carbon directly through the Calvin cycle."},{"icon":"leaf","label":"C4 pathway","text":"Concentrates CO2 first, efficient in hot dry climates like maize."},{"icon":"water","label":"CAM pathway","text":"Opens stomata at night to conserve water; used by cacti."}]}',
  },
  COMPARISON: {
    structure: '{ "kicker"?: string, "title": string (an assertion headline), "subtitle"?: string (max 150 chars), "left": { "label": string (max 28 chars), "title"?: string (max 48 chars), "items": string[] (2-4; each ONE short line of a characteristic, max 80 chars) }, "right": { "label": string (max 28 chars), "title"?: string, "items": string[] (2-4; each max 80 chars) } } — the two sides are NEUTRAL (left/right), not "before/after".',
    example: '{"title":"Light and dark reactions differ in place and purpose","left":{"label":"Light reactions","title":"In the thylakoid","items":["Require direct sunlight","Split water and release oxygen","Produce ATP and NADPH"]},"right":{"label":"Calvin cycle","title":"In the stroma","items":["Run without direct light","Fix carbon dioxide","Build glucose molecules"]}}',
  },
  PROCESS: {
    structure: '{ "title": string (an assertion headline, max 76 chars), "steps": [{ "title": string (2-4 words, max 38 chars), "body": string (ONE compact sentence explaining the stage, max 105 chars) }] (2-5; prefer 3-4 steps; with 5 steps every body must be especially short) }',
    example: '{"title":"Photosynthesis proceeds through linked energy stages","steps":[{"title":"Light capture","body":"Chlorophyll absorbs sunlight and energizes electrons in the thylakoid membrane."},{"title":"Water splitting","body":"Water breaks down, releasing oxygen and supplying electrons and protons."},{"title":"Sugar synthesis","body":"The Calvin cycle uses stored energy to build glucose from carbon dioxide."}]}',
  },
  TIMELINE: {
    structure: '{ "title": string, "steps": [{ "date": string, "title": string (max 60 chars), "body": string (what happened, ONE short sentence, max 100 chars) }] (2-4) }',
    example: '{"title":"Key discoveries in understanding photosynthesis","steps":[{"date":"1770s","title":"Priestley\'s experiment","body":"Showed that plants can restore air spoiled by a burning candle."},{"date":"1779","title":"Ingenhousz","body":"Proved sunlight is required and only green parts release oxygen."},{"date":"1930s","title":"Van Niel","body":"Showed the released oxygen comes from water, not carbon dioxide."}]}',
  },
  AGENDA: {
    structure: '{ "title": string (e.g. "Reja"), "items": [{ "text": string (a section/topic to be covered, max 70 chars) }] (EXACTLY 4 items) }',
    example: '{"title":"Reja","items":[{"text":"What photosynthesis is"},{"text":"The light-dependent reactions"},{"text":"The Calvin cycle"},{"text":"Why it matters for life on Earth"}]}',
  },
  CONTENT: {
    structure: '{ "kicker"?: string, "title": string (a full-sentence ASSERTION — the point of the slide, not a vague label), "lead"?: string (one framing sentence, max 180 chars), "points": [{ "icon"?: string (ONE relevant icon name from AVAILABLE_ICONS), "heading"?: string (2-4 word bold lead-in, max 45 chars), "text": string (the explanatory point, max 160 chars) }] (2-4) }',
    example: '{"title":"Why leaves are green","lead":"The colour comes from how chlorophyll absorbs light.","points":[{"icon":"sun","heading":"Absorbs red & blue","text":"Chlorophyll captures red and blue wavelengths to power reactions."},{"icon":"leaf","heading":"Reflects green","text":"Green light is reflected rather than absorbed, so leaves look green."},{"icon":"atom","heading":"Two pigment types","text":"Chlorophyll a and b widen the range of light a plant can use."}]}',
  },
  DEFINITION: {
    structure: '{ "kicker"?: string, "term": string (the word/concept being defined, max 60 chars), "definition": string (a clear, complete definition, max 240 chars), "aspects"?: [{ "icon"?: string (ONE relevant icon name from AVAILABLE_ICONS), "label": string (max 40 chars), "text": string (max 110 chars) }] (0-3, key facets of the term) }',
    example: '{"kicker":"Key concept","term":"Photosynthesis","definition":"The process by which green plants use sunlight, water and carbon dioxide to produce glucose and oxygen.","aspects":[{"icon":"arrow","label":"Inputs","text":"Sunlight, water (H2O) and carbon dioxide (CO2)."},{"icon":"leaf","label":"Outputs","text":"Glucose for energy and oxygen released into the air."},{"icon":"location","label":"Location","text":"Occurs in the chloroplasts of plant cells."}]}',
  },
  CONCLUSION: {
    structure: '{ "kicker"?: string, "title": string (e.g. "Xulosa"), "points": string[] (2-4 summary takeaways, each max 150 chars), "closing"?: string (one final sentence, max 160 chars) }',
    example: '{"title":"Xulosa","points":["Photosynthesis converts light energy into chemical energy stored in glucose.","It produces the oxygen that nearly all life depends on.","It runs in two linked stages: light reactions and the Calvin cycle."],"closing":"Without photosynthesis, the food chains that sustain life could not exist."}',
  },
  REFERENCES: {
    structure: '{ "title": string (e.g. "Foydalanilgan adabiyotlar"), "items": [{ "text": string (one full bibliographic entry, max 140 chars), "type"?: "law" | "book" | "article" | "web" }] (0-8; ORDER by GOST: law → book → article → web. Use only REAL, well-known sources — real textbooks, laws, reputable sites. Do NOT invent exact decree numbers, page counts or fake authors; if unsure, give a general real source or fewer entries) }',
    example: '{"title":"Foydalanilgan adabiyotlar","items":[{"text":"Campbell N., Reece J. Biology. 11th ed. — Pearson, 2017.","type":"book"},{"text":"Taiz L., Zeiger E. Plant Physiology. — Sinauer, 2015.","type":"book"},{"text":"Khan Academy — Photosynthesis. khanacademy.org","type":"web"}]}',
  },
  CLOSING: {
    structure: '{ "title": string (ONLY a short localized equivalent of "E\'tiboringiz uchun rahmat!") }. Do not add subtitle, contact, questions, presenter details or any other key.',
    example: '{"title":"E\'tiboringiz uchun rahmat!"}',
  },
  RELEVANCE: {
    structure: '{ "kicker"?: string (e.g. "Dolzarblik"), "title": string (an assertion: why this matters NOW), "lead"?: string (one framing sentence, max 180 chars), "points": [{ "text": string (one concrete reason the topic is relevant today, max 155 chars) }] (2-3), "stat"?: { "value": string (JUST the number core, e.g. "2.3"), "unit"?: string (e.g. "mlrd", "%"), "approx"?: boolean, "label": string (what it measures, max 56 chars) } (include ONLY if genuinely real), "source"?: string (REQUIRED when stat is present; omit only when no stat is used) }',
    example: '{"kicker":"Dolzarblik","title":"Raqamli ta\'lim bugun har qachongidan dolzarb","lead":"Pandemiyadan so\'ng ta\'lim jarayoni tubdan raqamlashdi.","points":[{"text":"Onlayn platformalar an\'anaviy darsni to\'ldiruvchi asosiy vositaga aylandi."},{"text":"Talabalarning mustaqil ta\'lim ko\'nikmalariga talab keskin oshdi."}],"stat":{"value":"2.3","unit":"mlrd","label":"dunyoda onlayn ta\'lim foydalanuvchisi"},"source":"UNESCO, 2023"}',
  },
  AIM_TASKS: {
    structure: '{ "kicker"?: string, "title": string (e.g. "Maqsad va vazifalar"), "aim": string (ONE clear research aim; start naturally, e.g. "...ning maqsadi — ...", max 170 chars), "tasks": string[] (3-5 concrete tasks; each an infinitive-style step, e.g. "...ni tahlil qilish", max 100 chars) }',
    example: '{"title":"Maqsad va vazifalar","aim":"Ishning maqsadi — raqamli ta\'lim vositalarining talaba o\'zlashtirishiga ta\'sirini o\'rganish.","tasks":["Raqamli ta\'lim tushunchasi va turlarini yoritish","Mavjud platformalarni qiyosiy tahlil qilish","So\'rovnoma orqali talabalar fikrini o\'rganish","Amaliy tavsiyalar ishlab chiqish"]}',
  },
  OBJECT_SUBJECT: {
    structure: '{ "kicker"?: string, "title": string (e.g. "Tadqiqot ob\'ekti va predmeti"), "object": { "label": string (max 28 chars, e.g. "Ob\'ekt"), "text": string (WHAT / WHO is studied, max 200 chars) }, "subject": { "label": string (max 28 chars, e.g. "Predmet"), "text": string (WHICH aspect of the object is examined, max 200 chars) } }',
    example: '{"title":"Tadqiqot ob\'ekti va predmeti","object":{"label":"Ob\'ekt","text":"Oliy ta\'lim muassasalarida tashkil etilgan masofaviy ta\'lim jarayoni."},"subject":{"label":"Predmet","text":"Raqamli platformalarning talabalar bilim o\'zlashtirish samaradorligiga ta\'siri."}}',
  },
  FINDING: {
    structure: '{ "kicker"?: string (e.g. "Natija"), "title": string (the RESULT stated as a full assertion — the point of the slide, ≤80 chars), "evidence": string (explain the evidence behind the result in an accurate paragraph, max 380 chars), "points"?: [{ "text": string (a supporting sub-point, max 85 chars) }] (0-2), "interpretation"?: string (what this evidence MEANS — the analytical takeaway, not a restatement of evidence, max 220 chars), "limitation"?: string (an honest scope/method caveat if one genuinely applies — e.g. sample size, context boundary; OMIT entirely if none applies, never invent one, max 160 chars), "source"?: string (short citation, max 70 chars) }',
    example: '{"kicker":"Natija","title":"Aralash ta\'lim modeli o\'zlashtirishni sezilarli oshiradi","evidence":"So\'rovnoma va nazorat ishlari natijalari shuni ko\'rsatdiki, an\'anaviy darsni onlayn resurslar bilan birlashtirgan guruhlar faqat auditoriya mashg\'ulotidagi guruhlarga nisbatan yuqori natija qayd etdi. Eng katta farq mustaqil topshiriqlarni bajarishda kuzatildi.","points":[{"text":"Motivatsiya darajasi oshdi"},{"text":"Mustaqil ish sifati yaxshilandi"}],"interpretation":"Bu farq shuni ko\'rsatadiki, muvaffaqiyat texnologiyaning o\'zida emas, balki mustaqil ishni qanday tuzilmalashda.","limitation":"Natija bitta universitet namunasiga asoslangan, umumlashtirish ehtiyot bilan qilinishi kerak.","source":"Muallif so\'rovnomasi, n=120, 2024"}',
  },
  PROBLEMS_SOLUTIONS: {
    structure: '{ "kicker"?: string, "title": string (e.g. "Muammolar va yechimlar"), "subtitle"?: string (max 150 chars), "pairs": [{ "problem": string (one concrete problem, max 108 chars), "solution": string (its matched, realistic solution, max 108 chars) }] (2-3) }',
    example: '{"title":"Muammolar va yechimlar","pairs":[{"problem":"O\'qituvchilarda raqamli ko\'nikmalar yetishmasligi","solution":"Muntazam malaka oshirish kurslarini joriy etish"},{"problem":"Internetga teng bo\'lmagan kirish imkoniyati","solution":"Oflayn rejimda ishlaydigan resurslarni tayyorlash"},{"problem":"Talabalar motivatsiyasining pastligi","solution":"Geymifikatsiya elementlarini qo\'llash"}]}',
  },
};

/** Picks the prose spec for this type when contentMode is 'prose' AND that
 *  type actually has one; every other type (or 'cards' mode) uses its normal
 *  SPECS entry unchanged. */
function resolveSpec(type: SlideType, contentMode?: 'cards' | 'prose'): Spec {
  if (contentMode === 'prose' && PROSE_SPECS[type]) return PROSE_SPECS[type]!;
  return SPECS[type];
}

/** CARD_SYSTEM plus the prose-writing rules, appended only in prose mode —
 *  CARD_SYSTEM itself is never modified. */
export function buildCardSystem(contentMode?: 'cards' | 'prose'): string {
  return contentMode === 'prose' ? `${CARD_SYSTEM}\n${PROSE_SYSTEM_ADDENDUM}` : CARD_SYSTEM;
}

/**
 * Deck-wide preamble — byte-identical across every per-slide card call for
 * ONE deck (cards.processor.ts computes deckTitle/topic/language/totalSlides/
 * deckThesis/deckNarrative/sharedFacts/outlineTitles ONCE, outside the
 * per-slide loop, and passes the same values to every slide's CardInput).
 * Split out from buildCardUser() so it can be sent as a separate, cacheable
 * system block (see llm.service.ts's `systemCacheable` / card.service.ts) —
 * a ~10-slide deck would otherwise resend this same content 10 times.
 */
export function buildCardDeckContext(input: CardInput): string {
  return [
    `DECK_TITLE: ${input.deckTitle}`,
    `TOPIC: ${input.topic}`,
    `OUTPUT_LANGUAGE: ${languageGuide(input.language)}`,
    `TOTAL_SLIDES: ${input.totalSlides}`,
    ...(input.deckThesis ? ['', `DECK_THESIS: ${input.deckThesis}`] : []),
    ...(input.deckNarrative ? [`DECK_NARRATIVE: ${input.deckNarrative}`] : []),
    ...(input.sharedFacts?.length
      ? ['SHARED_FACTS (reuse verbatim where relevant; never contradict):', ...input.sharedFacts.map((f) => `  - ${f}`)]
      : []),
    ...(input.outlineTitles?.length
      ? ['DECK_OUTLINE (all slides, in order — do not repeat their points):', ...input.outlineTitles.map((t) => `  ${t}`)]
      : []),
  ].join('\n');
}

/** Per-slide-varying content only — see buildCardDeckContext() above for the
 *  deck-wide preamble this used to include (now sent as a separate cacheable
 *  block, not duplicated here). */
export function buildCardUser(input: CardInput): string {
  const spec = resolveSpec(input.type, input.contentMode);
  return [
    'SLIDE SPEC:',
    `  position: ${input.position}`,
    `  type: ${input.type}`,
    `  title: ${input.title}`,
    `  key_points: ${JSON.stringify(input.keyPoints)}`,
    ...(input.slideFocus ? [`  THIS_SLIDE_FOCUS: ${input.slideFocus}`] : []),
    '',
    `JSON STRUCTURE: ${spec.structure}`,
    ...(ICON_USING_TYPES.includes(input.type)
      ? ['', `AVAILABLE_ICONS (pick the most relevant name per item; omit if none fits): ${ICON_NAMES.join(', ')}`]
      : []),
    '',
    'EXAMPLE (English style reference; output MUST be in OUTPUT_LANGUAGE):',
    spec.example,
    '',
    'Now produce the JSON object for THIS slide. Output ONLY the JSON.',
  ].join('\n');
}
