// layout-registry.ts
// Deterministic layout-VARIANT selection for slide types that have more than
// one visual layout (the `layout?:` field inside e.g. StatsData/TurlarData in
// layouts.ts — NOT to be confused with the DB "layout" column, which actually
// stores the slide TYPE like 'STATS'/'CONTENT' for render dispatch).
//
// The AI never chooses this — card.prompt.ts / the Zod schemas do not (and
// must not) expose a `layout` field for any of these 12 types. Selection
// happens here, at content-generation time in cards.processor.ts, using only
// the content's shape + the deck's chosen theme + what's already been used
// earlier in the same deck (anti-monotony).

import type {
  StatsData, TurlarData, DefinitionData, FindingData, TimelineData,
  ContentData, BatafsilData, MisolData, ComparisonData, ProcessData,
  ProblemsSolutionsData, ClosingData,
} from './layouts';

export interface LayoutOption<T> {
  key: string;
  /** Theme ids this variant is restricted to (matches Theme.id / DB theme.key). Omit = any theme. */
  themeRestriction?: string[];
  /** Content-shape fit check. */
  matches: (data: T) => boolean;
}

/** Per-deck memory of which layout keys have already been used, per slide
 *  type — create ONE instance per presentation and thread it through every
 *  selectLayout() call for that deck (not per-slide). */
export interface DeckState {
  usedLayouts: Map<string, string[]>;
}

export const createDeckState = (): DeckState => ({ usedLayouts: new Map() });

// ============================================================
// REGISTRIES
// ============================================================
// 5 types below have a real dark_premium-only alternate concept (shipped in
// the two prior integration passes). The other 7 have no alternate design
// yet — a single universal entry is the whole registry, which is enough:
// selectLayout() always resolves to 'default' for those until a real second
// concept is added later.
//
// ORDER MATTERS: selectLayout() breaks ties by taking the FIRST eligible
// entry in the array (see below). Since 'default' has `matches: () => true`,
// it is ALWAYS eligible alongside any other option whose own `matches` also
// passes — so if 'default' were listed first, it would win on every slide
// type's first (and often only) occurrence in a deck, and the dark_premium
// concept would only ever surface on a slide type's 2nd+ occurrence via
// anti-monotony. Most of these types (DEFINITION/FINDING/TIMELINE) appear
// exactly ONCE per deck in this bot's deck structure — with 'default' first,
// the concept would never be seen in real decks, defeating the whole point
// of this feature. So: concept-specific entries are listed FIRST, 'default'
// LAST — it wins only when the concept doesn't fit (wrong theme or shape).

export const STATS_LAYOUTS: LayoutOption<StatsData>[] = [
  // One dominant figure plus supporting evidence creates hierarchy instead
  // of giving every metric identical card weight.
  { key: 'evidence_dashboard', themeRestriction: ['dark_premium'], matches: (d) => Array.isArray(d.stats) && d.stats.length >= 1 && d.stats.length <= 4 },
  { key: 'default', matches: () => true },
];

export const TURLAR_LAYOUTS: LayoutOption<TurlarData>[] = [
  { key: 'squircle_bento', themeRestriction: ['dark_premium'], matches: (d) => Array.isArray(d.items) && d.items.length <= 4 },
  { key: 'default', matches: () => true },
];

export const DEFINITION_LAYOUTS: LayoutOption<DefinitionData>[] = [
  // Prose definitions rotate through term-dominant compositions. Their visual
  // grammar intentionally differs from CONTENT's editorial reading layouts.
  { key: 'term_axis', themeRestriction: ['dark_premium'], matches: (d) => typeof d.paragraph === 'string' },
  { key: 'lexicon_split', themeRestriction: ['dark_premium'], matches: (d) => typeof d.paragraph === 'string' },
  { key: 'concept_frame', themeRestriction: ['dark_premium'], matches: (d) => typeof d.paragraph === 'string' },
  { key: 'glass_hero', themeRestriction: ['dark_premium'], matches: (d) => !d.aspects || d.aspects.length === 0 },
  // Structured definitions with aspects still get a term-first alternate.
  { key: 'term_axis', themeRestriction: ['dark_premium'], matches: (d) => Array.isArray(d.aspects) && d.aspects.length > 0 },
  { key: 'nafis_lexicon', themeRestriction: ['premium_academic'], matches: (d) => typeof d.paragraph === 'string' },
  { key: 'nafis_concept_plate', themeRestriction: ['premium_academic'], matches: () => true },
  { key: 'curve_lexicon', themeRestriction: ['soft_curves_research'], matches: (d) => typeof d.paragraph === 'string' },
  { key: 'curve_concept', themeRestriction: ['soft_curves_research'], matches: () => true },
  { key: 'default', matches: () => true },
];

