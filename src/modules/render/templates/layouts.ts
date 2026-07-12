// layouts.ts
// One render function per slide type. Each returns an HTML string
// that uses classes defined in document.ts. Render functions are
// pure — no I/O, no side effects.

import { Theme } from './theme';
import { icon } from './icons';
import { SlideVisual } from '../../visuals/visual.types';
import { renderWikimediaVisual } from './wikimedia-visual';

// ============================================================
// DATA INTERFACES
// ============================================================

export interface SlideMeta {
  pageNo?: string | number;
  visual?: SlideVisual;
}

export type TitleLayout =
  | 'editorial_split' | 'classical_centered' | 'bento_academic'
  | 'typographic_statement' | 'vertical_ribbon';

export interface TitleData extends SlideMeta {
  layout?: TitleLayout;
  ministry?: string;
  university?: string;
  faculty?: string;
  department?: string;
  direction?: string;
  workType?: string;
  kicker?: string;
  title: string;
  subtitle?: string;
  student?: string;
  group?: string;
  advisor?: string;
  city?: string;
  year?: string;
}

export interface StatsData extends SlideMeta {
  kicker?: string;
  title: string;
  subtitle?: string;
  stats: { value: string; unit?: string; approx?: boolean; label: string; description?: string }[];
  insight?: string;
  source?: string;
  /** dark_premium-only visual concept (2026 research). Selection logic (when
   *  the AI/pipeline should set this) is a later phase — see layouts.ts docs. */
  layout?: 'gradient_cards';
}

/** Kept only as the internal fallback renderer (not a selectable type). */
export interface InsightData extends SlideMeta {
  kicker?: string;
  statement: string;
  body?: string;
}

export interface ComparisonData extends SlideMeta {
  kicker?: string;
  title: string;
  subtitle?: string;
  left: { label: string; title?: string; items: string[] };
  right: { label: string; title?: string; items: string[] };
  /** dark_premium-only visual concept. Selection logic lives in layout-registry.ts. */
  layout?: 'toggle_spectrum';
}

export interface ProcessData extends SlideMeta {
  kicker?: string;
  title: string;
  subtitle?: string;
  steps: { label?: string; title: string; body: string }[];
  /** dark_premium-only visual concept. Selection logic lives in layout-registry.ts. */
  layout?: 'kbd_chain' | 'switchback_path';
}

export interface TimelineData extends SlideMeta {
  kicker?: string;
  title: string;
  subtitle?: string;
  steps: { date: string; title: string; body: string }[];
  /** dark_premium-only visual concept (2026 research). Selection logic (when
   *  the AI/pipeline should set this) is a later phase — see layouts.ts docs. */
  layout?: 'rim_light';
}

export interface BatafsilData extends SlideMeta {
  kicker?: string;
  title: string;
  body: string;
  points?: { text: string }[];
  /** dark_premium-only visual concept. Selection logic lives in layout-registry.ts. */
  layout?: 'marginalia';
  /** Prose content mode — a fuller paragraph replacing `body`+`points`.
   *  See card.prompt.prose.ts. Takes priority over `layout` when present. */
  paragraph?: string;
}

export interface MisolData extends SlideMeta {
  kicker?: string;
  title: string;
  body: string;
  icon?: string;
  takeaway?: string;
  /** dark_premium-only visual concept. Selection logic lives in layout-registry.ts. */
  layout?: 'signal_ping';
  /** Prose content mode — a fuller paragraph replacing `body` (icon/takeaway
   *  unchanged). See card.prompt.prose.ts. Takes priority over `layout`. */
  paragraph?: string;
}

export interface TurlarData extends SlideMeta {
  kicker?: string;
  title: string;
  items: { icon?: string; label: string; text: string }[];
  /** dark_premium-only visual concept (2026 research). Selection logic (when
   *  the AI/pipeline should set this) is a later phase — see layouts.ts docs. */
  layout?: 'squircle_bento';
}

export interface AgendaData extends SlideMeta {
  kicker?: string;
  title: string;
  items: { text: string; detail?: string }[];
}

export interface ContentData extends SlideMeta {
  kicker?: string;
  title: string;
  lead?: string;
  points: { icon?: string; heading?: string; text: string }[];
  /** dark_premium-only visual concept. Selection logic lives in layout-registry.ts. */
  layout?: 'changelog_lines';
  /** Prose content mode — a single paragraph replacing `lead`+`points`.
   *  See card.prompt.prose.ts. Takes priority over `layout` when present. */
  paragraph?: string;
}

export interface DefinitionData extends SlideMeta {
  kicker?: string;
  term: string;
  definition: string;
  aspects?: { icon?: string; label: string; text: string }[];
  /** dark_premium-only visual concept (2026 research). Selection logic (when
   *  the AI/pipeline should set this) is a later phase — see layouts.ts docs. */
  layout?: 'glass_hero';
  /** Prose content mode — a fuller paragraph replacing `definition`+`aspects`
   *  (`term` stays, still the dominant visual element). See
   *  card.prompt.prose.ts. Takes priority over `layout` when present. */
  paragraph?: string;
}

export interface ConclusionData extends SlideMeta {
  kicker?: string;
  title: string;
  points: string[];
  closing?: string;
  /** Prose content mode — one flowing paragraph instead of numbered points.
   *  See card.prompt.prose.ts. When present, takes priority over `points`. */
  paragraph?: string;
}

export interface ReferencesData extends SlideMeta {
  title: string;
  items: { text: string; type?: string }[];
}

export interface ClosingData extends SlideMeta {
  title: string;
  subtitle?: string;
  contact?: string;
}

export interface RelevanceData extends SlideMeta {
  kicker?: string;
  title: string;
  lead?: string;
  points: { text: string }[];
  stat?: { value: string; unit?: string; approx?: boolean; label: string };
  source?: string;
  /** Prose content mode — one flowing paragraph instead of lead+points+stat.
   *  See card.prompt.prose.ts. When present, takes priority over the above. */
  paragraph?: string;
}

export interface AimTasksData extends SlideMeta {
  kicker?: string;
  title: string;
  aim: string;
  tasks: string[];
  /** Prose content mode — a fuller version of `aim`; `tasks` stays a list
   *  either way (hybrid type). See card.prompt.prose.ts. */
  paragraph?: string;
}

export interface ObjectSubjectData extends SlideMeta {
  kicker?: string;
  title: string;
  object: { label: string; text: string };
  subject: { label: string; text: string };
  /** Prose content mode — one flowing paragraph instead of the two-column
   *  object/subject split. See card.prompt.prose.ts. */
  paragraph?: string;
}

export interface FindingData extends SlideMeta {
  kicker?: string;
  title: string;
  evidence: string;
  points?: { text: string }[];
  /** V2 fields (additive, optional) — the analytical "so what" behind the
   *  evidence, and an honest scope/method caveat. Old FINDING content
   *  without these renders exactly as before (see findingDefault). */
  interpretation?: string;
  limitation?: string;
  source?: string;
  /** dark_premium-only visual concept (2026 research). Selection logic (when
   *  the AI/pipeline should set this) is a later phase — see layouts.ts docs. */
  layout?: 'z_stack';
}

export interface ProblemsSolutionsData extends SlideMeta {
  kicker?: string;
  title: string;
  subtitle?: string;
  pairs: { problem: string; solution: string }[];
  /** dark_premium-only visual concept. Selection logic lives in layout-registry.ts. */
  layout?: 'diff_view';
}

// ============================================================
// HELPERS
// ============================================================

const styleClass = (t: Theme): string => `style-${t.style}`;

/**
 * Pass-through for inline content. Replace with a real sanitizer
 * (DOMPurify, isomorphic-dompurify) if rendering untrusted input.
 * Allows simple inline tags like <em>, <strong>, <span class="hl|grad">.
 */
const safe = (s: string): string => s ?? '';

/** Prose content mode — shared low-level paragraph markup (one shared class,
 *  `.prose-body` in document.ts) reused by each type's own xProseFlow
 *  function. Each type still renders its OWN header/anchor around this —
 *  deliberately not a full-slide render, so DEFINITION/MISOL/etc.
 *  keep their distinct visual identity in prose mode (see card.schemas.ts
 *  comment for why a single generic full-slide layout was rejected). */
function proseBody(text: string): string {
  // Length-aware modifier (Bosqich 2): schema caps paragraphs at 280-650
  // chars, but real generations cluster near the top of that range — the
  // thresholds below bias toward --compact, which is intentional (--roomy
  // is the rarer case, for the few paragraphs that land short).
  const lengthClass =
    text.length < 350 ? ' prose-body--roomy' :
    text.length > 550 ? ' prose-body--compact' :
    '';
  return `<p class="prose-body${lengthClass}">${safe(text)}</p>`;
}

