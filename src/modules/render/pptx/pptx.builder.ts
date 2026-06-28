import PptxGenJS from 'pptxgenjs';
import { getPptxTheme, PptxTheme } from './pptx.theme';

export interface PptxSlide {
  type: string;
  content: any;
}

const W = 13.333;
const H = 7.5;
const M = 0.7;
const CW = W - 2 * M;

const clean = (s: unknown): string =>
  String(s ?? '').replace(/<[^>]+>/g, '').trim();

type Slide = PptxGenJS.Slide;

function kicker(s: Slide, t: PptxTheme, text?: string): void {
  if (!text) return;
  s.addText(clean(text).toUpperCase(), {
    x: M, y: 0.55, w: CW, h: 0.35, fontFace: t.body,
    fontSize: 12, color: t.numColor, bold: true, charSpacing: 3,
  });
}

function pageNo(s: Slide, t: PptxTheme, n: number): void {
  s.addText(String(n).padStart(2, '0'), {
    x: W - 1.2, y: H - 0.55, w: 0.8, h: 0.3, align: 'right',
    fontFace: t.body, fontSize: 10, color: t.muted,
  });
}

function bullets(items: string[], t: PptxTheme, color?: string) {
  return items.map((it) => ({
    text: clean(it),
    options: { bullet: { code: '2022' }, breakLine: true, color: color ?? t.text, fontSize: 14 },
  }));
}

function card(s: Slide, t: PptxTheme, x: number, y: number, w: number, h: number, fill?: string): void {
  s.addShape('roundRect' as any, {
    x, y, w, h, rectRadius: t.radius,
    fill: { color: fill ?? t.surface },
    line: { color: t.border, width: 1 },
  });
}

/* ---------------- renderers ---------------- */

function rTitle(s: Slide, t: PptxTheme, d: any): void {
  kicker(s, t, d.kicker);
  s.addText(clean(d.title), {
    x: M - 0.04, y: 2.2, w: CW, h: 2.2, fontFace: t.display,
    fontSize: 44, color: t.text, bold: true, valign: 'top', lineSpacingMultiple: 1.02,
  });
  if (d.subtitle) {
    s.addText(clean(d.subtitle), {
      x: M, y: 4.5, w: CW * 0.85, h: 0.8, fontFace: t.body,
      fontSize: 18, color: t.muted, valign: 'top',
    });
  }
  const meta = Array.isArray(d.meta) ? d.meta : [];
  meta.slice(0, 4).forEach((m: any, i: number) => {
    const x = M + i * 2.4;
    s.addText(clean(m.value), { x, y: 6.0, w: 2.3, h: 0.4, fontFace: t.display, fontSize: 20, color: t.text, bold: true });
    s.addText(clean(m.label).toUpperCase(), { x, y: 6.45, w: 2.3, h: 0.3, fontFace: t.body, fontSize: 10, color: t.muted, charSpacing: 1 });
  });
}

function rStats(s: Slide, t: PptxTheme, d: any): void {
  s.addText(clean(d.title), { x: M, y: 0.6, w: CW, h: 0.7, fontFace: t.display, fontSize: 30, color: t.text, bold: true });
  if (d.subtitle) s.addText(clean(d.subtitle), { x: M, y: 1.35, w: CW, h: 0.6, fontFace: t.body, fontSize: 16, color: t.muted });
  const stats = (Array.isArray(d.stats) ? d.stats : []).slice(0, 4);
  const n = stats.length || 1;
  const gap = 0.3;
  const cw = (CW - gap * (n - 1)) / n;
  const y = 2.6;
  stats.forEach((st: any, i: number) => {
    const x = M + i * (cw + gap);
    s.addText(clean(st.value), { x, y, w: cw, h: 1.1, fontFace: t.display, fontSize: 46, color: t.numColor, bold: true });
    s.addText(clean(st.label), { x, y: y + 1.15, w: cw, h: 0.45, fontFace: t.body, fontSize: 15, color: t.text, bold: true });
    if (st.description) s.addText(clean(st.description), { x, y: y + 1.6, w: cw, h: 1.0, fontFace: t.body, fontSize: 12, color: t.muted, valign: 'top' });
  });
  if (d.insight) s.addText(clean(d.insight), { x: M, y: 6.2, w: CW, h: 0.7, fontFace: t.body, fontSize: 15, color: t.text, italic: true, valign: 'top' });
}