export const FINDING_LAYOUTS: LayoutOption<FindingData>[] = [
  { key: 'research_brief', themeRestriction: ['dark_premium'], matches: () => true },
  { key: 'default', matches: () => true },
];

export const TIMELINE_LAYOUTS: LayoutOption<TimelineData>[] = [
  // rim_light lays nodes out in one flex row — degrades past ~5 steps.
  { key: 'rim_light', themeRestriction: ['dark_premium'], matches: (d) => Array.isArray(d.steps) && d.steps.length <= 5 },
  { key: 'default', matches: () => true },
];

// changelog_lines / marginalia / signal_ping / toggle_spectrum / switchback_path /
// diff_view are "developer-tool chrome" dark_premium concepts. Same ordering
// rule as STATS/TURLAR/DEFINITION/FINDING/TIMELINE above: concept-specific
// entry FIRST, 'default' LAST (see the ORDER MATTERS note above — 'default'
// always matches, so it must never be first or it wins on every occurrence).
export const CONTENT_LAYOUTS: LayoutOption<ContentData>[] = [
  // Paragraph slides rotate through four reading patterns before any variant
  // can repeat inside the same deck.
  { key: 'editorial_prose', themeRestriction: ['dark_premium'], matches: (d) => typeof d.paragraph === 'string' },
  { key: 'chapter_columns', themeRestriction: ['dark_premium'], matches: (d) => typeof d.paragraph === 'string' },
  { key: 'focus_statement', themeRestriction: ['dark_premium'], matches: (d) => typeof d.paragraph === 'string' },
  { key: 'open_manifesto', themeRestriction: ['dark_premium'], matches: (d) => typeof d.paragraph === 'string' },
  { key: 'changelog_lines', themeRestriction: ['dark_premium'], matches: (d) => (d.points?.length ?? 0) >= 2 },
  { key: 'nafis_columns', themeRestriction: ['premium_academic'], matches: (d) => typeof d.paragraph === 'string' },
  { key: 'nafis_margin_note', themeRestriction: ['premium_academic'], matches: (d) => typeof d.paragraph === 'string' },
  { key: 'nafis_evidence_lines', themeRestriction: ['premium_academic'], matches: (d) => (d.points?.length ?? 0) >= 2 },
  { key: 'curve_editorial', themeRestriction: ['soft_curves_research'], matches: (d) => typeof d.paragraph === 'string' },
  { key: 'curve_statement', themeRestriction: ['soft_curves_research'], matches: (d) => typeof d.paragraph === 'string' },
  { key: 'curve_lanes', themeRestriction: ['soft_curves_research'], matches: (d) => (d.points?.length ?? 0) >= 2 },
  { key: 'default', matches: () => true },
];

export const BATAFSIL_LAYOUTS: LayoutOption<BatafsilData>[] = [
  // marginalia's right-hand margin column is empty without points — only
  // offer it when there's something to put there.
  { key: 'marginalia', themeRestriction: ['dark_premium'], matches: (d) => !!d.points?.length },
  { key: 'nafis_annotation', themeRestriction: ['premium_academic'], matches: () => true },
  { key: 'curve_margin', themeRestriction: ['soft_curves_research'], matches: () => true },
  { key: 'default', matches: () => true },
];

export const MISOL_LAYOUTS: LayoutOption<MisolData>[] = [
  { key: 'case_study', themeRestriction: ['dark_premium'], matches: () => true },
  { key: 'nafis_case_note', themeRestriction: ['premium_academic'], matches: () => true },
  { key: 'curve_case', themeRestriction: ['soft_curves_research'], matches: () => true },
  { key: 'default', matches: () => true },
];