function isDarkPremium(theme: Theme): boolean {
  return theme.id === 'dark_premium';
}

function dossierRail(items: string[], label = 'Kalit nuqtalar', maxItems = 3): string {
  const cleaned = items.filter(Boolean).slice(0, maxItems);
  if (!cleaned.length) return '';
  return `
    <aside class="ds-rail ${cleaned.length > 3 ? 'ds-rail--dense' : ''}">
      <div class="ds-rail__label">${safe(label)}</div>
      ${cleaned.map((item, index) => `
        <div class="ds-note">
          <span class="ds-note__num">${String(index + 1).padStart(2, '0')}</span>
          <span>${safe(item)}</span>
        </div>
      `).join('')}
    </aside>`;
}

function dossierFrame(kind: string, main: string, rail = ''): string {
  return `
    <div class="ds-frame ${rail ? 'ds-frame--split' : 'ds-frame--single'}">
      <div class="ds-frame__grid"></div>
      <div class="ds-frame__tag">${safe(kind)}</div>
      <div class="ds-frame__main">${main}</div>
      ${rail}
    </div>`;
}

const corners = (t: Theme, pageNo?: string | number): string => `
  ${pageNo != null ? `<span class="page-no">${safe(String(pageNo))}</span>` : ''}
  <span class="theme-tag"><span class="theme-tag__dot"></span>${safe(t.name)}</span>
`;

const gridForCount = (n: number): string =>
  n >= 5 ? 'grid-5' : n === 4 ? 'grid-4' : n === 3 ? 'grid-3' : 'grid-2';

/** Static academic seal emblem (double ring + reeded edge + center star),
 *  built once at module load — used only via sealWatermark() below, and only
 *  under the academic_formal theme, on TITLE/CLOSING (per design
 *  note: not meant to appear on every slide). Colored via `currentColor` so
 *  it inherits `.seal-watermark`'s CSS `color`. */