function rProblem(s: Slide, t: PptxTheme, d: any): void {
  kicker(s, t, d.kicker ?? 'Muammo');
  const hasStat = !!d.stat;
  const statW = 2.6, statGap = 0.4;
  const textW = hasStat ? CW - statW - statGap : CW;
  s.addText(clean(d.statement), { x: M - 0.02, y: 1.3, w: textW, h: 1.6, fontFace: t.display, fontSize: 34, color: t.text, bold: true, valign: 'top', lineSpacingMultiple: 1.05 });
  if (d.impact) {
    s.addText(clean(d.impact), { x: M, y: 3.05, w: textW, h: 0.6, fontFace: t.body, fontSize: 15, color: t.muted, valign: 'top', lineSpacingMultiple: 1.2 });
  }
  if (hasStat) {
    const sx = M + textW + statGap, sy = 1.3, sh = 2.4;
    card(s, t, sx, sy, statW, sh, t.surface);
    s.addText(clean(d.stat.value), { x: sx + 0.25, y: sy + 0.25, w: statW - 0.5, h: 1.0, fontFace: t.display, fontSize: 38, color: t.numColor, bold: true, valign: 'top' });
    s.addText(clean(d.stat.label), { x: sx + 0.25, y: sy + 1.25, w: statW - 0.5, h: 0.8, fontFace: t.body, fontSize: 13, color: t.muted, valign: 'top', lineSpacingMultiple: 1.2 });
    if (d.statSource) s.addText(clean(d.statSource), { x: sx + 0.25, y: sy + sh - 0.45, w: statW - 0.5, h: 0.35, fontFace: t.body, fontSize: 9, color: t.muted, valign: 'top' });
  }
  const ctx = (Array.isArray(d.context) ? d.context : []).slice(0, 3);
  const n = ctx.length || 1;
  const gap = 0.4;
  const cw = (CW - gap * (n - 1)) / n;
  ctx.forEach((c: any, i: number) => {
    const x = M + i * (cw + gap);
    s.addText(clean(c.value), { x, y: 4.7, w: cw, h: 0.8, fontFace: t.display, fontSize: 34, color: t.numColor, bold: true });
    s.addText(clean(c.description), { x, y: 5.5, w: cw, h: 1.3, fontFace: t.body, fontSize: 14, color: t.muted, valign: 'top' });
  });
}

function rInsight(s: Slide, t: PptxTheme, d: any): void {
  kicker(s, t, d.kicker ?? 'Asosiy g\u2018oya');
  s.addText(clean(d.statement), { x: M - 0.02, y: 1.6, w: CW, h: 2.4, fontFace: t.display, fontSize: 36, color: t.text, bold: true, valign: 'top', lineSpacingMultiple: 1.05 });
  if (d.body) s.addText(clean(d.body), { x: M, y: 4.4, w: CW * 0.9, h: 2.2, fontFace: t.body, fontSize: 18, color: t.muted, valign: 'top', lineSpacingMultiple: 1.15 });
}

function sideCard(s: Slide, t: PptxTheme, x: number, w: number, col: any, accentFill: boolean): void {
  const y = 1.9, h = 4.6;
  card(s, t, x, y, w, h, accentFill ? t.accent : t.surface);
  const fg = accentFill ? t.onAccent : t.text;
  const mut = accentFill ? t.onAccent : t.muted;
  s.addText(clean(col.label).toUpperCase(), { x: x + 0.3, y: y + 0.3, w: w - 0.6, h: 0.3, fontFace: t.body, fontSize: 11, color: accentFill ? t.onAccent : t.numColor, bold: true, charSpacing: 2 });
  if (col.title) s.addText(clean(col.title), { x: x + 0.3, y: y + 0.65, w: w - 0.6, h: 0.5, fontFace: t.display, fontSize: 18, color: fg, bold: true });
  const items = (Array.isArray(col.items) ? col.items : []).slice(0, 5);
  s.addText(bullets(items, t, mut), { x: x + 0.3, y: y + 1.35, w: w - 0.6, h: h - 1.6, fontFace: t.body, valign: 'top', lineSpacingMultiple: 1.1 });
}

function rComparison(s: Slide, t: PptxTheme, d: any): void {
  s.addText(clean(d.title), { x: M, y: 0.6, w: CW, h: 0.7, fontFace: t.display, fontSize: 28, color: t.text, bold: true });
  if (d.subtitle) s.addText(clean(d.subtitle), { x: M, y: 1.3, w: CW, h: 0.5, fontFace: t.body, fontSize: 15, color: t.muted });
  const gap = 0.5;
  const w = (CW - gap) / 2;
  sideCard(s, t, M, w, d.before ?? {}, false);
  sideCard(s, t, M + w + gap, w, d.after ?? {}, true);
}