export const COMPARISON_LAYOUTS: LayoutOption<ComparisonData>[] = [
  { key: 'toggle_spectrum', themeRestriction: ['dark_premium'], matches: (d) => Array.isArray(d.left?.items) && Array.isArray(d.right?.items) && d.left.items.length <= 4 && d.right.items.length <= 4 },
  { key: 'default', matches: () => true },
];

export const PROCESS_LAYOUTS: LayoutOption<ProcessData>[] = [
  // switchback_path keeps process stages readable by alternating them across a
  // vertical route instead of squeezing every step into one horizontal row.
  { key: 'switchback_path', themeRestriction: ['dark_premium'], matches: (d) => Array.isArray(d.steps) && d.steps.length <= 5 },
  { key: 'default', matches: () => true },
];

export const PROBLEMS_SOLUTIONS_LAYOUTS: LayoutOption<ProblemsSolutionsData>[] = [
  { key: 'matrix', themeRestriction: ['dark_premium'], matches: (d) => Array.isArray(d.pairs) && d.pairs.length <= 3 },
  { key: 'default', matches: () => true },
];

export const CLOSING_LAYOUTS: LayoutOption<ClosingData>[] = [{ key: 'default', matches: () => true }];

/** slideType (as stored in the DB "layout" column, e.g. 'STATS') -> registry.
 *  Types not listed here (TITLE, AGENDA, REFERENCES,
 *  RELEVANCE, AIM_TASKS, OBJECT_SUBJECT) have no layout
 *  variants at all — selectLayoutFor() is a no-op for them. TITLE in
 *  particular keeps its existing AI/user-driven layout untouched, on purpose. */
export const LAYOUT_REGISTRIES: Record<string, LayoutOption<any>[]> = {
  STATS: STATS_LAYOUTS,
  TURLAR: TURLAR_LAYOUTS,
  DEFINITION: DEFINITION_LAYOUTS,
  FINDING: FINDING_LAYOUTS,
  TIMELINE: TIMELINE_LAYOUTS,
  CONTENT: CONTENT_LAYOUTS,
  BATAFSIL: BATAFSIL_LAYOUTS,
  MISOL: MISOL_LAYOUTS,
  COMPARISON: COMPARISON_LAYOUTS,
  PROCESS: PROCESS_LAYOUTS,
  PROBLEMS_SOLUTIONS: PROBLEMS_SOLUTIONS_LAYOUTS,
  CLOSING: CLOSING_LAYOUTS,
};

// ============================================================
// SELECTOR
// ============================================================

/**
 * Deterministic layout-variant selection: theme-filter -> content-shape-filter
 * -> anti-monotony (skip a variant already used for this slide type earlier
 * in the same deck, when another fit remains) -> first remaining candidate.
 * No randomness — same input always resolves the same way, which keeps this
 * testable and debuggable.
 */
export function selectLayout<T>(
  slideType: string,
  options: LayoutOption<T>[],
  data: T,
  themeId: string,
  deckState: DeckState,
): string {
  if (!options.length) return 'default';

  const themeOk = options.filter((o) => !o.themeRestriction || o.themeRestriction.includes(themeId));
  const contentOk = themeOk.filter((o) => o.matches(data));
  const matchingPreferred = contentOk.filter((o) => o.key !== 'default');
  const pool = matchingPreferred.length > 0
    ? matchingPreferred
    : contentOk.length > 0
      ? contentOk
      : themeOk.length > 0
        ? themeOk
        : options;

  const usedForType = deckState.usedLayouts.get(slideType) ?? [];
  const unused = pool.filter((o) => !usedForType.includes(o.key));
  const chosen = (unused.length > 0 ? unused : pool)[0];

  deckState.usedLayouts.set(slideType, [...usedForType, chosen.key]);
  return chosen.key;
}

/**
 * Convenience wrapper for the orchestrator: looks up the registry for
 * `slideType` and returns `content` with `.layout` set to the selected key —
 * or `content` unchanged (no `.layout` added) when the type has no registry
 * (nothing to select between). Mutates nothing; returns a new object only
 * when a registry exists.
 */
export function withSelectedLayout<T extends object>(
  slideType: string,
  content: T,
  themeId: string,
  deckState: DeckState,
): T & { layout?: string } {
  const options = LAYOUT_REGISTRIES[slideType];
  if (!options) return content;
  const layout = selectLayout(slideType, options, content, themeId, deckState);
  return { ...content, layout };
}
