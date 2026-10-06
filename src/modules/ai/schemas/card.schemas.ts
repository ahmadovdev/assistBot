import { z } from 'zod';
import { SlideType } from '../layout.catalog';
import { ICON_NAMES } from '../../render/templates/icons';
import { processBodyMax } from '../content-budgets';

// Only known icon names reach the renderer.
const iconField = z
  .enum(ICON_NAMES as [string, ...string[]])
  .optional();

const DANGLING_ENDING_RE =
  /\b(?:va|yoki|hamda|bilan|uchun|orqali|natijasida|sababli|bo‘yicha|bo'yicha|chunki|ammo|lekin|biroq|and|or|with|for|by|because|through)\s*[.!?]?$/iu;

function completeSentence(max: number, min = 1) {
  return z.string().min(min).max(max).superRefine((value, ctx) => {
    const plain = value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (/[.!?][)"'»]*$/u.test(plain) && !DANGLING_ENDING_RE.test(plain)) return;
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'must be a complete sentence ending with punctuation, without a dangling conjunction',
    });
  });
}

// Shared content primitives (Fix 6): one DEFINITION, per-context caps (a full-width
// bullet fits ~160 chars, a narrow side-column only ~85 — so caps stay parametric).
const bullet = (max: number) => z.object({ text: z.string().min(1).max(max) });
const sentenceBullet = (max: number) => z.object({ text: completeSentence(max) });
const iconCard = (labelMax: number, textMax: number) =>
  z.object({ icon: iconField, label: z.string().min(1).max(labelMax), text: z.string().min(1).max(textMax) });
const explanatoryIconCard = (labelMax: number, textMax: number) =>
  z.object({ icon: iconField, label: z.string().min(1).max(labelMax), text: completeSentence(textMax) });

// Structured numeric value (Fix 5): number core + unit + approx flag — split out so
// the unit can be typeset small and the figure is validatable (was one opaque string).
const statShape = {
  value: z.string().min(1).max(12), // numeric core, e.g. "56", "90", "3.4"
  unit: z.string().max(14).optional(), // "%", "mlrd m³", "yil", "barobar"
  approx: z.boolean().optional(), // renders a "~" prefix
};

// ACADEMIC schemas (Uzbek university students). Concept/explanation-driven —
// NO forced numbers/metrics (those made the AI invent fake stats on qualitative
// topics). Char caps are a fixed-canvas SAFETY CEILING, verified via worst-case
// render; invalid model output fails the generation job explicitly.

// Academic title page (titul varaq) — 5 selectable layouts (title blueprint).
// All formal OTM fields optional so older/partial data still renders; the
// MAVZU (`title`) is always the largest element by design in every layout.
const TITLE_LAYOUTS = [
  'editorial_split', 'classical_centered', 'bento_academic',
  'typographic_statement', 'vertical_ribbon',
] as const;
const title = z.object({
  layout: z.enum(TITLE_LAYOUTS).optional(),
  ministry: z.string().max(130).optional(),   // Vazirlik
  university: z.string().max(90).optional(),
  faculty: z.string().max(95).optional(),
  department: z.string().max(80).optional(),   // Kafedra
  direction: z.string().max(90).optional(),    // Yo'nalish (kod + nom)
  workType: z.string().max(40).optional(),     // "KURS ISHI" / "BITIRUV MALAKAVIY ISHI"
  kicker: z.string().optional(),
  title: z.string().min(1).max(120),           // MAVZU — eng katta element (auto-shrink)
  subtitle: z.string().max(180).optional(),
  student: z.string().max(70).optional(),      // "Karimov Alisher"
  group: z.string().max(48).optional(),        // "3-kurs, IQT-302"
  advisor: z.string().max(90).optional(),      // "i.f.n., dotsent Rahmonov B.S."
  city: z.string().max(40).optional(),
  year: z.string().max(12).optional(),
  // (Fix 9) legacy `meta[]` removed — the title page uses the structured fields above,
  // populated deterministically from the user's answer in cards.processor.
});

const agenda = z.object({
  title: z.string().min(1).max(80),
  items: z.array(z.object({
    text: z.string().min(1).max(70),
  }).strict()).length(4),
}).strict();

// The workhorse. Title is a full-sentence ASSERTION (enforced in the prompt).
const content = z.object({
  kicker: z.string().optional(),
  title: z.string().min(1).max(80),
  lead: completeSentence(180).optional(),
  points: z.array(z.object({
    icon: iconField,
    heading: z.string().max(45).optional(),
    text: completeSentence(160),
  })).min(2).max(4),
});

const definition = z.object({
  kicker: z.string().optional(),
  term: z.string().min(1).max(60),
  definition: completeSentence(240),
  aspects: z.array(iconCard(40, 110)).max(3),
});