function rProcess(s: Slide, t: PptxTheme, d: any): void {
  s.addText(clean(d.title), { x: M, y: 0.6, w: CW, h: 0.7, fontFace: t.display, fontSize: 28, color: t.text, bold: true });
  if (d.subtitle) s.addText(clean(d.subtitle), { x: M, y: 1.3, w: CW, h: 0.5, fontFace: t.body, fontSize: 15, color: t.muted });
  const steps = (Array.isArray(d.steps) ? d.steps : []).slice(0, 5);
  const top = 2.1, rowH = (H - top - 0.5) / Math.max(steps.length, 1);
  steps.forEach((st: any, i: number) => {
    const y = top + i * rowH;
    s.addText(clean(st.label ?? `0${i + 1}`), { x: M, y, w: 1.1, h: rowH, fontFace: t.display, fontSize: 26, color: t.numColor, bold: true, valign: 'middle' });
    s.addText(clean(st.title), { x: M + 1.2, y: y + 0.1, w: CW - 1.2, h: 0.45, fontFace: t.display, fontSize: 18, color: t.text, bold: true });
    s.addText(clean(st.body), { x: M + 1.2, y: y + 0.55, w: CW - 1.2, h: rowH - 0.6, fontFace: t.body, fontSize: 14, color: t.muted, valign: 'top' });
  });
}

function rTimeline(s: Slide, t: PptxTheme, d: any): void {
  s.addText(clean(d.title), { x: M, y: 0.6, w: CW, h: 0.7, fontFace: t.display, fontSize: 28, color: t.text, bold: true });
  if (d.subtitle) s.addText(clean(d.subtitle), { x: M, y: 1.3, w: CW, h: 0.5, fontFace: t.body, fontSize: 15, color: t.muted });
  const steps = (Array.isArray(d.steps) ? d.steps : []).slice(0, 5);
  const top = 2.1, rowH = (H - top - 0.5) / Math.max(steps.length, 1);
  steps.forEach((st: any, i: number) => {
    const y = top + i * rowH;
    s.addText(clean(st.date), { x: M, y, w: 1.8, h: rowH, fontFace: t.display, fontSize: 20, color: t.numColor, bold: true, valign: 'middle' });
    s.addShape('rect' as any, { x: M + 2.0, y: y + 0.15, w: 0.04, h: rowH - 0.3, fill: { color: t.border } });
    s.addText(clean(st.title), { x: M + 2.25, y: y + 0.1, w: CW - 2.25, h: 0.45, fontFace: t.display, fontSize: 18, color: t.text, bold: true });
    s.addText(clean(st.body), { x: M + 2.25, y: y + 0.55, w: CW - 2.25, h: rowH - 0.6, fontFace: t.body, fontSize: 14, color: t.muted, valign: 'top' });
  });
}

function rSolution(s: Slide, t: PptxTheme, d: any): void {
  kicker(s, t, d.kicker ?? 'Yechim');
  s.addText(clean(d.title), { x: M - 0.02, y: 1.2, w: CW, h: 1.0, fontFace: t.display, fontSize: 30, color: t.text, bold: true });
  if (d.body) s.addText(clean(d.body), { x: M, y: 2.2, w: CW * 0.9, h: 0.8, fontFace: t.body, fontSize: 16, color: t.muted });
  const feats = (Array.isArray(d.features) ? d.features : []).slice(0, 3);
  const n = feats.length || 1;
  const gap = 0.4;
  const cw = (CW - gap * (n - 1)) / n;
  const y = 3.4, h = 3.2;
  feats.forEach((f: any, i: number) => {
    const x = M + i * (cw + gap);
    card(s, t, x, y, cw, h);
    s.addText(clean(f.title), { x: x + 0.3, y: y + 0.3, w: cw - 0.6, h: 0.6, fontFace: t.display, fontSize: 18, color: t.numColor, bold: true });
    s.addText(clean(f.body), { x: x + 0.3, y: y + 1.0, w: cw - 0.6, h: h - 1.2, fontFace: t.body, fontSize: 14, color: t.muted, valign: 'top' });
  });
}

