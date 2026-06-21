// layouts.ts
// One render function per slide type. Each returns an HTML string
// that uses classes defined in document.ts. Render functions are
// pure — no I/O, no side effects.

import { Theme } from './theme';

// ============================================================
// DATA INTERFACES
// ============================================================

export interface SlideMeta {
  pageNo?: string | number;
}

export interface TitleData extends SlideMeta {
  kicker?: string;
  title: string;
  subtitle?: string;
  meta?: { label: string; value: string }[];
}

export interface StatsData extends SlideMeta {
  title: string;
  subtitle?: string;
  stats: { value: string; label: string }[];
}

export interface ProblemData extends SlideMeta {
  kicker?: string;
  statement: string;
  context?: { value: string; description: string }[];
}

export interface InsightData extends SlideMeta {
  kicker?: string;
  statement: string;
  body?: string;
}

export interface ComparisonData extends SlideMeta {
  title: string;
  subtitle?: string;
  before: { label: string; title?: string; items: string[] };
  after:  { label: string; title?: string; items: string[] };
}

export interface ProcessData extends SlideMeta {
  title: string;
  subtitle?: string;
  steps: { label?: string; title: string; body: string }[];
}

export interface TimelineData extends SlideMeta {
  title: string;
  subtitle?: string;
  steps: { date: string; title: string; body: string }[];
}

export interface SolutionData extends SlideMeta {
  kicker?: string;
  title: string;
  body?: string;
  features?: { title: string; body: string }[];
}

export interface OpportunityData extends SlideMeta {
  title: string;
  subtitle?: string;
  big: { value: string; label: string };
  supports?: { value: string; label: string }[];
}

export interface CaseStudyData extends SlideMeta {
  kicker?: string;
  title: string;
  body: string;
  customer?: string;
  metrics: { value: string; label: string }[];
}

export interface QuoteData extends SlideMeta {
  kicker?: string;
  quote: string;
  author: { initials: string; name: string; role: string };
}

export interface RoadmapData extends SlideMeta {
  title: string;
  subtitle?: string;
  phases: { date: string; title: string; body: string; items?: string[] }[];
}