const SEAL_SVG: string = (() => {
  const cx = 100, cy = 100, rOuter = 92, rInner = 78, tickOuter = 92, tickInner = 84;
  const ticks: string[] = [];
  const n = 32;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x1 = cx + tickInner * Math.cos(a), y1 = cy + tickInner * Math.sin(a);
    const x2 = cx + tickOuter * Math.cos(a), y2 = cy + tickOuter * Math.sin(a);
    ticks.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" />`);
  }
  const starPts: string[] = [];
  const rStarOuter = 34, rStarInner = 14;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? rStarOuter : rStarInner;
    starPts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.4">
    <circle cx="${cx}" cy="${cy}" r="${rOuter}" />
    <circle cx="${cx}" cy="${cy}" r="${rInner}" />
    ${ticks.join('')}
    <polygon points="${starPts.join(' ')}" fill="currentColor" stroke="none" />
  </svg>`;
})();

/** Only the academic_formal theme gets a seal; every other theme is
 *  unaffected. Call sites choose WHERE (TITLE/CLOSING only, per
 *  design note — not on every content slide). */
const sealWatermark = (theme: Theme): string =>
  theme.style === 'academic' ? `<div class="seal-watermark">${SEAL_SVG}</div>` : '';

/**
 * Common wrapper. Produces `<section class="slide ...">` and puts
 * the corner labels OUTSIDE the layout wrapper so they anchor to the
 * slide's border box, not the layout's padded box.
 */
const slide = (
  theme: Theme,
  pageNo: string | number | undefined,
  inner: string,
  opts?: { seal?: boolean },
): string => `
  <section class="slide ${styleClass(theme)}">
    ${opts?.seal ? sealWatermark(theme) : ''}
    ${inner}
    ${corners(theme, pageNo)}
  </section>
`;

// ============================================================
// RENDER FUNCTIONS
// ============================================================

/** Auto font-size for the MAVZU by word count (keeps it the largest element
 * while never overflowing the fixed canvas). */
function topicFont(text: string, big: number, mid: number, small: number): number {
  const w = text.trim().split(/\s+/).filter(Boolean).length;
  return w <= 8 ? big : w <= 14 ? mid : small;
}

/** A stacked label/value meta block (light-panel variant). */
const metaBlock = (label: string, value?: string, extra?: string): string =>
  value
    ? `<div class="titul-meta">
        <span class="titul-meta__lbl">${safe(label)}</span>
        <span class="titul-meta__val">${safe(value)}${extra ? ` · ${safe(extra)}` : ''}</span>
      </div>`
    : '';

/** Structured meta rows for the title page's dark panel. */
function metaRows(d: TitleData): string {
  return [
    metaBlock('Bajardi', d.student, d.group),
    metaBlock("Yo‘nalish", d.direction),
  ].filter(Boolean).join('');
}

function titleEditorialSplit(d: TitleData, theme: Theme): string {
  const fs = topicFont(d.title, 46, 38, 32);
  return slide(theme, d.pageNo, `
    <div class="titul-split">
      <div class="titul-panel">
        <div>
          ${d.ministry ? `<div class="titul-min">${safe(d.ministry)}</div>` : ''}
          ${d.university ? `<div class="titul-univ2">${safe(d.university)}</div>` : ''}
          ${d.faculty ? `<div class="titul-sub2">${safe(d.faculty)}</div>` : ''}
          ${d.department ? `<div class="titul-sub2">${safe(d.department)}</div>` : ''}
        </div>
        <div class="titul-panel__meta">${metaRows(d)}</div>
      </div>
      <div class="titul-main">
        <div>${d.workType ? `<span class="titul-badge">${safe(d.workType)}</span>` : ''}</div>
        <div style="align-self:center">
          <h1 class="titul-topic" style="font-size:${fs}px">${safe(d.title)}</h1>
          ${d.subtitle ? `<p class="lead" style="margin-top:18px">${safe(d.subtitle)}</p>` : ''}
        </div>
        <div></div>
      </div>
    </div>
  `, { seal: true });
}

function titleClassicalCentered(d: TitleData, theme: Theme): string {
  const fs = topicFont(d.title, 44, 36, 30);
  const cMeta = (label: string, value?: string, extra?: string): string =>
    value ? `<div><div class="titul-cmeta__lbl">${safe(label)}</div>
      <div class="titul-cmeta__val">${safe(value)}</div>
      ${extra ? `<div class="titul-cmeta__val muted">${safe(extra)}</div>` : ''}</div>` : '';
  return slide(theme, d.pageNo, `
    <div class="titul-classic">
      <div class="titul-classic__head">
        ${d.ministry ? `<div class="titul-min" style="color:var(--text-muted)">${safe(d.ministry)}</div>` : ''}
        ${d.university ? `<div class="titul-classic__univ">${safe(d.university)}</div>` : ''}
        ${d.faculty ? `<div class="muted" style="font-size:14px;margin-top:4px">${safe(d.faculty)}</div>` : ''}
        ${d.department ? `<div class="muted" style="font-size:14px">${safe(d.department)}</div>` : ''}
      </div>
      <div class="titul-classic__center">
        ${d.workType ? `<div class="titul-worklabel">${safe(d.workType)}</div>` : ''}
        <h1 class="titul-topic" style="font-size:${fs}px;text-align:center;max-width:980px">${safe(d.title)}</h1>
      </div>
      <div>
        <div class="titul-classic__meta">
          ${cMeta('Bajardi:', d.student, d.group)}
        </div>
      </div>
    </div>
  `, { seal: true });
}

function titleBentoAcademic(d: TitleData, theme: Theme): string {
  const fs = topicFont(d.title, 46, 39, 32);
  const cells: [string, string | undefined][] = [
    ['OTM', d.university],
    ['Fakultet', d.faculty],
    ['Kafedra', d.department],
    ['Bajardi', d.student ? (d.group ? `${d.student} · ${d.group}` : d.student) : undefined],
  ];
  const shown = cells.filter((c) => c[1]);
  return slide(theme, d.pageNo, `
    <div class="titul-bento-wrap">
      <div class="titul-bento-head">
        ${d.workType ? `<span class="titul-badge" style="align-self:flex-start">${safe(d.workType)}</span>` : ''}
        <h1 class="titul-topic" style="font-size:${fs}px;max-width:1080px">${safe(d.title)}</h1>
      </div>
      <div class="titul-bento">
        ${shown.map((c, i) => `
          <div class="titul-bento__cell${i === shown.length - 1 ? ' titul-bento__cell--accent' : ''}">
            <div class="titul-bento__lbl">${safe(c[0])}</div>
            <div class="titul-bento__val">${safe(c[1]!)}</div>
          </div>`).join('')}
      </div>
    </div>
  `, { seal: true });
}

function titleTypographicStatement(d: TitleData, theme: Theme): string {
  const fs = topicFont(d.title, 74, 56, 42);
  return slide(theme, d.pageNo, `
    <div class="titul-typo">
      <div class="titul-typo__top">${safe(d.university ?? '')}</div>
      <div class="titul-typo__center">
        <div class="titul-typo__bar"></div>
        <h1 class="titul-topic" style="font-size:${fs}px;line-height:1.02;max-width:1080px">${safe(d.title)}</h1>
      </div>
      <div class="titul-typo__foot">
        <div>
          ${d.student ? `<div class="titul-typo__student">${safe(d.student)}</div>` : ''}
          ${d.workType ? `<div class="muted" style="font-size:13px">${safe(d.workType)}</div>` : ''}
        </div>
        <div></div>
      </div>
    </div>
  `, { seal: true });
}

function titleVerticalRibbon(d: TitleData, theme: Theme): string {
  const fs = topicFont(d.title, 44, 37, 31);
  const cMeta = (label: string, value?: string, extra?: string): string =>
    value ? `<div><div class="titul-cmeta__lbl">${safe(label)}</div>
      <div class="titul-cmeta__val">${safe(value)}${extra ? ` · ${safe(extra)}` : ''}</div></div>` : '';
  return slide(theme, d.pageNo, `
    <div class="titul-ribbon-wrap">
      <div class="titul-ribbon"><span class="titul-ribbon__txt">${safe(d.university ?? '')}</span></div>
      <div class="titul-ribbon-main">
        <div>
          ${d.workType ? `<span class="titul-badge">${safe(d.workType)}</span>` : ''}
          ${d.faculty ? `<div class="muted" style="font-size:13px;margin-top:14px">${safe(d.faculty)}${d.department ? ` · ${safe(d.department)}` : ''}</div>` : ''}
        </div>
        <div style="align-self:center">
          <h1 class="titul-topic" style="font-size:${fs}px;max-width:940px">${safe(d.title)}</h1>
        </div>
        <div>
          <div class="titul-ribbon__meta">
            ${cMeta('Bajardi:', d.student, d.group)}
          </div>
        </div>
      </div>
    </div>
  `, { seal: true });
}

export function renderTitle(d: TitleData, theme: Theme): string {
  switch (d.layout) {
    case 'classical_centered': return titleClassicalCentered(d, theme);
    case 'bento_academic': return titleBentoAcademic(d, theme);
    case 'typographic_statement': return titleTypographicStatement(d, theme);
    case 'vertical_ribbon': return titleVerticalRibbon(d, theme);
    case 'editorial_split':
    default: return titleEditorialSplit(d, theme);
  }
}

/** Renders a structured stat value: optional "~", the figure, and a small unit (Fix 5). */
const statNum = (s: { value: string; unit?: string; approx?: boolean }): string =>
  `${s.approx ? '~' : ''}${safe(s.value)}${s.unit ? `<span class="metric__unit">${safe(s.unit)}</span>` : ''}`;

function statsDefault(d: StatsData, theme: Theme): string {
  return slide(theme, d.pageNo, `
    <div class="content-block">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
        ${d.subtitle ? `<p class="lead" style="margin-top:14px">${safe(d.subtitle)}</p>` : ''}
      </header>
      <div style="display:flex;flex-direction:column;gap:22px;
                  border-top:1px solid var(--border);padding-top:24px">
        <div class="${gridForCount(d.stats.length)}">
          ${d.stats.map(s => `
            <div class="metric">
              <div class="metric__num">${statNum(s)}</div>
              <div class="metric__lbl">${safe(s.label)}</div>
              ${s.description ? `<p class="text--sm muted" style="margin-top:6px">${safe(s.description)}</p>` : ''}
            </div>
          `).join('')}
        </div>
        ${d.insight ? `<p class="lead" style="max-width:980px">${safe(d.insight)}</p>` : ''}
        ${d.source ? `<p class="source-note">${safe(d.source)}</p>` : ''}
      </div>
    </div>
  `);
}

/** dark_premium 2026 concept: gradient-filled metric cards + ambient orb glow
 *  on the first card. Data-shape aware — works for any stat count via
 *  gridForCount(), gradient class cycles every 4 cards. */
function statsGradientCards(d: StatsData, theme: Theme): string {
  const gradClasses = ['gm-card--a', 'gm-card--b', 'gm-card--c', 'gm-card--a'];
  return slide(theme, d.pageNo, `
    <div class="content-block">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
        ${d.subtitle ? `<p class="lead" style="margin-top:14px">${safe(d.subtitle)}</p>` : ''}
      </header>
      <div class="content-block__body">
        <div class="gm-row ${gridForCount(d.stats.length)}" style="display:grid">
          ${d.stats.map((s, i) => `
            <div class="gm-card ${gradClasses[i % gradClasses.length]}">
              ${i === 0 ? '<div class="gm-orb"></div>' : ''}
              <div class="gm-num">${statNum(s)}</div>
              <div class="gm-lbl">${safe(s.label)}</div>
              ${s.description ? `<p class="gm-desc">${safe(s.description)}</p>` : ''}
            </div>
          `).join('')}
        </div>
        ${d.insight ? `<p class="lead" style="margin-top:24px;max-width:980px">${safe(d.insight)}</p>` : ''}
        ${d.source ? `<p class="source-note" style="margin-top:8px">${safe(d.source)}</p>` : ''}
      </div>
    </div>
  `);
}

export function renderStats(d: StatsData, theme: Theme): string {
  switch (d.layout) {
    case 'gradient_cards': return statsGradientCards(d, theme);
    default: return statsDefault(d, theme);
  }
}

/** Internal FALLBACK renderer (not a selectable type). Shows a centered
 * statement + optional body — used for unknown types and error recovery. */
export function renderInsight(d: InsightData, theme: Theme): string {
  return slide(theme, d.pageNo, `
    <div style="display:grid;grid-template-rows:auto 1fr;height:100%;
                padding:var(--pad-y) var(--pad-x);gap:32px">
      <div>${d.kicker ? `<div class="kicker">${safe(d.kicker)}</div>` : ''}</div>
      <div style="align-self:center;max-width:1020px;display:flex;flex-direction:column;gap:26px">
        <h2 class="h1" style="font-size:40px;line-height:1.12">${safe(d.statement)}</h2>
        ${d.body ? `<p class="lead" style="max-width:840px">${safe(d.body)}</p>` : ''}
      </div>
    </div>
  `);
}

function comparisonDefault(d: ComparisonData, theme: Theme): string {
  return slide(theme, d.pageNo, `
    <div class="content-block">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
        ${d.subtitle ? `<p class="lead" style="margin-top:12px">${safe(d.subtitle)}</p>` : ''}
      </header>
      <div class="content-block__body" style="width:100%">
        <div class="compare">
          <div class="compare__col compare__col--now">
            <span class="kicker" style="color:inherit">${safe(d.left.label)}</span>
            ${d.left.title ? `<h3 class="h3">${safe(d.left.title)}</h3>` : ''}
            <ul class="compare__list">
              ${d.left.items.map(i => `<li><span>—</span><span>${safe(i)}</span></li>`).join('')}
            </ul>
          </div>
          <div class="compare__col compare__col--next">
            <span class="kicker" style="color:inherit">${safe(d.right.label)}</span>
            ${d.right.title ? `<h3 class="h3">${safe(d.right.title)}</h3>` : ''}
            <ul class="compare__list">
              ${d.right.items.map(i => `<li><span>→</span><span>${safe(i)}</span></li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    </div>
  `);
}

/** dark_premium 2026 concept: iOS/macOS settings toggle / Arc-browser slider —
 *  a spectrum bar between the two labels, above the usual two-column detail. */
function comparisonToggleSpectrum(d: ComparisonData, theme: Theme): string {
  return slide(theme, d.pageNo, `
    <div class="content-block">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
        ${d.subtitle ? `<p class="lead" style="margin-top:12px">${safe(d.subtitle)}</p>` : ''}
      </header>
      <div class="content-block__body" style="width:100%">
        <div class="ts-track">
          <span class="ts-track__lbl ts-track__lbl--l">${safe(d.left.label)}</span>
          <div class="ts-track__bar"><div class="ts-track__knob"></div></div>
          <span class="ts-track__lbl ts-track__lbl--r">${safe(d.right.label)}</span>
        </div>
        <div class="compare" style="margin-top:32px">
          <div class="compare__col compare__col--now">
            ${d.left.title ? `<h3 class="h3">${safe(d.left.title)}</h3>` : ''}
            <ul class="compare__list">${d.left.items.map(i => `<li><span>—</span><span>${safe(i)}</span></li>`).join('')}</ul>
          </div>
          <div class="compare__col compare__col--next">
            ${d.right.title ? `<h3 class="h3">${safe(d.right.title)}</h3>` : ''}
            <ul class="compare__list">${d.right.items.map(i => `<li><span>→</span><span>${safe(i)}</span></li>`).join('')}</ul>
          </div>
        </div>
      </div>
    </div>
  `);
}

export function renderComparison(d: ComparisonData, theme: Theme): string {
  switch (d.layout) {
    case 'toggle_spectrum': return comparisonToggleSpectrum(d, theme);
    default: return comparisonDefault(d, theme);
  }
}

function processDefault(d: ProcessData, theme: Theme): string {
  return slide(theme, d.pageNo, `
    <div class="content-block">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
        ${d.subtitle ? `<p class="lead" style="margin-top:12px">${safe(d.subtitle)}</p>` : ''}
      </header>
      <div class="content-block__body ${gridForCount(d.steps.length)}">
        ${d.steps.map((s, i) => `
          <div class="step">
            <div class="step__node">${i + 1}</div>
            ${s.label ? `<div class="step__date">${safe(s.label)}</div>` : ''}
            <div class="step__title">${safe(s.title)}</div>
            <p class="step__body">${safe(s.body)}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `);
}

/** dark_premium 2026 concept: Linear/Raycast keyboard-shortcut chain
 *  (Cmd+K style) — each step is a "key", joined by a "+" connector. */
function processKbdChain(d: ProcessData, theme: Theme): string {
  return slide(theme, d.pageNo, `
    <div class="content-block">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
        ${d.subtitle ? `<p class="lead" style="margin-top:12px">${safe(d.subtitle)}</p>` : ''}
      </header>
      <div class="content-block__body">
        <div class="kc-chain">
          ${d.steps.map((s, i) => `
            <div class="kc-key">
              <div class="kc-key__n">${i + 1}</div>
              <div class="kc-key__title">${safe(s.title)}</div>
              <div class="kc-key__body">${safe(s.body)}</div>
            </div>
            ${i < d.steps.length - 1 ? '<span class="kc-plus">+</span>' : ''}
          `).join('')}
        </div>
      </div>
    </div>
  `);
}

function processSwitchbackPath(d: ProcessData, theme: Theme): string {
  const steps = d.steps.slice(0, 5);
  return slide(theme, d.pageNo, `
    <div class="content-block content-block--process-path">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
        ${d.subtitle ? `<p class="lead" style="margin-top:12px">${safe(d.subtitle)}</p>` : ''}
      </header>
      <div class="content-block__body">
        <section class="process-path pp-count-${steps.length}">
          <div class="process-path__spine"></div>
          ${steps.map((s, i) => `
            <article class="process-path__step ${i % 2 ? 'process-path__step--right' : 'process-path__step--left'}">
              <div class="process-path__node">${String(i + 1).padStart(2, '0')}</div>
              <div class="process-path__card">
                ${s.label ? `<div class="process-path__label">${safe(s.label)}</div>` : ''}
                <h3>${safe(s.title)}</h3>
                <p>${safe(s.body)}</p>
              </div>
            </article>
          `).join('')}
        </section>
      </div>
    </div>
  `);
}

export function renderProcess(d: ProcessData, theme: Theme): string {
  if (isDarkPremium(theme)) return processSwitchbackPath(d, theme);
  switch (d.layout) {
    case 'switchback_path': return processSwitchbackPath(d, theme);
    case 'kbd_chain': return processKbdChain(d, theme);
    default: return processDefault(d, theme);
  }
}

function timelineDefault(d: TimelineData, theme: Theme): string {
  const n = d.steps.length;
  return slide(theme, d.pageNo, `
    <div class="content-block">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
        ${d.subtitle ? `<p class="lead" style="margin-top:12px">${safe(d.subtitle)}</p>` : ''}
      </header>
      <div class="content-block__body"
           style="display:grid;grid-template-columns:repeat(${n},1fr);gap:20px;position:relative">
        <div style="position:absolute;top:22px;left:22px;right:22px;height:2px;
                    background:linear-gradient(90deg,var(--accent),var(--accent-soft));z-index:0"></div>
        ${d.steps.map((s, i) => `
          <div style="display:flex;flex-direction:column;gap:14px;position:relative;z-index:1">
            <div class="step__node">${i + 1}</div>
            <div class="step__date">${safe(s.date)}</div>
            <div class="step__title">${safe(s.title)}</div>
            <p class="step__body">${safe(s.body)}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `);
}

/** dark_premium 2026 concept: glow-ringed nodes on a gradient axis, no hard
 *  drop-shadows — depth via rim-light glow instead. */
function timelineRimLight(d: TimelineData, theme: Theme): string {
  return slide(theme, d.pageNo, `
    <div class="content-block">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
        ${d.subtitle ? `<p class="lead" style="margin-top:12px">${safe(d.subtitle)}</p>` : ''}
      </header>
      <div class="content-block__body">
        <div class="rl-track">
          <div class="rl-axis"></div>
          <div class="rl-row" style="grid-template-columns:repeat(${d.steps.length},1fr)">
            ${d.steps.map((s, i) => {
              const up = i % 2 === 0;
              const card = `
                <div class="rl-card ${up ? 'rl-card--up' : 'rl-card--down'}" style="grid-column:${i + 1}">
                  <div class="rl-date">${safe(s.date)}</div>
                  <div class="rl-title-sm">${safe(s.title)}</div>
                  <p class="rl-body">${safe(s.body)}</p>
                </div>
              `;
              const node = `<div class="rl-node" style="grid-column:${i + 1}">${i + 1}</div>`;
              return card + node;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
  `);
}

export function renderTimeline(d: TimelineData, theme: Theme): string {
  switch (d.layout) {
    case 'rim_light': return timelineRimLight(d, theme);
    default: return timelineDefault(d, theme);
  }
}

function batafsilDefault(d: BatafsilData, theme: Theme): string {
  const twoCol = !!d.points?.length;
  return slide(theme, d.pageNo, `
    <div class="content-block">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
      </header>
      <div class="content-block__body" style="display:grid;grid-template-columns:${twoCol ? '1.55fr 1fr' : '1fr'};gap:52px">
        <p class="batafsil__body">${safe(d.body)}</p>
        ${twoCol ? `
          <ul class="batafsil__points">
            ${d.points!.map(p => `<li><span class="batafsil__dot"></span><span>${safe(p.text)}</span></li>`).join('')}
          </ul>` : ''}
      </div>
    </div>
  `);
}

/** dark_premium 2026 concept: academic marginalia / Genius.com annotation —
 *  body text with a right-hand margin column of tick-marked notes. */
function batafsilMarginalia(d: BatafsilData, theme: Theme): string {
  const hasPoints = !!d.points?.length;
  if (isDarkPremium(theme)) {
    return slide(theme, d.pageNo, `
      <div class="content-block content-block--dossier">
        <header class="content-block__head">
          ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
          <h2 class="h2">${safe(d.title)}</h2>
        </header>
        <div class="content-block__body">
          ${dossierFrame(
            'Batafsil izoh',
            `<p class="ds-prose">${safe(d.body)}</p>`,
            dossierRail((d.points ?? []).map((p) => p.text), 'Marginal qaydlar'),
          )}
        </div>
      </div>
    `);
  }
  return slide(theme, d.pageNo, `
    <div class="content-block">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
      </header>
      <div class="content-block__body" style="display:grid;grid-template-columns:${hasPoints ? '1fr 240px' : '1fr'};gap:40px">
        <p class="mg-body">${safe(d.body)}</p>
        ${hasPoints ? `
          <div class="mg-margin">
            ${d.points!.map(p => `
              <div class="mg-note">
                <span class="mg-note__tick"></span>
                <span class="mg-note__text">${safe(p.text)}</span>
              </div>
            `).join('')}
          </div>` : ''}
      </div>
    </div>
  `);
}

/** Prose content mode — full-width paragraph replacing `body`+`points`
 *  (no side-margin column, since prose mode's data has no `points`). */
function batafsilProseFlow(d: BatafsilData, theme: Theme): string {
  if (isDarkPremium(theme)) {
    return slide(theme, d.pageNo, `
      <div class="content-block content-block--dossier">
        <header class="content-block__head">
          ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
          <h2 class="h2">${safe(d.title)}</h2>
        </header>
        <div class="content-block__body">
          ${dossierFrame('Tahliliy matn', `<p class="ds-prose ds-prose--wide">${safe(d.paragraph!)}</p>`)}
        </div>
      </div>
    `);
  }
  return slide(theme, d.pageNo, `
    <div class="content-block content-block--prose">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
      </header>
      <div class="content-block__body">
        ${proseBody(d.paragraph!)}
      </div>
    </div>
  `);
}

export function renderBatafsil(d: BatafsilData, theme: Theme): string {
  if (d.paragraph !== undefined) return batafsilProseFlow(d, theme);
  switch (d.layout) {
    case 'marginalia': return batafsilMarginalia(d, theme);
    default: return batafsilDefault(d, theme);
  }
}

function misolDefault(d: MisolData, theme: Theme): string {
  return slide(theme, d.pageNo, `
    <div class="content-block">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
      </header>
      <div class="content-block__body" style="display:grid;grid-template-columns:${d.icon ? '1.5fr auto' : '1fr'};gap:56px;align-items:center">
        <div style="display:flex;flex-direction:column;gap:22px">
          <p class="lead" style="max-width:760px">${safe(d.body)}</p>
          ${d.takeaway ? `<div class="misol__takeaway"><span>★</span><span>${safe(d.takeaway)}</span></div>` : ''}
        </div>
        ${d.icon ? `<div class="misol__icon">${icon(d.icon, 96)}</div>` : ''}
      </div>
    </div>
  `);
}

function misolWithVisual(d: MisolData, theme: Theme): string {
  return slide(theme, d.pageNo, `
    <div class="content-block content-block--visual">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
      </header>
      <div class="content-block__body wm-split">
        <div class="wm-copy">
          ${d.paragraph !== undefined ? proseBody(d.paragraph) : `<p class="lead">${safe(d.body)}</p>`}
          ${d.takeaway ? `<div class="misol__takeaway"><span>★</span><span>${safe(d.takeaway)}</span></div>` : ''}
        </div>
        ${renderWikimediaVisual(d.visual, 'wm-visual-example')}
      </div>
    </div>
  `);
}

function misolCaseStudy(d: MisolData, theme: Theme): string {
  const body = d.paragraph ?? d.body;
  const media = d.visual
    ? renderWikimediaVisual(d.visual, 'case-study__visual')
    : `<div class="case-study__glyph">${d.icon ? icon(d.icon, 82) : '01'}</div>`;
  return slide(theme, d.pageNo, `
    <div class="content-block content-block--case-study">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
      </header>
      <div class="content-block__body">
        <div class="case-study">
          <div class="case-study__main">
            <div class="case-study__marker">
              <span>CASE</span>
              <strong>01</strong>
            </div>
            <div class="case-study__copy">
              <div class="case-study__label">Amaliy namuna</div>
              <p>${safe(body)}</p>
              ${d.takeaway ? `<div class="case-study__takeaway"><span>Natija</span><strong>${safe(d.takeaway)}</strong></div>` : ''}
            </div>
          </div>
          <aside class="case-study__side">
            <div class="case-study__side-line"></div>
            ${media}
          </aside>
        </div>
      </div>
    </div>
  `);
}

/** dark_premium 2026 concept: sci-fi radar/HUD "signal detected" visual
 *  (Palantir/Bloomberg-terminal aesthetic) — rings + crosshair + glowing core. */
function misolSignalPing(d: MisolData, theme: Theme): string {
  return slide(theme, d.pageNo, `
    <div class="content-block">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
      </header>
      <div class="content-block__body" style="display:flex;align-items:center;gap:56px">
        <div class="sp-radar">
          <div class="sp-ring sp-ring--3"></div>
          <div class="sp-ring sp-ring--2"></div>
          <div class="sp-ring sp-ring--1"></div>
          <div class="sp-crosshair sp-crosshair--v"></div>
          <div class="sp-crosshair sp-crosshair--h"></div>
          <div class="sp-core"></div>
        </div>
        <div class="sp-data">
          <div class="sp-label">Aniqlangan holat</div>
          <p class="sp-body">${safe(d.body)}</p>
          ${d.takeaway ? `<div class="sp-readout">[ ${safe(d.takeaway)} ]</div>` : ''}
        </div>
      </div>
    </div>
  `);
}

/** Prose content mode — icon+takeaway layout unchanged, `body` replaced by
 *  one flowing paragraph. */
function misolProseFlow(d: MisolData, theme: Theme): string {
  return slide(theme, d.pageNo, `
    <div class="content-block content-block--prose">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
      </header>
      <div class="content-block__body" style="display:grid;grid-template-columns:${d.icon ? '1.5fr auto' : '1fr'};gap:56px;align-items:center">
        <div style="display:flex;flex-direction:column;gap:22px">
          ${proseBody(d.paragraph!)}
          ${d.takeaway ? `<div class="misol__takeaway"><span>★</span><span>${safe(d.takeaway)}</span></div>` : ''}
        </div>
        ${d.icon ? `<div class="misol__icon">${icon(d.icon, 96)}</div>` : ''}
      </div>
    </div>
  `);
}

export function renderMisol(d: MisolData, theme: Theme): string {
  if (isDarkPremium(theme)) return misolCaseStudy(d, theme);
  if (d.visual) return misolWithVisual(d, theme);
  if (d.paragraph !== undefined) return misolProseFlow(d, theme);
  switch (d.layout) {
    case 'signal_ping': return misolSignalPing(d, theme);
    default: return misolDefault(d, theme);
  }
}

function turlarDefault(d: TurlarData, theme: Theme): string {
  const items = d.items.slice(0, 4);
  return slide(theme, d.pageNo, `
    <div class="content-block">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
      </header>
      <div class="content-block__body turlar-grid ${gridForCount(items.length)}">
        ${items.map(it => `
          <div class="card">
            ${it.icon ? `<span class="card__icon">${icon(it.icon, 24)}</span>` : ''}
            <h3 class="h3">${safe(it.label)}</h3>
            <p class="text--sm muted" style="margin-top:10px">${safe(it.text)}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `);
}

/** dark_premium 2026 concept: organic squircle cards (32px radius) with a
 *  gradient icon chip and a soft top-edge highlight line. */
function turlarSquircleBento(d: TurlarData, theme: Theme): string {
  const items = d.items.slice(0, 4);
  const countClass = `sq-count-${items.length}`;
  return slide(theme, d.pageNo, `
    <div class="content-block">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
      </header>
      <div class="content-block__body">
        <div class="sq-map ${countClass}">
          <div class="sq-map__axis"></div>
          <div class="sq-map__halo sq-map__halo--a"></div>
          <div class="sq-map__halo sq-map__halo--b"></div>
          <div class="sq-map__core">TASNIF</div>
          <div class="sq-grid ${gridForCount(items.length)}" style="display:grid">
            ${items.map((it, i) => `
              <div class="sq-card">
                <div class="sq-icon">${it.icon ? icon(it.icon, 18) : i + 1}</div>
                <div class="sq-title">${safe(it.label)}</div>
                <div class="sq-text">${safe(it.text)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `);
}

export function renderTurlar(d: TurlarData, theme: Theme): string {
  switch (d.layout) {
    case 'squircle_bento': return turlarSquircleBento(d, theme);
    default: return turlarDefault(d, theme);
  }
}

export function renderAgenda(d: AgendaData, theme: Theme): string {
  return slide(theme, d.pageNo, `
    <div class="content-block">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
      </header>
      <div class="content-block__body">
        <ol class="agenda${d.items.length > 4 ? ' agenda--two' : ''}">
          ${d.items.map((it, i) => `
            <li class="agenda__item">
              <span class="agenda__num">${String(i + 1).padStart(2, '0')}</span>
              <span class="agenda__text">
                <span class="agenda__label">${safe(it.text)}</span>
              </span>
            </li>
          `).join('')}
        </ol>
      </div>
    </div>
  `);
}

function contentDefault(d: ContentData, theme: Theme): string {
  return slide(theme, d.pageNo, `
    <div class="content-block">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
        ${d.lead ? `<p class="lead" style="margin-top:14px;max-width:900px">${safe(d.lead)}</p>` : ''}
      </header>
      <div class="content-block__body">
        <ul class="points">
          ${d.points.map(p => `
            <li class="points__item">
              ${p.icon ? `<span class="points__icon">${icon(p.icon, 22)}</span>` : '<span class="points__dot"></span>'}
              <span class="points__body">
                ${p.heading ? `<span class="points__heading">${safe(p.heading)}</span> ` : ''}<span>${safe(p.text)}</span>
              </span>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
  `);
}

function contentWithVisual(d: ContentData, theme: Theme): string {
  const copy = d.paragraph !== undefined
    ? proseBody(d.paragraph)
    : `<ul class="points wm-points">${d.points.map((point) => `
        <li class="points__item">
          ${point.icon ? `<span class="points__icon">${icon(point.icon, 22)}</span>` : '<span class="points__dot"></span>'}
          <span class="points__body">${point.heading ? `<span class="points__heading">${safe(point.heading)}</span> ` : ''}<span>${safe(point.text)}</span></span>
        </li>`).join('')}</ul>`;
  return slide(theme, d.pageNo, `
    <div class="content-block content-block--visual">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
        ${d.lead ? `<p class="lead" style="margin-top:12px;max-width:760px">${safe(d.lead)}</p>` : ''}
      </header>
      <div class="content-block__body wm-split">
        <div class="wm-copy">${copy}</div>
        ${renderWikimediaVisual(d.visual, 'wm-visual-content')}
      </div>
    </div>
  `);
}

/** dark_premium 2026 concept: Linear-changelog-style monospace line numbers +
 *  accent dot per entry (developer-tool chrome aesthetic). */
function contentChangelogLines(d: ContentData, theme: Theme): string {
  if (isDarkPremium(theme)) {
    const rail = dossierRail(
      d.points.map((p) => p.heading || p.text),
      'Asosiy dalillar',
    );
    return slide(theme, d.pageNo, `
      <div class="content-block content-block--dossier">
        <header class="content-block__head">
          ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
          <h2 class="h2">${safe(d.title)}</h2>
          ${d.lead ? `<p class="lead" style="margin-top:14px;max-width:900px">${safe(d.lead)}</p>` : ''}
        </header>
        <div class="content-block__body">
          ${dossierFrame(
            'Mazmun bayoni',
            `<div class="ds-lines">
              ${d.points.map((p, i) => `
                <div class="ds-line">
                  <span class="ds-line__num">${String(i + 1).padStart(2, '0')}</span>
                  <span class="ds-line__body">${p.heading ? `<b>${safe(p.heading)}</b> ` : ''}${safe(p.text)}</span>
                </div>
              `).join('')}
            </div>`,
            rail,
          )}
        </div>
      </div>
    `);
  }
  return slide(theme, d.pageNo, `
    <div class="content-block">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
        ${d.lead ? `<p class="lead" style="margin-top:14px;max-width:900px">${safe(d.lead)}</p>` : ''}
      </header>
      <div class="content-block__body">
        <div class="cl-list">
          ${d.points.map((p, i) => `
            <div class="cl-row">
              <span class="cl-linenum">${String(i + 1).padStart(2, '0')}</span>
              <span class="cl-dot"></span>
              <span class="cl-text">${p.heading ? `<b>${safe(p.heading)}</b> ` : ''}${safe(p.text)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `);
}

/** Prose content mode — title (anchor, unchanged) + one flowing paragraph
 *  instead of lead+points. */
function contentProseFlow(d: ContentData, theme: Theme): string {
  if (isDarkPremium(theme)) {
    return slide(theme, d.pageNo, `
      <div class="content-block content-block--dossier">
        <header class="content-block__head">
          ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
          <h2 class="h2">${safe(d.title)}</h2>
        </header>
        <div class="content-block__body">
          ${dossierFrame('Akademik bayon', `<p class="ds-prose ds-prose--wide">${safe(d.paragraph!)}</p>`)}
        </div>
      </div>
    `);
  }
  return slide(theme, d.pageNo, `
    <div class="content-block content-block--prose">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
      </header>
      <div class="content-block__body">
        ${proseBody(d.paragraph!)}
      </div>
    </div>
  `);
}

export function renderContent(d: ContentData, theme: Theme): string {
  if (d.visual) return contentWithVisual(d, theme);
  // Prose content mode takes priority over any decorative `layout` concept —
  // it's a deck-wide data-shape choice (see card.prompt.prose.ts), not a
  // per-slide variety pick, so it bypasses the layout-registry entirely.
  if (d.paragraph !== undefined) return contentProseFlow(d, theme);
  switch (d.layout) {
    case 'changelog_lines': return contentChangelogLines(d, theme);
    default: return contentDefault(d, theme);
  }
}

function definitionDefault(d: DefinitionData, theme: Theme): string {
  return slide(theme, d.pageNo, `
    <div class="content-block">
      <header class="content-block__head" style="max-width:1000px">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h1" style="font-size:54px">${safe(d.term)}</h2>
        <p class="lead" style="margin-top:18px">${safe(d.definition)}</p>
      </header>
      ${d.aspects?.length
        ? `<div class="content-block__body ${gridForCount(d.aspects.length)}">
            ${d.aspects.map(a => `
              <div class="card">
                ${a.icon ? `<span class="card__icon">${icon(a.icon, 24)}</span>` : ''}
                <div class="def-aspect__label">${safe(a.label)}</div>
                <p class="text--sm muted" style="margin-top:10px">${safe(a.text)}</p>
              </div>
            `).join('')}
          </div>`
        : '<div></div>'}
    </div>
  `);
}

/** dark_premium 2026 concept: frosted-glass panel over two ambient gold/blue
 *  orbs — ".gh-panel" has a print-safe fallback (see document.ts @media print). */
function definitionGlassHero(d: DefinitionData, theme: Theme): string {
  // NOTE: gh-orb1/gh-orb2 are nested INSIDE .content-block (not siblings of it
  // as direct .slide children) — document.ts has a global rule
  // `.slide > *:not(...)` that forces position:relative on every direct
  // .slide child, which would override the orbs' position:absolute and pull
  // them (and everything after them) into normal document flow, pushing
  // .content-block below the visible slide. Nesting them one level deeper
  // sidesteps that rule; .content-block's own position:relative (also from
  // that same global rule) becomes their positioning context instead, which
  // is visually equivalent for an ambient background glow.
  if (isDarkPremium(theme)) {
    return slide(theme, d.pageNo, `
      <div class="content-block content-block--dossier content-block--definition-dossier">
        <header class="content-block__head" style="position:relative;z-index:1">
          ${d.kicker ? `<div class="kicker">${safe(d.kicker)}</div>` : ''}
        </header>
        <div class="content-block__body">
          ${dossierFrame(
            'Termin dosyesi',
            `<div class="ds-term">${safe(d.term)}</div><p class="ds-prose">${safe(d.definition)}</p>`,
            dossierRail((d.aspects ?? []).map((a) => `${a.label}: ${a.text}`), 'Belgilar'),
          )}
        </div>
      </div>
    `);
  }
  return slide(theme, d.pageNo, `
    <div class="content-block">
      <div class="gh-orb1"></div><div class="gh-orb2"></div>
      <header class="content-block__head" style="position:relative;z-index:1">
        ${d.kicker ? `<div class="kicker">${safe(d.kicker)}</div>` : ''}
      </header>
      <div class="content-block__body">
        <div class="gh-panel">
          <div class="gh-term">${safe(d.term)}</div>
          <p class="gh-def">${safe(d.definition)}</p>
        </div>
      </div>
    </div>
  `);
}

/** Prose content mode — `term` stays the dominant giant element (unchanged
 *  identity); one flowing paragraph replaces `definition`+`aspects`. */
function definitionProseFlow(d: DefinitionData, theme: Theme): string {
  if (isDarkPremium(theme)) {
    return slide(theme, d.pageNo, `
      <div class="content-block content-block--dossier content-block--definition-dossier">
        <header class="content-block__head" style="max-width:1000px">
          ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        </header>
        <div class="content-block__body">
          ${dossierFrame(
            'Termin dosyesi',
            `<div class="ds-term">${safe(d.term)}</div><p class="ds-prose ds-prose--wide">${safe(d.paragraph!)}</p>`,
          )}
        </div>
      </div>
    `);
  }
  return slide(theme, d.pageNo, `
    <div class="content-block content-block--prose">
      <header class="content-block__head" style="max-width:1000px">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h1" style="font-size:54px">${safe(d.term)}</h2>
      </header>
      <div class="content-block__body" style="max-width:900px">
        ${proseBody(d.paragraph!)}
      </div>
    </div>
  `);
}

export function renderDefinition(d: DefinitionData, theme: Theme): string {
  if (d.paragraph !== undefined) return definitionProseFlow(d, theme);
  switch (d.layout) {
    case 'glass_hero': return definitionGlassHero(d, theme);
    default: return definitionDefault(d, theme);
  }
}

export function renderConclusion(d: ConclusionData, theme: Theme): string {
  if (isDarkPremium(theme)) {
    const main = d.paragraph !== undefined
      ? `<p class="ds-prose ds-prose--wide">${safe(d.paragraph)}</p>`
      : `<div class="ds-lines ds-lines--verdict">
          ${d.points.map((p, i) => `
            <div class="ds-line">
              <span class="ds-line__num">${String(i + 1).padStart(2, '0')}</span>
              <span class="ds-line__body">${safe(p)}</span>
            </div>
          `).join('')}
        </div>`;
    return slide(theme, d.pageNo, `
      <div class="content-block content-block--dossier">
        <header class="content-block__head">
          ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
          <h2 class="h2">${safe(d.title)}</h2>
        </header>
        <div class="content-block__body">
          ${dossierFrame(
            'Yakuniy xulosa',
            `${main}${d.closing ? `<p class="ds-closing">${safe(d.closing)}</p>` : ''}`,
          )}
        </div>
      </div>
    `);
  }
  // Prose content mode — one flowing paragraph replaces the numbered points
  // list; `closing` (the final sentence) stays either way.
  const body =
    d.paragraph !== undefined
      ? proseBody(d.paragraph)
      : `<ul class="conclusion">
          ${d.points.map((p, i) => `
            <li class="conclusion__item">
              <span class="conclusion__num">${i + 1}</span>
              <span class="conclusion__text">${safe(p)}</span>
            </li>
          `).join('')}
        </ul>`;
  return slide(theme, d.pageNo, `
    <div class="content-block${d.paragraph !== undefined ? ' content-block--prose' : ''}">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
      </header>
      <div class="content-block__body" style="display:flex;flex-direction:column;gap:26px">
        ${body}
        ${d.closing ? `<p class="conclusion__closing">${safe(d.closing)}</p>` : ''}
      </div>
    </div>
  `);
}

export function renderReferences(d: ReferencesData, theme: Theme): string {
  if (isDarkPremium(theme)) {
    return slide(theme, d.pageNo, `
      <div class="content-block content-block--dossier">
        <header class="content-block__head">
          <h2 class="h2">${safe(d.title)}</h2>
        </header>
        <div class="content-block__body">
          ${dossierFrame(
            'Manbalar ro‘yxati',
            `<ol class="ds-refs">
              ${d.items.map((it, i) => `<li><span>${String(i + 1).padStart(2, '0')}</span><p>${safe(typeof it === 'string' ? it : it.text)}</p></li>`).join('')}
            </ol>`,
          )}
        </div>
      </div>
    `);
  }
  return slide(theme, d.pageNo, `
    <div class="content-block">
      <header class="content-block__head">
        <h2 class="h2">${safe(d.title)}</h2>
      </header>
      <div class="content-block__body">
        <ol class="refs" style="${d.items.length > 5 ? 'column-count:2;column-gap:56px' : ''}">
          ${d.items.map(it => `<li class="refs__item">${safe(typeof it === 'string' ? it : it.text)}</li>`).join('')}
        </ol>
      </div>
    </div>
  `);
}

export function renderClosing(d: ClosingData, theme: Theme): string {
  return slide(theme, d.pageNo, `
    <div style="padding:var(--pad-y) var(--pad-x);height:100%;display:flex;
                flex-direction:column;justify-content:center;align-items:center;
                text-align:center;gap:22px">
      <h1 class="h1" style="font-size:62px;max-width:1060px">${safe(d.title)}</h1>
      ${d.subtitle ? `<p class="lead" style="max-width:760px;text-align:center">${safe(d.subtitle)}</p>` : ''}
      ${d.contact ? `<div class="tag">${safe(d.contact)}</div>` : ''}
    </div>
  `, { seal: true });
}

/** Prose content mode — one flowing paragraph replaces `lead`+`points`+`stat`
 *  (a stat callout doesn't fit the flowing-prose aesthetic); `source` kept as
 *  a plain citation note. */
function relevanceProseFlow(d: RelevanceData, theme: Theme): string {
  if (isDarkPremium(theme)) {
    return slide(theme, d.pageNo, `
      <div class="content-block content-block--dossier">
        <header class="content-block__head">
          ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
          <h2 class="h2">${safe(d.title)}</h2>
        </header>
        <div class="content-block__body">
          ${dossierFrame(
            'Dolzarblik briefi',
            `<p class="ds-prose ds-prose--wide">${safe(d.paragraph!)}</p>${d.source ? `<p class="source-note ds-source">${safe(d.source)}</p>` : ''}`,
          )}
        </div>
      </div>
    `);
  }
  return slide(theme, d.pageNo, `
    <div class="content-block content-block--prose">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
      </header>
      <div class="content-block__body">
        ${proseBody(d.paragraph!)}
        ${d.source ? `<p class="source-note" style="margin-top:20px">${safe(d.source)}</p>` : ''}
      </div>
    </div>
  `);
}

export function renderRelevance(d: RelevanceData, theme: Theme): string {
  if (d.paragraph !== undefined) return relevanceProseFlow(d, theme);
  if (isDarkPremium(theme)) {
    const stat = d.stat
      ? `<div class="ds-stat">
          <div class="ds-stat__num">${statNum(d.stat)}</div>
          <div class="ds-stat__label">${safe(d.stat.label)}</div>
          ${d.source ? `<div class="ds-stat__src">${safe(d.source)}</div>` : ''}
        </div>`
      : '';
    return slide(theme, d.pageNo, `
      <div class="content-block content-block--dossier">
        <header class="content-block__head">
          ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
          <h2 class="h2">${safe(d.title)}</h2>
          ${d.lead ? `<p class="lead" style="margin-top:14px;max-width:900px">${safe(d.lead)}</p>` : ''}
        </header>
        <div class="content-block__body">
          ${dossierFrame(
            'Dolzarblik briefi',
            `<div class="ds-lines">
              ${d.points.map((p, i) => `
                <div class="ds-line">
                  <span class="ds-line__num">${String(i + 1).padStart(2, '0')}</span>
                  <span class="ds-line__body">${safe(p.text)}</span>
                </div>
              `).join('')}
            </div>${!d.stat && d.source ? `<p class="source-note ds-source">${safe(d.source)}</p>` : ''}`,
            stat,
          )}
        </div>
      </div>
    `);
  }
  const twoCol = !!d.stat;
  const pointsList = `
    <ul class="points">
      ${d.points.map(p => `
        <li class="points__item">
          <span class="points__dot"></span>
          <span class="points__body">${safe(p.text)}</span>
        </li>
      `).join('')}
    </ul>`;
  return slide(theme, d.pageNo, `
    <div class="content-block">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
        ${d.lead ? `<p class="lead" style="margin-top:14px;max-width:900px">${safe(d.lead)}</p>` : ''}
      </header>
      <div class="content-block__body" style="display:grid;grid-template-columns:${twoCol ? '1.6fr 1fr' : '1fr'};gap:52px;align-items:center">
        <div>${pointsList}${!twoCol && d.source ? `<p class="source-note" style="margin-top:20px">${safe(d.source)}</p>` : ''}</div>
        ${twoCol ? `
          <div class="problem-stat">
            <div class="problem-stat__num">${statNum(d.stat!)}</div>
            <div class="problem-stat__lbl">${safe(d.stat!.label)}</div>
            ${d.source ? `<div class="problem-stat__src">${safe(d.source)}</div>` : ''}
          </div>` : ''}
      </div>
    </div>
  `);
}

export function renderAimTasks(d: AimTasksData, theme: Theme): string {
  if (isDarkPremium(theme)) {
    const aim = d.paragraph !== undefined ? d.paragraph : d.aim;
    return slide(theme, d.pageNo, `
      <div class="content-block content-block--dossier">
        <header class="content-block__head">
          ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
          <h2 class="h2">${safe(d.title)}</h2>
        </header>
        <div class="content-block__body">
          ${dossierFrame(
            'Maqsad briefi',
            `<p class="ds-prose">${safe(aim)}</p>`,
            dossierRail(d.tasks, 'Vazifalar', 5),
          )}
        </div>
      </div>
    `);
  }
  // Prose content mode — a fuller paragraph replaces the short `aim`
  // statement; `tasks` stays a list either way (hybrid type — sequence
  // matters, per card.prompt.prose.ts).
  const aimBlock = d.paragraph !== undefined ? proseBody(d.paragraph) : `<p class="aim-statement">${safe(d.aim)}</p>`;
  return slide(theme, d.pageNo, `
    <div class="content-block${d.paragraph !== undefined ? ' content-block--prose' : ''}">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
      </header>
      <div class="content-block__body" style="display:flex;flex-direction:column;gap:22px">
        ${aimBlock}
        <ul class="conclusion">
          ${d.tasks.map((tk, i) => `
            <li class="conclusion__item">
              <span class="conclusion__num">${i + 1}</span>
              <span class="conclusion__text">${safe(tk)}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
  `);
}

/** Prose content mode — one flowing paragraph (object narrowing to subject
 *  expressed in prose) replaces the two-column object/subject split. */
function objectSubjectProseFlow(d: ObjectSubjectData, theme: Theme): string {
  if (isDarkPremium(theme)) {
    return slide(theme, d.pageNo, `
      <div class="content-block content-block--dossier">
        <header class="content-block__head">
          ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
          <h2 class="h2">${safe(d.title)}</h2>
        </header>
        <div class="content-block__body">
          ${dossierFrame('Tadqiqot fokusi', `<p class="ds-prose ds-prose--wide">${safe(d.paragraph!)}</p>`)}
        </div>
      </div>
    `);
  }
  return slide(theme, d.pageNo, `
    <div class="content-block content-block--prose">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
      </header>
      <div class="content-block__body">
        ${proseBody(d.paragraph!)}
      </div>
    </div>
  `);
}

export function renderObjectSubject(d: ObjectSubjectData, theme: Theme): string {
  if (d.paragraph !== undefined) return objectSubjectProseFlow(d, theme);
  return slide(theme, d.pageNo, `
    <div class="content-block">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
      </header>
      <div class="content-block__body">
        <div class="compare">
          <div class="compare__col compare__col--now">
            <span class="kicker" style="color:inherit">${safe(d.object.label)}</span>
            <p class="osubj__text">${safe(d.object.text)}</p>
          </div>
          <div class="compare__col compare__col--next">
            <span class="kicker" style="color:inherit">${safe(d.subject.label)}</span>
            <p class="osubj__text">${safe(d.subject.text)}</p>
          </div>
        </div>
      </div>
    </div>
  `);
}

function findingDefault(d: FindingData, theme: Theme): string {
  const twoCol = !!d.points?.length;
  return slide(theme, d.pageNo, `
    <div class="content-block">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
      </header>
      <div class="content-block__body" style="display:grid;grid-template-columns:${twoCol ? '1.55fr 1fr' : '1fr'};gap:52px">
        <div>
          <p class="batafsil__body">${safe(d.evidence)}</p>
          ${d.interpretation ? `<p class="finding__interpretation"><strong>Tahlil:</strong> ${safe(d.interpretation)}</p>` : ''}
          ${d.limitation ? `<p class="finding__limitation">${safe(d.limitation)}</p>` : ''}
          ${d.source ? `<p class="source-note" style="margin-top:18px">${safe(d.source)}</p>` : ''}
        </div>
        ${twoCol ? `
          <ul class="batafsil__points">
            ${d.points!.map(p => `<li><span class="batafsil__dot"></span><span>${safe(p.text)}</span></li>`).join('')}
          </ul>` : ''}
      </div>
    </div>
  `);
}

function findingResearchBrief(d: FindingData, theme: Theme): string {
  const points = d.points ?? [];
  return slide(theme, d.pageNo, `
    <div class="content-block content-block--finding-brief">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
      </header>
      <div class="content-block__body">
        <section class="finding-brief">
          <div class="finding-brief__claim">
            <div class="finding-brief__stamp">Natija</div>
            <p>${safe(d.evidence)}</p>
            ${d.source ? `<div class="finding-brief__source">${safe(d.source)}</div>` : ''}
          </div>
          <aside class="finding-brief__side">
            ${points.length ? `
              <div class="finding-brief__panel">
                <div class="finding-brief__label">Dalil tayanchlari</div>
                <ol class="finding-brief__points">
                  ${points.slice(0, 4).map((p, i) => `
                    <li><span>${String(i + 1).padStart(2, '0')}</span><p>${safe(p.text)}</p></li>
                  `).join('')}
                </ol>
              </div>
            ` : ''}
            ${d.interpretation ? `
              <div class="finding-brief__panel finding-brief__panel--analysis">
                <div class="finding-brief__label">Tahlil</div>
                <p>${safe(d.interpretation)}</p>
              </div>
            ` : ''}
            ${d.limitation ? `<div class="finding-brief__caveat">${safe(d.limitation)}</div>` : ''}
          </aside>
        </section>
      </div>
    </div>
  `);
}

/** dark_premium 2026 concept: 3 layered/rotated glass cards suggesting depth.
 *  Needs >=2 points (front card is `evidence`, back two are `points[0..1]`) —
 *  falls back to the default layout when the data shape doesn't fit. */
function findingZStack(d: FindingData, theme: Theme): string {
  if (!d.points || d.points.length < 2) {
    return findingDefault(d, theme);
  }
  const [p1, p2] = d.points;
  return slide(theme, d.pageNo, `
    <div class="content-block" style="grid-template-rows:auto 1fr">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2" style="font-size:32px;margin-top:8px">${safe(d.title)}</h2>
      </header>
      <div class="zs-wrap">
        <div class="zs-card zs-card--back1"><div class="zs-num">03</div><div class="zs-title">${safe(p2.text)}</div></div>
        <div class="zs-card zs-card--back2"><div class="zs-num">02</div><div class="zs-title">${safe(p1.text)}</div></div>
        <div class="zs-card zs-card--front"><div class="zs-num">01</div><div class="zs-text">${safe(d.evidence)}</div></div>
      </div>
    </div>
  `);
}

export function renderFinding(d: FindingData, theme: Theme): string {
  if (isDarkPremium(theme)) return findingResearchBrief(d, theme);
  switch (d.layout) {
    case 'z_stack': return findingZStack(d, theme);
    default: return findingDefault(d, theme);
  }
}

function problemsSolutionsDefault(d: ProblemsSolutionsData, theme: Theme): string {
  return slide(theme, d.pageNo, `
    <div class="content-block">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
        ${d.subtitle ? `<p class="lead" style="margin-top:12px">${safe(d.subtitle)}</p>` : ''}
      </header>
      <div class="content-block__body">
        <div class="psol">
          <div class="psol__head psol__head--problem">Muammo</div>
          <div class="psol__head psol__head--solution">Yechim</div>
          ${d.pairs.map(p => `
            <div class="psol__cell psol__cell--problem">${safe(p.problem)}</div>
            <div class="psol__cell psol__cell--solution">${safe(p.solution)}</div>
          `).join('')}
        </div>
      </div>
    </div>
  `);
}

/** dark_premium 2026 concept: GitHub/GitLab diff-view (git commit review) —
 *  each problem/solution pair rendered as a removed/added diff line pair.
 *  NOTE: the red/green marker colors (#E56259/#61C454) are INTENTIONALLY raw
 *  hex, not semantic tokens — they encode the universal diff-view convention
 *  (red=removed, green=added); mapping them to var(--accent) would break that
 *  visual metaphor. This is a deliberate exception, not an oversight. */
function problemsSolutionsDiffView(d: ProblemsSolutionsData, theme: Theme): string {
  return slide(theme, d.pageNo, `
    <div class="content-block">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
        ${d.subtitle ? `<p class="lead" style="margin-top:12px">${safe(d.subtitle)}</p>` : ''}
      </header>
      <div class="content-block__body">
        <div class="df-block">
          ${d.pairs.map(p => `
            <div class="df-line df-line--rm"><span class="df-marker">−</span><span class="df-text">${safe(p.problem)}</span></div>
            <div class="df-line df-line--add"><span class="df-marker">+</span><span class="df-text">${safe(p.solution)}</span></div>
          `).join('')}
        </div>
      </div>
    </div>
  `);
}

function problemsSolutionsMatrix(d: ProblemsSolutionsData, theme: Theme): string {
  return slide(theme, d.pageNo, `
    <div class="content-block content-block--ps-matrix">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
      </header>
      <div class="content-block__body">
        <section class="ps-matrix">
          ${d.subtitle ? `<p class="ps-matrix__context">${safe(d.subtitle)}</p>` : ''}
          <div class="ps-matrix__rows">
            ${d.pairs.slice(0, 3).map((p, i) => `
              <article class="ps-matrix__row">
                <div class="ps-matrix__num">${String(i + 1).padStart(2, '0')}</div>
                <div class="ps-matrix__cell ps-matrix__cell--problem">
                  <span>Muammo</span>
                  <p>${safe(p.problem)}</p>
                </div>
                <div class="ps-matrix__arrow">→</div>
                <div class="ps-matrix__cell ps-matrix__cell--solution">
                  <span>Yechim</span>
                  <p>${safe(p.solution)}</p>
                </div>
              </article>
            `).join('')}
          </div>
        </section>
      </div>
    </div>
  `);
}

export function renderProblemsSolutions(d: ProblemsSolutionsData, theme: Theme): string {
  if (isDarkPremium(theme)) return problemsSolutionsMatrix(d, theme);
  switch (d.layout) {
    case 'diff_view': return problemsSolutionsDiffView(d, theme);
    default: return problemsSolutionsDefault(d, theme);
  }
}