// Deep-dive on ONE sub-topic: a rich paragraph + key sub-points.
const batafsil = z.object({
  kicker: z.string().optional(),
  title: z.string().min(1).max(80),
  body: completeSentence(400),
  points: z.array(bullet(85)).max(3),
});

// A concrete illustrative example.
const misol = z.object({
  kicker: z.string().optional(),
  title: z.string().min(1).max(80),
  body: completeSentence(340),
  icon: iconField,
  takeaway: completeSentence(140).optional(),
});

// Classification — types/categories of the subject.
const turlar = z.object({
  kicker: z.string().optional(),
  title: z.string().min(1).max(80),
  items: z.array(explanatoryIconCard(45, 130)).min(2).max(4),
});

const sideCol = z.object({
  label: z.string().min(1).max(28),
  title: z.string().max(48).optional(),
  items: z.array(z.string().min(1).max(80)).min(2).max(4),
});
// Characteristics side by side — no metrics/winner (that was business framing).
// (Fix 7) neutral `left`/`right` — not the temporal `before`/`after`.
const comparison = z.object({
  kicker: z.string().optional(),
  title: z.string().min(1).max(80),
  subtitle: z.string().max(150).optional(),
  left: sideCol,
  right: sideCol,
});

// Stages of how something happens — no duration/tools (business framing).
const process = z.object({
  kicker: z.string().optional(),
  title: z.string().min(1).max(76),
  steps: z.array(z.object({
    title: z.string().min(1).max(38),
    body: completeSentence(150, 45),
  }).strict()).min(2).max(5),
}).strict().superRefine((data, ctx) => {
  const maxChars = processBodyMax(data.steps.length);
  data.steps.forEach((step, index) => {
    if (step.body.length <= maxChars) return;
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['steps', index, 'body'],
      message: `body must contain at most ${maxChars} characters for a ${data.steps.length}-step process`,
    });
  });
});

// Chronology — dates + events, no metric/status (business framing).
const timeline = z.object({
  kicker: z.string().optional(),
  title: z.string().min(1).max(80),
  steps: z.array(z.object({
    date: z.string().min(1).max(24),
    title: z.string().min(1).max(60),
    body: completeSentence(100),
  }).strict()).min(2).max(4),
}).strict();

// Data — only for genuinely quantitative topics; source required.
const stats = z.object({
  kicker: z.string().optional(),
  title: z.string().min(1).max(68),
  subtitle: z.string().min(35).max(105).optional(),
  stats: z
    .array(z.object({
      value: z.string().min(1).max(10),
      unit: z.string().max(14).optional(),
      approx: z.boolean().optional(),
      label: z.string().min(4).max(28),
      description: z.string().min(24).max(54),
    }))
    .max(4), // 0 is allowed for safety; non-empty output must contain a complete evidence set.
  insight: z.string().min(35).max(82).optional(),
  source: z.string().max(55).optional(),
}).superRefine((data, ctx) => {
  if (data.stats.length > 0 && data.stats.length < 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['stats'],
      message: 'stats must contain 3-4 verified figures, or be empty when evidence is unavailable',
    });
  }
  if (data.stats.length > 0 && !data.subtitle) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['subtitle'],
      message: 'subtitle is required when stats are present',
    });
  }
  if (data.stats.length > 0 && !data.insight) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['insight'],
      message: 'insight is required when stats are present',
    });
  }
  if (data.stats.length > 0 && !data.source) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['source'],
      message: 'source is required when stats are present',
    });
  }
});

// A single bibliographic source (SourceRef). `type` enables GOST grouping/order.
const REF_TYPES = ['law', 'book', 'article', 'web'] as const;
const sourceRef = z.object({
  text: z.string().min(1).max(140),
  type: z.enum(REF_TYPES).optional(),
});

const conclusion = z.object({
  kicker: z.string().optional(),
  title: z.string().min(1).max(80),
  points: z.array(completeSentence(150)).min(2).max(4),
  closing: completeSentence(160).optional(),
});

const references = z.object({
  title: z.string().min(1).max(80),
  // Typed sources, GOST order (law → book → article → web). No min: empty ⇒ dropped.
  items: z.array(sourceRef).max(8),
});

const closing = z.object({
  title: z.string().min(1).max(80),
}).strict();

// ── Kurs ishi / BMI argumentative backbone (blueprint §2–§3, §6.2) ──
// Concept-driven, NO forced numbers: figures/sources stay optional.

// "Dolzarblik": why the topic matters now — framing + supporting points.
const relevance = z.object({
  kicker: z.string().optional(),
  title: z.string().min(1).max(80),
  lead: completeSentence(180).optional(),
  points: z.array(sentenceBullet(155)).min(2).max(3),
  stat: z.object({ ...statShape, label: z.string().min(1).max(56) }).optional(),
  source: z.string().max(70).optional(),
}).superRefine((data, ctx) => {
  if (data.stat && !data.source) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['source'],
      message: 'source is required when stat is present',
    });
  }
});