function rOpportunity(s: Slide, t: PptxTheme, d: any): void {
  s.addText(clean(d.title), { x: M, y: 0.6, w: CW, h: 0.7, fontFace: t.display, fontSize: 28, color: t.text, bold: true });
  if (d.subtitle) s.addText(clean(d.subtitle), { x: M, y: 1.3, w: CW, h: 0.5, fontFace: t.body, fontSize: 15, color: t.muted });
  const big = d.big ?? {};
  s.addText(clean(big.value), { x: M - 0.04, y: 2.0, w: CW, h: 1.7, fontFace: t.display, fontSize: 88, color: t.numColor, bold: true });
  s.addText(clean(big.label), { x: M, y: 3.8, w: CW * 0.8, h: 0.6, fontFace: t.body, fontSize: 18, color: t.text });
  const sup = (Array.isArray(d.supports) ? d.supports : []).slice(0, 4);
  const n = sup.length || 1;
  const gap = 0.4;
  const cw = (CW - gap * (n - 1)) / n;
  sup.forEach((m: any, i: number) => {
    const x = M + i * (cw + gap);
    s.addText(clean(m.value), { x, y: 5.0, w: cw, h: 0.7, fontFace: t.display, fontSize: 30, color: t.text, bold: true });
    s.addText(clean(m.label), { x, y: 5.7, w: cw, h: 0.9, fontFace: t.body, fontSize: 13, color: t.muted, valign: 'top' });
  });
}

function rCaseStudy(s: Slide, t: PptxTheme, d: any): void {
  kicker(s, t, d.kicker ?? 'Misol');
  s.addText(clean(d.title), { x: M - 0.02, y: 1.2, w: CW, h: 1.2, fontFace: t.display, fontSize: 30, color: t.text, bold: true, valign: 'top' });
  if (d.body) s.addText(clean(d.body), { x: M, y: 2.5, w: CW * 0.62, h: 2.6, fontFace: t.body, fontSize: 16, color: t.muted, valign: 'top', lineSpacingMultiple: 1.15 });
  if (d.customer) s.addText(clean(d.customer), { x: M, y: 5.4, w: CW * 0.6, h: 0.4, fontFace: t.body, fontSize: 13, color: t.numColor, bold: true });
  const metrics = (Array.isArray(d.metrics) ? d.metrics : []).slice(0, 4);
  const x0 = M + CW * 0.66, mw = CW * 0.34;
  card(s, t, x0, 2.5, mw, 3.3);
  metrics.forEach((m: any, i: number) => {
    const y = 2.8 + i * (3.0 / Math.max(metrics.length, 1));
    s.addText(clean(m.value), { x: x0 + 0.3, y, w: mw - 0.6, h: 0.55, fontFace: t.display, fontSize: 26, color: t.numColor, bold: true });
    s.addText(clean(m.label), { x: x0 + 0.3, y: y + 0.5, w: mw - 0.6, h: 0.4, fontFace: t.body, fontSize: 12, color: t.muted });
  });
}

function rQuote(s: Slide, t: PptxTheme, d: any): void {
  s.addText('\u201C', { x: M - 0.1, y: 0.6, w: 2, h: 1.6, fontFace: t.display, fontSize: 120, color: t.accent, bold: true });
  s.addText(clean(d.quote), { x: M, y: 2.2, w: CW, h: 2.8, fontFace: t.display, fontSize: 32, color: t.text, italic: true, valign: 'top', lineSpacingMultiple: 1.1 });
  const a = d.author ?? {};
  s.addShape('ellipse' as any, { x: M, y: 5.6, w: 0.8, h: 0.8, fill: { color: t.accent } });
  s.addText(clean(a.initials), { x: M, y: 5.6, w: 0.8, h: 0.8, align: 'center', valign: 'middle', fontFace: t.display, fontSize: 18, color: t.onAccent, bold: true });
  s.addText(clean(a.name), { x: M + 1.0, y: 5.7, w: CW - 1, h: 0.4, fontFace: t.body, fontSize: 16, color: t.text, bold: true });
  s.addText(clean(a.role), { x: M + 1.0, y: 6.1, w: CW - 1, h: 0.4, fontFace: t.body, fontSize: 13, color: t.muted });
}