export interface CtaData extends SlideMeta {
  kicker?: string;
  title: string;
  body?: string;
  actions: { label: string; primary?: boolean }[];
  footnote?: string;
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

const corners = (t: Theme, pageNo?: string | number): string => `
  ${pageNo != null ? `<span class="page-no">${safe(String(pageNo))}</span>` : ''}
  <span class="theme-tag"><span class="theme-tag__dot"></span>${safe(t.name)}</span>
`;

const gridForCount = (n: number): string =>
  n >= 5 ? 'grid-5' : n === 4 ? 'grid-4' : n === 3 ? 'grid-3' : 'grid-2';

/**
 * Common wrapper. Produces `<section class="slide ...">` and puts
 * the corner labels OUTSIDE the layout wrapper so they anchor to the
 * slide's border box, not the layout's padded box.
 */
const slide = (theme: Theme, pageNo: string | number | undefined, inner: string): string => `
  <section class="slide ${styleClass(theme)}">
    ${inner}
    ${corners(theme, pageNo)}
  </section>
`;

// ============================================================
// RENDER FUNCTIONS
// ============================================================

export function renderTitle(d: TitleData, theme: Theme): string {
  return slide(theme, d.pageNo, `
    <div class="title-block">
      <div>${d.kicker ? `<div class="kicker">${safe(d.kicker)}</div>` : ''}</div>
      <div class="title-block__center">
        <h1 class="h1">${safe(d.title)}</h1>
        ${d.subtitle ? `<p class="lead">${safe(d.subtitle)}</p>` : ''}
      </div>
      <div>${d.meta?.length
        ? `<div class="title-block__meta">${d.meta.map(m => `
            <div><b>${safe(m.label)}</b>${safe(m.value)}</div>
          `).join('')}</div>`
        : ''}</div>
    </div>
  `);
}

export function renderStats(d: StatsData, theme: Theme): string {
  return slide(theme, d.pageNo, `
    <div class="content-block">
      <header class="content-block__head">
        <h2 class="h2">${safe(d.title)}</h2>
        ${d.subtitle ? `<p class="lead" style="margin-top:14px">${safe(d.subtitle)}</p>` : ''}
      </header>
      <div class="content-block__body ${gridForCount(d.stats.length)}"
           style="border-top:1px solid var(--border);padding-top:36px">
        ${d.stats.map(s => `
          <div class="metric">
            <div class="metric__num">${safe(s.value)}</div>
            <div class="metric__lbl">${safe(s.label)}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `);
}

export function renderProblem(d: ProblemData, theme: Theme): string {
  return slide(theme, d.pageNo, `
    <div style="display:grid;grid-template-rows:auto 1fr auto;height:100%;
                padding:var(--pad-y) var(--pad-x);gap:32px">
      <div>${d.kicker ? `<div class="kicker">${safe(d.kicker)}</div>` : ''}</div>
      <div style="align-self:center">
        <h2 class="h1" style="font-size:60px;line-height:1.04;max-width:1020px">
          ${safe(d.statement)}
        </h2>
      </div>
      <div>${d.context?.length
        ? `<div class="grid-3" style="border-top:1px solid var(--border);padding-top:26px">
            ${d.context.map(ctx => `
              <div>
                <div class="metric__num" style="font-size:32px">${safe(ctx.value)}</div>
                <p class="text--sm muted" style="margin-top:8px">${safe(ctx.description)}</p>
              </div>
            `).join('')}
          </div>`
        : ''}</div>
    </div>
  `);
}

export function renderInsight(d: InsightData, theme: Theme): string {
  return slide(theme, d.pageNo, `
    <div style="display:grid;grid-template-rows:auto 1fr;height:100%;
                padding:var(--pad-y) var(--pad-x);gap:32px">
      <div>${d.kicker ? `<div class="kicker">${safe(d.kicker)}</div>` : ''}</div>
      <div style="align-self:center;max-width:1020px;display:flex;flex-direction:column;gap:28px">
        <h2 class="h1" style="font-size:56px">${safe(d.statement)}</h2>
        ${d.body ? `<p class="lead" style="max-width:760px">${safe(d.body)}</p>` : ''}
      </div>
    </div>
  `);
}

export function renderComparison(d: ComparisonData, theme: Theme): string {
  return slide(theme, d.pageNo, `
    <div class="content-block">
      <header class="content-block__head">
        <h2 class="h2">${safe(d.title)}</h2>
        ${d.subtitle ? `<p class="lead" style="margin-top:12px">${safe(d.subtitle)}</p>` : ''}
      </header>
      <div class="content-block__body compare">
        <div class="compare__col compare__col--now">
          <span class="kicker" style="color:inherit">${safe(d.before.label)}</span>
          ${d.before.title ? `<h3 class="h3">${safe(d.before.title)}</h3>` : ''}
          <ul class="compare__list">
            ${d.before.items.map(i => `<li><span>—</span><span>${safe(i)}</span></li>`).join('')}
          </ul>
        </div>
        <div class="compare__col compare__col--next">
          <span class="kicker" style="color:inherit">${safe(d.after.label)}</span>
          ${d.after.title ? `<h3 class="h3">${safe(d.after.title)}</h3>` : ''}
          <ul class="compare__list">
            ${d.after.items.map(i => `<li><span>→</span><span>${safe(i)}</span></li>`).join('')}
          </ul>
        </div>
      </div>
    </div>
  `);
}

export function renderProcess(d: ProcessData, theme: Theme): string {
  return slide(theme, d.pageNo, `
    <div class="content-block">
      <header class="content-block__head">
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

export function renderTimeline(d: TimelineData, theme: Theme): string {
  const n = d.steps.length;
  return slide(theme, d.pageNo, `
    <div class="content-block">
      <header class="content-block__head">
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

export function renderSolution(d: SolutionData, theme: Theme): string {
  return slide(theme, d.pageNo, `
    <div class="content-block">
      <header class="content-block__head">
        ${d.kicker ? `<div class="kicker" style="margin-bottom:14px">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
        ${d.body ? `<p class="lead" style="margin-top:14px;max-width:760px">${safe(d.body)}</p>` : ''}
      </header>
      ${d.features?.length
        ? `<div class="content-block__body grid-3">
            ${d.features.map(f => `
              <div class="card">
                <h3 class="h3">${safe(f.title)}</h3>
                <p class="text--sm muted" style="margin-top:12px">${safe(f.body)}</p>
              </div>
            `).join('')}
          </div>`
        : '<div></div>'}
    </div>
  `);
}

export function renderOpportunity(d: OpportunityData, theme: Theme): string {
  return slide(theme, d.pageNo, `
    <div style="display:grid;grid-template-columns:1.2fr 1fr;height:100%">
      <div style="padding:var(--pad-y) 64px var(--pad-y) var(--pad-x);
                  display:flex;flex-direction:column;justify-content:center;gap:22px">
        <h2 class="h2">${safe(d.title)}</h2>
        ${d.subtitle ? `<p class="lead" style="max-width:480px">${safe(d.subtitle)}</p>` : ''}
        ${d.supports?.length
          ? `<div class="grid-2" style="margin-top:18px;border-top:1px solid var(--border);padding-top:24px">
              ${d.supports.map(s => `
                <div>
                  <div class="metric__num" style="font-size:36px">${safe(s.value)}</div>
                  <div class="metric__lbl" style="margin-top:8px">${safe(s.label)}</div>
                </div>
              `).join('')}
            </div>`
          : ''}
      </div>
      <div style="background:var(--accent);color:var(--bg);
                  padding:var(--pad-y) var(--pad-x) var(--pad-y) 64px;
                  display:flex;flex-direction:column;justify-content:center;gap:24px">
        <div class="metric__num"
             style="font-size:160px;line-height:0.85;letter-spacing:-0.05em;color:inherit">
          ${safe(d.big.value)}
        </div>
        <div style="font-size:18px;font-weight:500;line-height:1.4;
                    border-top:2px solid currentColor;padding-top:18px;max-width:360px">
          ${safe(d.big.label)}
        </div>
      </div>
    </div>
  `);
}

export function renderCaseStudy(d: CaseStudyData, theme: Theme): string {
  return slide(theme, d.pageNo, `
    <div style="display:grid;grid-template-columns:1.1fr 0.9fr;height:100%">
      <div style="padding:var(--pad-y) 64px var(--pad-y) var(--pad-x);
                  display:flex;flex-direction:column;justify-content:center;gap:22px">
        ${d.kicker ? `<div class="kicker">${safe(d.kicker)}</div>` : ''}
        <h2 class="h2">${safe(d.title)}</h2>
        <p class="lead" style="max-width:480px">${safe(d.body)}</p>
        ${d.customer
          ? `<div style="padding-top:22px;border-top:1px solid var(--border);
                          font-size:13px;color:var(--text-muted)">${safe(d.customer)}</div>`
          : ''}
      </div>
      <div style="background:var(--text);color:var(--bg);
                  padding:var(--pad-y) 64px;display:flex;flex-direction:column;
                  justify-content:center;gap:32px">
        ${d.metrics.map((m, i) => `
          <div style="${i < d.metrics.length - 1
                       ? 'border-bottom:1px solid rgba(255,255,255,0.12);padding-bottom:28px'
                       : ''}">
            <div class="metric__num" style="color:inherit;font-size:52px">${safe(m.value)}</div>
            <div style="font-size:14px;opacity:0.75;margin-top:8px">${safe(m.label)}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `);
}

export function renderQuote(d: QuoteData, theme: Theme): string {
  return slide(theme, d.pageNo, `
    <div style="padding:var(--pad-y) var(--pad-x);display:grid;
                grid-template-rows:auto 1fr auto;height:100%;gap:24px">
      <div>${d.kicker ? `<div class="kicker">${safe(d.kicker)}</div>` : ''}</div>
      <div class="quote">
        <div class="quote__mark">&ldquo;</div>
        <div class="quote__body">${safe(d.quote)}</div>
      </div>
      <div class="quote__attr">
        <div class="quote__av">${safe(d.author.initials)}</div>
        <div class="quote__who">
          <b>${safe(d.author.name)}</b>
          <span>${safe(d.author.role)}</span>
        </div>
      </div>
    </div>
  `);
}

export function renderRoadmap(d: RoadmapData, theme: Theme): string {
  return slide(theme, d.pageNo, `
    <div class="content-block">
      <header class="content-block__head">
        <h2 class="h2">${safe(d.title)}</h2>
        ${d.subtitle ? `<p class="lead" style="margin-top:12px">${safe(d.subtitle)}</p>` : ''}
      </header>
      <div class="content-block__body grid-3">
        ${d.phases.map(p => `
          <div class="card">
            <div class="step__date">${safe(p.date)}</div>
            <h3 class="h3" style="margin-top:16px">${safe(p.title)}</h3>
            <p class="text--sm muted" style="margin-top:12px">${safe(p.body)}</p>
            ${p.items?.length
              ? `<ul style="list-style:none;margin-top:22px;padding-top:18px;
                            border-top:1px solid var(--border);display:flex;
                            flex-direction:column;gap:10px;font-size:14px;color:var(--text-muted)">
                  ${p.items.map(i => `<li>→ ${safe(i)}</li>`).join('')}
                </ul>`
              : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `);
}

export function renderCta(d: CtaData, theme: Theme): string {
  return slide(theme, d.pageNo, `
    <div style="padding:var(--pad-y) var(--pad-x);display:grid;
                grid-template-rows:auto 1fr auto;height:100%;gap:24px">
      <div>${d.kicker ? `<div class="kicker">${safe(d.kicker)}</div>` : ''}</div>
      <div style="align-self:center;display:flex;flex-direction:column;gap:26px;max-width:960px">
        <h1 class="h1" style="font-size:72px">${safe(d.title)}</h1>
        ${d.body ? `<p class="lead" style="max-width:760px">${safe(d.body)}</p>` : ''}
        <div style="display:flex;gap:12px;margin-top:14px">
          ${d.actions.map(a => `
            <span class="btn ${a.primary ? 'btn--primary' : 'btn--secondary'}">${safe(a.label)}</span>
          `).join('')}
        </div>
      </div>
      <div>${d.footnote
        ? `<div class="text--sm muted" style="border-top:1px solid var(--border);padding-top:18px">
            ${safe(d.footnote)}
          </div>`
        : ''}</div>
    </div>
  `);
}