const osCol = z.object({
  label: z.string().min(1).max(28),
  text: z.string().min(1).max(200),
});
// "Ob'ekt va predmet": research object vs its examined aspect.
const objectSubject = z.object({
  kicker: z.string().optional(),
  title: z.string().min(1).max(80),
  object: osCol,
  subject: osCol,
});

// A single research result stated as a claim + evidence + sub-points.
// V2 (additive): `interpretation`/`limitation` are optional extras — old
// FINDING content without them still validates and renders unchanged (see
// findingDefault in layouts.ts).
const finding = z.object({
  kicker: z.string().optional(),
  title: z.string().min(1).max(80), // the RESULT stated as an assertion (Fix 7: was `claim`)
  evidence: completeSentence(380),
  points: z.array(bullet(85)).max(2),
  interpretation: completeSentence(220).optional(), // what the evidence MEANS — the analytical "so what"
  limitation: completeSentence(160).optional(), // honest scope/method caveat — never invented, only stated if real
  source: z.string().max(70).optional(),
});

// "Muammolar va yechimlar": matched problem/solution pairs.
const problemsSolutions = z.object({
  kicker: z.string().optional(),
  title: z.string().min(1).max(80),
  subtitle: z.string().max(150).optional(),
  pairs: z.array(z.object({
    problem: z.string().min(32).max(108),
    solution: z.string().min(38).max(108),
  })).min(2).max(3),
});

export const cardSchemaByType: Record<SlideType, z.ZodTypeAny> = {
  TITLE: title, AGENDA: agenda, CONTENT: content, DEFINITION: definition,
  BATAFSIL: batafsil, MISOL: misol, TURLAR: turlar, COMPARISON: comparison,
  PROCESS: process, TIMELINE: timeline, STATS: stats, CONCLUSION: conclusion,
  REFERENCES: references, CLOSING: closing,
  RELEVANCE: relevance, OBJECT_SUBJECT: objectSubject,
  FINDING: finding, PROBLEMS_SOLUTIONS: problemsSolutions,
};

// ============================================================
// PROSE MODE (alternative to card-based points/bullets) — additive, opt-in.
// Each type keeps its own ANCHOR field(s) (title/term — its visual identity)
// but replaces the bullet/points body with ONE flowing paragraph.
// Deliberately NOT a single generic {heading, paragraph} shape shared across
// all types (that would make every prose slide render identically, undoing
// the per-type visual distinctiveness the layout-registry work established)
// — see card.prompt.prose.ts for the reasoning.
//
// FINDING/PROCESS are intentionally absent this round — their card layouts
// (z_stack / switchback_path) are structurally built around discrete items, so a
// prose variant needs its own dedicated visual design first (deferred).
// ============================================================

const proseParagraph = completeSentence(650, 280);

const relevanceProse = z.object({
  kicker: z.string().optional(),
  title: z.string().min(1).max(80),
  paragraph: proseParagraph,
  source: z.string().max(70).optional(),
});

const objectSubjectProse = z.object({
  kicker: z.string().optional(),
  title: z.string().min(1).max(80),
  paragraph: proseParagraph, // object vs subject distinction expressed in prose, not two columns
});

const contentProse = z.object({
  kicker: z.string().optional(),
  title: z.string().min(1).max(80),
  paragraph: proseParagraph,
});

const definitionProse = z.object({
  kicker: z.string().optional(),
  term: z.string().min(1).max(60),
  paragraph: proseParagraph, // fuller explanatory version of `definition`
});

const batafsilProse = z.object({
  kicker: z.string().optional(),
  title: z.string().min(1).max(80),
  paragraph: proseParagraph,
});

const misolProse = z.object({
  kicker: z.string().optional(),
  title: z.string().min(1).max(80),
  paragraph: proseParagraph,
  icon: iconField,
  takeaway: completeSentence(140).optional(),
});

const conclusionProse = z.object({
  kicker: z.string().optional(),
  title: z.string().min(1).max(80),
  paragraph: proseParagraph,
  closing: completeSentence(160).optional(),
});

/** Slide types that have a prose alternative, mapped to their prose schema.
 *  Deliberately partial (not Record<SlideType,...>) — most types (STATS,
 *  TURLAR, COMPARISON, TIMELINE, PROBLEMS_SOLUTIONS, AGENDA,
 *  REFERENCES, TITLE, CLOSING) have no prose variant; their visual
 *  function depends on discrete structure and prose is not forced onto them. */
export const proseSchemaByType: Partial<Record<SlideType, z.ZodTypeAny>> = {
  RELEVANCE: relevanceProse,
  OBJECT_SUBJECT: objectSubjectProse,
  CONTENT: contentProse,
  DEFINITION: definitionProse,
  BATAFSIL: batafsilProse,
  MISOL: misolProse,
  CONCLUSION: conclusionProse,
};

export type CardContent = Record<string, unknown>;