function rRoadmap(s: Slide, t: PptxTheme, d: any): void {
  s.addText(clean(d.title), { x: M, y: 0.6, w: CW, h: 0.7, fontFace: t.display, fontSize: 28, color: t.text, bold: true });
  if (d.subtitle) s.addText(clean(d.subtitle), { x: M, y: 1.3, w: CW, h: 0.5, fontFace: t.body, fontSize: 15, color: t.muted });
  const phases = (Array.isArray(d.phases) ? d.phases : []).slice(0, 4);
  const n = phases.length || 1;
  const gap = 0.4;
  const cw = (CW - gap * (n - 1)) / n;
  const y = 2.1, h = 4.6;
  phases.forEach((p: any, i: number) => {
    const x = M + i * (cw + gap);
    card(s, t, x, y, cw, h);
    s.addText(clean(p.date), { x: x + 0.25, y: y + 0.25, w: cw - 0.5, h: 0.4, fontFace: t.display, fontSize: 16, color: t.numColor, bold: true });
    s.addText(clean(p.title), { x: x + 0.25, y: y + 0.7, w: cw - 0.5, h: 0.5, fontFace: t.display, fontSize: 18, color: t.text, bold: true });
    s.addText(clean(p.body), { x: x + 0.25, y: y + 1.25, w: cw - 0.5, h: 1.0, fontFace: t.body, fontSize: 13, color: t.muted, valign: 'top' });
    const items = (Array.isArray(p.items) ? p.items : []).slice(0, 4);
    if (items.length) s.addText(bullets(items, t, t.text), { x: x + 0.25, y: y + 2.4, w: cw - 0.5, h: h - 2.6, fontSize: 12, fontFace: t.body, valign: 'top' });
  });
}

function rCta(s: Slide, t: PptxTheme, d: any): void {
  kicker(s, t, d.kicker ?? 'Keyingi qadam');
  s.addText(clean(d.title), { x: M - 0.02, y: 1.6, w: CW, h: 1.8, fontFace: t.display, fontSize: 40, color: t.text, bold: true, valign: 'top', lineSpacingMultiple: 1.03 });
  if (d.body) s.addText(clean(d.body), { x: M, y: 3.7, w: CW * 0.8, h: 0.8, fontFace: t.body, fontSize: 18, color: t.muted });
  const actions = (Array.isArray(d.actions) ? d.actions : []).slice(0, 3);
  let x = M;
  const y = 4.9, h = 0.7;
  actions.forEach((a: any) => {
    const label = clean(a.label);
    const w = Math.min(0.55 + label.length * 0.13, 4.2);
    const primary = !!a.primary;
    s.addShape('roundRect' as any, {
      x, y, w, h, rectRadius: t.radius,
      fill: primary ? { color: t.accent } : { color: t.bg },
      line: { color: primary ? t.accent : t.border, width: 1.25 },
    });
    s.addText(label, { x, y, w, h, align: 'center', valign: 'middle', fontFace: t.body, fontSize: 15, bold: true, color: primary ? t.onAccent : t.text });
    x += w + 0.3;
  });
  if (d.footnote) s.addText(clean(d.footnote), { x: M, y: 6.1, w: CW, h: 0.5, fontFace: t.body, fontSize: 13, color: t.muted });
}

const RENDERERS: Record<string, (s: Slide, t: PptxTheme, d: any) => void> = {
  TITLE: rTitle, STATS: rStats, PROBLEM: rProblem, INSIGHT: rInsight,
  COMPARISON: rComparison, PROCESS: rProcess, TIMELINE: rTimeline,
  SOLUTION: rSolution, OPPORTUNITY: rOpportunity, CASE_STUDY: rCaseStudy,
  QUOTE: rQuote, ROADMAP: rRoadmap, CTA: rCta,
};

export async function buildPptx(themeId: string, slides: PptxSlide[]): Promise<Buffer> {
  const t = getPptxTheme(themeId);
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'L16x9', width: W, height: H });
  pptx.layout = 'L16x9';
  pptx.author = 'Lumio';
  pptx.company = 'Lumio';

  slides.forEach((sl, i) => {
    const s = pptx.addSlide();
    s.background = { color: t.bg };
    const fn = RENDERERS[sl.type] ?? rInsight;
    try {
      fn(s, t, sl.content ?? {});
    } catch {
      s.addText(clean((sl.content as any)?.title ?? '\u2026'), { x: M, y: 3, w: CW, h: 1, fontFace: t.display, fontSize: 28, color: t.text, bold: true });
    }
    if (sl.type !== 'TITLE') pageNo(s, t, i + 1);
  });

  const out = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
  return out;
}
