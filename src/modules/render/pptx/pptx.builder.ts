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

export const clean = (s: unknown): string =>
  String(s ?? '').replace(/<[^>]+>/g, '').trim();

export type Slide = PptxGenJS.Slide;

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

// Emphasis is stored as inline <strong>…</strong> in the content (for the HTML/PDF
// renderer). Parse it into pptxgenjs text runs so BOLD survives in PowerPoint too
// (previously clean() stripped the tag and the emphasis was silently lost).
export type Seg = { text: string; bold: boolean };
export function parseStrong(s: unknown): Seg[] {
  const str = String(s ?? '');
  const out: Seg[] = [];
  const re = /<strong>([\s\S]*?)<\/strong>/gi;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(str))) {
    if (m.index > last) out.push({ text: str.slice(last, m.index), bold: false });
    out.push({ text: m[1], bold: true });
    last = m.index + m[0].length;
  }
  if (last < str.length) out.push({ text: str.slice(last), bold: false });
  return out.map((seg) => ({ text: clean(seg.text), bold: seg.bold })).filter((seg) => seg.text.length);
}

/** For a single-paragraph field: returns a plain string when there is no emphasis
 * (call sites unchanged), or an array of runs preserving bold. */
function rich(s: unknown): any {
  const str = String(s ?? '');
  if (!/<strong>/i.test(str)) return clean(str);
  return parseStrong(str).map((seg) => ({ text: seg.text, options: seg.bold ? { bold: true } : {} }));
}

/** Bulleted list preserving inline bold within each item. */
function bullets(items: string[], t: PptxTheme, color?: string) {
  return items.flatMap((it) => {
    const segs = parseStrong(it);
    if (!segs.length) return [];
    return segs.map((seg, j) => ({
      text: seg.text,
      options: {
        ...(j === 0 ? { bullet: { code: '2022' } } : {}),
        ...(j === segs.length - 1 ? { breakLine: true } : {}),
        ...(seg.bold ? { bold: true } : {}),
        color: color ?? t.text,
        fontSize: 14,
      },
    }));
  });
}

function card(s: Slide, t: PptxTheme, x: number, y: number, w: number, h: number, fill?: string): void {
  s.addShape('roundRect' as any, {
    x, y, w, h, rectRadius: t.radius,
    fill: { color: fill ?? t.surface },
    line: { color: t.border, width: 1 },
  });
}

/* ---------------- renderers ---------------- */

// MAVZU auto font-size by word count (matches the HTML topicFont).
function tFont(text: any, big: number, mid: number, small: number): number {
  const w = String(text ?? '').trim().split(/\s+/).filter(Boolean).length;
  return w <= 8 ? big : w <= 14 ? mid : small;
}
// Structured title meta rows, falling back to legacy meta[].
function titleMetaRows(d: any): [string, string][] {
  const rows: [string, string][] = [];
  if (d.student) rows.push(['Bajardi', d.group ? `${clean(d.student)} · ${clean(d.group)}` : clean(d.student)]);
  if (d.direction) rows.push(["Yo'nalish", clean(d.direction)]);
  return rows;
}

/** Structured stat value → display string (Fix 5): "~" + figure + unit. */
function statNumStr(st: any): string {
  return `${st?.approx ? '~' : ''}${clean(st?.value)}${st?.unit ? ' ' + clean(st.unit) : ''}`;
}
function titleBadge(s: Slide, t: PptxTheme, x: number, y: number, text: string): void {
  const bw = Math.min(4.2, text.length * 0.11 + 0.55);
  s.addShape('roundRect' as any, { x, y, w: bw, h: 0.5, rectRadius: 0.08, fill: { color: t.accent } });
  s.addText(text.toUpperCase(), { x, y, w: bw, h: 0.5, align: 'center', valign: 'middle', fontFace: t.body, fontSize: 11, color: t.onAccent, bold: true, charSpacing: 1 });
}

function rTitleEditorialSplit(s: Slide, t: PptxTheme, d: any): void {
  const pw = W * 0.4;
  s.addShape('rect' as any, { x: 0, y: 0, w: pw, h: H, fill: { color: t.text } });
  const lx = 0.5, lw = pw - 0.9;
  let y = 0.5;
  if (d.ministry) { s.addText(clean(d.ministry).toUpperCase(), { x: lx, y, w: lw, h: 0.7, fontFace: t.body, fontSize: 8, color: t.bg, charSpacing: 1, valign: 'top', lineSpacingMultiple: 1.15 }); y += 0.8; }
  if (d.university) { s.addText(clean(d.university).toUpperCase(), { x: lx, y, w: lw, h: 0.7, fontFace: t.display, fontSize: 14, color: t.bg, bold: true, valign: 'top', lineSpacingMultiple: 1.05 }); y += 0.8; }
  if (d.faculty) { s.addText(clean(d.faculty), { x: lx, y, w: lw, h: 0.4, fontFace: t.body, fontSize: 11, color: t.bg, valign: 'top' }); y += 0.4; }
  if (d.department) s.addText(clean(d.department), { x: lx, y, w: lw, h: 0.4, fontFace: t.body, fontSize: 11, color: t.bg, valign: 'top' });
  let by = 4.55;
  titleMetaRows(d).forEach(([label, value]) => {
    s.addText(label.toUpperCase(), { x: lx, y: by, w: lw, h: 0.24, fontFace: t.body, fontSize: 8, color: t.bg, charSpacing: 1 });
    s.addText(value, { x: lx, y: by + 0.23, w: lw, h: 0.45, fontFace: t.body, fontSize: 11, color: t.bg, bold: true, valign: 'top', lineSpacingMultiple: 1.05 });
    by += 0.78;
  });
  const rx = pw + 0.55, rw = W - pw - 1.0;
  if (d.workType) titleBadge(s, t, rx, 0.7, clean(d.workType));
  s.addText(clean(d.title), { x: rx, y: 2.1, w: rw, h: 3.2, fontFace: t.display, fontSize: tFont(d.title, 32, 26, 21), color: t.text, bold: true, valign: 'middle', lineSpacingMultiple: 1.05 });
}

function rTitleClassicalCentered(s: Slide, t: PptxTheme, d: any): void {
  if (d.ministry) s.addText(clean(d.ministry).toUpperCase(), { x: M, y: 0.55, w: CW, h: 0.4, align: 'center', fontFace: t.body, fontSize: 10, color: t.muted, charSpacing: 1 });
  if (d.university) s.addText(clean(d.university).toUpperCase(), { x: M, y: 1.0, w: CW, h: 0.5, align: 'center', fontFace: t.display, fontSize: 17, color: t.text, bold: true });
  if (d.faculty) s.addText(clean(d.faculty) + (d.department ? ` · ${clean(d.department)}` : ''), { x: M, y: 1.55, w: CW, h: 0.35, align: 'center', fontFace: t.body, fontSize: 12, color: t.muted });
  if (d.workType) s.addText(clean(d.workType).toUpperCase(), { x: M, y: 2.7, w: CW, h: 0.4, align: 'center', fontFace: t.body, fontSize: 13, color: t.numColor, bold: true, charSpacing: 3 });
  s.addText(clean(d.title), { x: M, y: 3.2, w: CW, h: 1.9, align: 'center', valign: 'middle', fontFace: t.display, fontSize: tFont(d.title, 30, 25, 21), color: t.text, bold: true, lineSpacingMultiple: 1.05 });
  const rows = titleMetaRows(d).slice(0, 2);
  rows.forEach(([label, value], i) => {
    const cw = CW / 2, x = M + i * cw;
    s.addText(label.replace(/:$/, '') + ':', { x, y: 5.7, w: cw - 0.3, h: 0.3, align: 'center', fontFace: t.body, fontSize: 10, color: t.muted, charSpacing: 1 });
    s.addText(value, { x, y: 6.0, w: cw - 0.3, h: 0.5, align: 'center', fontFace: t.body, fontSize: 13, color: t.text, bold: true, valign: 'top' });
  });
}

function rTitleBentoAcademic(s: Slide, t: PptxTheme, d: any): void {
  if (d.workType) titleBadge(s, t, M, 0.6, clean(d.workType));
  s.addText(clean(d.title), { x: M, y: 1.35, w: CW, h: 2.4, fontFace: t.display, fontSize: tFont(d.title, 32, 27, 22), color: t.text, bold: true, valign: 'middle', lineSpacingMultiple: 1.05 });
  const cells: [string, string][] = [];
  if (d.university) cells.push(['OTM', clean(d.university)]);
  if (d.faculty) cells.push(['FAKULTET', clean(d.faculty)]);
  if (d.department) cells.push(['KAFEDRA', clean(d.department)]);
  if (d.student) cells.push(['BAJARDI', d.group ? `${clean(d.student)} · ${clean(d.group)}` : clean(d.student)]);
  if (!cells.length) cells.push(['MAVZU', clean(d.title)]);
  const cols = 3, gap = 0.25, cw = (CW - gap * (cols - 1)) / cols, ch = 1.35;
  const top = H - 0.5 - (Math.ceil(cells.length / cols)) * (ch + gap) + gap;
  cells.forEach(([label, value], i) => {
    const r = Math.floor(i / cols), c = i % cols;
    const x = M + c * (cw + gap), y = top + r * (ch + gap);
    const accent = i === cells.length - 1;
    card(s, t, x, y, cw, ch, accent ? t.accent : t.surface);
    s.addText(label, { x: x + 0.22, y: y + 0.2, w: cw - 0.44, h: 0.3, fontFace: t.body, fontSize: 9, color: accent ? t.onAccent : t.muted, bold: true, charSpacing: 1 });
    s.addText(value, { x: x + 0.22, y: y + 0.55, w: cw - 0.44, h: ch - 0.7, fontFace: t.body, fontSize: 13, color: accent ? t.onAccent : t.text, bold: true, valign: 'top', lineSpacingMultiple: 1.05 });
  });
}

function rTitleTypographicStatement(s: Slide, t: PptxTheme, d: any): void {
  if (d.university) s.addText(clean(d.university).toUpperCase(), { x: M, y: 0.55, w: CW, h: 0.35, fontFace: t.body, fontSize: 10, color: t.muted, charSpacing: 1 });
  s.addShape('rect' as any, { x: M, y: 2.4, w: 0.09, h: 2.6, fill: { color: t.accent } });
  s.addText(clean(d.title), { x: M + 0.4, y: 2.2, w: CW - 0.4, h: 3.0, fontFace: t.display, fontSize: tFont(d.title, 50, 40, 32), color: t.text, bold: true, valign: 'middle', lineSpacingMultiple: 1.02 });
  if (d.student) s.addText(clean(d.student), { x: M, y: 6.5, w: CW * 0.6, h: 0.4, fontFace: t.body, fontSize: 13, color: t.text, bold: true, valign: 'top' });
}

function rTitleVerticalRibbon(s: Slide, t: PptxTheme, d: any): void {
  const rw = 0.8;
  s.addShape('rect' as any, { x: 0, y: 0, w: rw, h: H, fill: { color: t.text } });
  if (d.university) s.addText(clean(d.university).toUpperCase(), { x: -3.0, y: 3.35, w: 7.0, h: 0.5, align: 'center', valign: 'middle', rotate: 270, fontFace: t.body, fontSize: 11, color: t.bg, bold: true, charSpacing: 2 });
  const mx = rw + 0.6, mw = W - rw - 1.1;
  if (d.workType) titleBadge(s, t, mx, 0.7, clean(d.workType));
  if (d.faculty) s.addText(clean(d.faculty) + (d.department ? ` · ${clean(d.department)}` : ''), { x: mx, y: 1.35, w: mw, h: 0.35, fontFace: t.body, fontSize: 12, color: t.muted });
  s.addText(clean(d.title), { x: mx, y: 2.1, w: mw, h: 2.9, fontFace: t.display, fontSize: tFont(d.title, 32, 26, 21), color: t.text, bold: true, valign: 'middle', lineSpacingMultiple: 1.05 });
  const rows = titleMetaRows(d).slice(0, 2);
  rows.forEach(([label, value], i) => {
    const cw = mw / 2, x = mx + i * cw;
    s.addText(label.replace(/:$/, '') + ':', { x, y: 6.0, w: cw - 0.3, h: 0.3, fontFace: t.body, fontSize: 10, color: t.muted, charSpacing: 1 });
    s.addText(value, { x, y: 6.3, w: cw - 0.3, h: 0.5, fontFace: t.body, fontSize: 12, color: t.text, bold: true, valign: 'top' });
  });
}

function rTitle(s: Slide, t: PptxTheme, d: any): void {
  switch (d.layout) {
    case 'classical_centered': return rTitleClassicalCentered(s, t, d);
    case 'bento_academic': return rTitleBentoAcademic(s, t, d);
    case 'typographic_statement': return rTitleTypographicStatement(s, t, d);
    case 'vertical_ribbon': return rTitleVerticalRibbon(s, t, d);
    case 'editorial_split':
    default: return rTitleEditorialSplit(s, t, d);
  }
}

function rStats(s: Slide, t: PptxTheme, d: any): void {
  if (d.kicker) kicker(s, t, d.kicker);
  s.addText(clean(d.title), { x: M, y: d.kicker ? 1.0 : 0.6, w: CW, h: 0.7, fontFace: t.display, fontSize: 30, color: t.text, bold: true });
  if (d.subtitle) s.addText(clean(d.subtitle), { x: M, y: d.kicker ? 1.7 : 1.35, w: CW, h: 0.6, fontFace: t.body, fontSize: 16, color: t.muted });
  const stats = (Array.isArray(d.stats) ? d.stats : []).slice(0, 4);
  const n = stats.length || 1;
  const gap = 0.3;
  const cw = (CW - gap * (n - 1)) / n;
  const y = 2.7;
  stats.forEach((st: any, i: number) => {
    const x = M + i * (cw + gap);
    s.addText(statNumStr(st), { x, y, w: cw, h: 1.1, fontFace: t.display, fontSize: 40, color: t.numColor, bold: true });
    s.addText(clean(st.label), { x, y: y + 1.15, w: cw, h: 0.45, fontFace: t.body, fontSize: 15, color: t.text, bold: true });
    if (st.description) s.addText(rich(st.description), { x, y: y + 1.6, w: cw, h: 1.0, fontFace: t.body, fontSize: 12, color: t.muted, valign: 'top' });
  });
  if (d.insight) s.addText(rich(d.insight), { x: M, y: 6.2, w: CW, h: 0.55, fontFace: t.body, fontSize: 15, color: t.text, italic: true, valign: 'top' });
  if (d.source) s.addText(clean(d.source), { x: M, y: 6.85, w: CW, h: 0.3, fontFace: t.body, fontSize: 9, color: t.muted, valign: 'top' });
}

/** FALLBACK renderer (unknown types / error recovery) — exported additively
 *  for reuse by pptx.editable.ts's per-slide try/catch. */
export function rInsight(s: Slide, t: PptxTheme, d: any): void {
  if (d.kicker) kicker(s, t, d.kicker);
  s.addText(clean(d.statement ?? d.title ?? ''), { x: M - 0.02, y: 1.8, w: CW, h: 2.0, fontFace: t.display, fontSize: 34, color: t.text, bold: true, valign: 'top', lineSpacingMultiple: 1.05 });
  if (d.body) s.addText(rich(d.body), { x: M, y: 3.9, w: CW * 0.9, h: 2.0, fontFace: t.body, fontSize: 18, color: t.muted, valign: 'top', lineSpacingMultiple: 1.15 });
}

function sideCard(s: Slide, t: PptxTheme, x: number, y: number, w: number, h: number, col: any, accentFill: boolean, isWinner: boolean): void {
  card(s, t, x, y, w, h, accentFill ? t.accent : t.surface);
  const fg = accentFill ? t.onAccent : t.text;
  const mut = accentFill ? t.onAccent : t.muted;
  const label = clean(col.label).toUpperCase() + (isWinner ? ' ★' : '');
  s.addText(label, { x: x + 0.3, y: y + 0.3, w: w - 0.6, h: 0.3, fontFace: t.body, fontSize: 11, color: accentFill ? t.onAccent : t.numColor, bold: true, charSpacing: 2 });
  if (col.title) s.addText(clean(col.title), { x: x + 0.3, y: y + 0.65, w: w - 0.6, h: 0.5, fontFace: t.display, fontSize: 18, color: fg, bold: true });
  const items = (Array.isArray(col.items) ? col.items : []).slice(0, 5);
  s.addText(bullets(items, t, mut), { x: x + 0.3, y: y + 1.35, w: w - 0.6, h: h - 1.6, fontFace: t.body, valign: 'top', lineSpacingMultiple: 1.1 });
}

function topKicker(s: Slide, t: PptxTheme, text?: string): void {
  if (!text) return;
  s.addText(clean(text).toUpperCase(), { x: M, y: 0.22, w: CW, h: 0.3, fontFace: t.body, fontSize: 10, color: t.numColor, bold: true, charSpacing: 2 });
}

function rComparison(s: Slide, t: PptxTheme, d: any): void {
  topKicker(s, t, d.kicker);
  s.addText(clean(d.title), { x: M, y: 0.6, w: CW, h: 0.8, fontFace: t.display, fontSize: 26, color: t.text, bold: true });
  if (d.subtitle) s.addText(clean(d.subtitle), { x: M, y: 1.45, w: CW, h: 0.5, fontFace: t.body, fontSize: 15, color: t.muted });
  const gap = 0.5;
  const w = (CW - gap) / 2;
  const cardY = 2.1, cardH = 4.6;
  sideCard(s, t, M, cardY, w, cardH, d.left ?? {}, false, false);
  sideCard(s, t, M + w + gap, cardY, w, cardH, d.right ?? {}, true, false);
}

function rProcess(s: Slide, t: PptxTheme, d: any): void {
  topKicker(s, t, d.kicker);
  s.addText(clean(d.title), { x: M, y: 0.6, w: CW, h: 0.8, fontFace: t.display, fontSize: 26, color: t.text, bold: true });
  if (d.subtitle) s.addText(clean(d.subtitle), { x: M, y: 1.45, w: CW, h: 0.5, fontFace: t.body, fontSize: 15, color: t.muted });
  const steps = (Array.isArray(d.steps) ? d.steps : []).slice(0, 5);
  const top = 2.2, rowH = (H - top - 0.5) / Math.max(steps.length, 1);
  steps.forEach((st: any, i: number) => {
    const y = top + i * rowH;
    s.addText(clean(st.label ?? `0${i + 1}`), { x: M, y, w: 1.1, h: rowH, fontFace: t.display, fontSize: 24, color: t.numColor, bold: true, valign: 'middle' });
    s.addText(clean(st.title), { x: M + 1.2, y: y + 0.1, w: CW - 1.2, h: 0.4, fontFace: t.display, fontSize: 18, color: t.text, bold: true });
    s.addText(rich(st.body), { x: M + 1.2, y: y + 0.55, w: CW - 1.2, h: rowH - 0.65, fontFace: t.body, fontSize: 14, color: t.muted, valign: 'top' });
  });
}

function rTimeline(s: Slide, t: PptxTheme, d: any): void {
  topKicker(s, t, d.kicker);
  s.addText(clean(d.title), { x: M, y: 0.6, w: CW, h: 0.8, fontFace: t.display, fontSize: 26, color: t.text, bold: true });
  if (d.subtitle) s.addText(clean(d.subtitle), { x: M, y: 1.45, w: CW, h: 0.5, fontFace: t.body, fontSize: 15, color: t.muted });
  const steps = (Array.isArray(d.steps) ? d.steps : []).slice(0, 5);
  const top = 2.2, rowH = (H - top - 0.5) / Math.max(steps.length, 1);
  steps.forEach((st: any, i: number) => {
    const y = top + i * rowH;
    s.addText(clean(st.date), { x: M, y: y + 0.1, w: 1.9, h: 0.5, fontFace: t.display, fontSize: 20, color: t.numColor, bold: true, valign: 'top' });
    s.addShape('rect' as any, { x: M + 2.0, y: y + 0.15, w: 0.04, h: rowH - 0.3, fill: { color: t.border } });
    s.addText(clean(st.title), { x: M + 2.25, y: y + 0.1, w: CW - 2.25, h: 0.45, fontFace: t.display, fontSize: 18, color: t.text, bold: true });
    s.addText(rich(st.body), { x: M + 2.25, y: y + 0.55, w: CW - 2.25, h: rowH - 0.6, fontFace: t.body, fontSize: 14, color: t.muted, valign: 'top' });
  });
}

function rBatafsil(s: Slide, t: PptxTheme, d: any): void {
  if (d.kicker) kicker(s, t, d.kicker);
  s.addText(clean(d.title), { x: M, y: d.kicker ? 1.0 : 0.7, w: CW, h: 0.9, fontFace: t.display, fontSize: 26, color: t.text, bold: true });
  const points = (Array.isArray(d.points) ? d.points : []).slice(0, 4);
  const bodyW = points.length ? CW * 0.6 : CW * 0.92;
  s.addText(rich(d.body), { x: M, y: 2.3, w: bodyW, h: 4.4, fontFace: t.body, fontSize: 17, color: t.text, valign: 'top', lineSpacingMultiple: 1.3 });
  if (points.length) {
    s.addText(bullets(points.map((p: any) => p.text), t, t.muted), { x: M + bodyW + 0.5, y: 2.3, w: CW - bodyW - 0.5, h: 4.4, fontFace: t.body, fontSize: 15, valign: 'top', lineSpacingMultiple: 1.25 });
  }
}

function rMisol(s: Slide, t: PptxTheme, d: any): void {
  if (d.kicker) kicker(s, t, d.kicker);
  s.addText(clean(d.title), { x: M, y: d.kicker ? 1.0 : 0.7, w: CW, h: 0.9, fontFace: t.display, fontSize: 26, color: t.text, bold: true });
  s.addText(rich(d.body), { x: M, y: 2.3, w: CW * 0.85, h: 2.8, fontFace: t.body, fontSize: 17, color: t.muted, valign: 'top', lineSpacingMultiple: 1.25 });
  if (d.takeaway) s.addText('★  ' + clean(d.takeaway), { x: M, y: 5.5, w: CW * 0.85, h: 0.8, fontFace: t.body, fontSize: 15, color: t.text, valign: 'top' });
}

function rTurlar(s: Slide, t: PptxTheme, d: any): void {
  if (d.kicker) kicker(s, t, d.kicker);
  s.addText(clean(d.title), { x: M, y: d.kicker ? 1.0 : 0.7, w: CW, h: 0.9, fontFace: t.display, fontSize: 26, color: t.text, bold: true });
  const items = (Array.isArray(d.items) ? d.items : []).slice(0, 4);
  const n = items.length || 1, gap = 0.4, cw = (CW - gap * (n - 1)) / n;
  const y = 2.4, h = 3.7;
  items.forEach((it: any, i: number) => {
    const x = M + i * (cw + gap);
    card(s, t, x, y, cw, h);
    s.addText(clean(it.label), { x: x + 0.3, y: y + 0.3, w: cw - 0.6, h: 0.6, fontFace: t.display, fontSize: 18, color: t.numColor, bold: true });
    s.addText(rich(it.text), { x: x + 0.3, y: y + 1.0, w: cw - 0.6, h: h - 1.2, fontFace: t.body, fontSize: 14, color: t.muted, valign: 'top', lineSpacingMultiple: 1.15 });
  });
}

function rAgenda(s: Slide, t: PptxTheme, d: any): void {
  s.addText(clean(d.title), { x: M, y: 0.7, w: CW, h: 0.8, fontFace: t.display, fontSize: 32, color: t.text, bold: true });
  const items = (Array.isArray(d.items) ? d.items : []).slice(0, 7);
  const top = 2.0;
  const rowH = Math.min((H - top - 0.5) / Math.max(items.length, 1), 0.9);
  items.forEach((it: any, i: number) => {
    const y = top + i * rowH;
    s.addText(String(i + 1).padStart(2, '0'), { x: M, y, w: 0.7, h: 0.5, fontFace: t.display, fontSize: 22, color: t.numColor, bold: true, valign: 'top' });
    s.addText(rich(it.text), { x: M + 0.9, y, w: CW - 0.9, h: 0.42, fontFace: t.display, fontSize: 18, color: t.text, bold: true, valign: 'top' });
    if (it.detail) s.addText(clean(it.detail), { x: M + 0.9, y: y + 0.42, w: CW - 0.9, h: 0.35, fontFace: t.body, fontSize: 13, color: t.muted, valign: 'top' });
  });
}

function rContent(s: Slide, t: PptxTheme, d: any): void {
  if (d.kicker) kicker(s, t, d.kicker);
  s.addText(clean(d.title), { x: M, y: d.kicker ? 1.0 : 0.7, w: CW, h: 0.8, fontFace: t.display, fontSize: 30, color: t.text, bold: true });
  let top = d.kicker ? 1.95 : 1.65;
  if (d.lead) { s.addText(rich(d.lead), { x: M, y: top, w: CW * 0.92, h: 0.7, fontFace: t.body, fontSize: 16, color: t.muted, valign: 'top', lineSpacingMultiple: 1.1 }); top += 0.85; }
  const points = (Array.isArray(d.points) ? d.points : []).slice(0, 5);
  const rowH = (H - top - 0.5) / Math.max(points.length, 1);
  points.forEach((p: any, i: number) => {
    const y = top + i * rowH;
    s.addShape('ellipse' as any, { x: M, y: y + 0.12, w: 0.14, h: 0.14, fill: { color: t.accent } });
    const runs: any[] = [];
    if (p.heading) runs.push({ text: clean(p.heading) + '  ', options: { bold: true, color: t.text } });
    for (const seg of parseStrong(p.text)) runs.push({ text: seg.text, options: { color: t.muted, ...(seg.bold ? { bold: true } : {}) } });
    s.addText(runs, { x: M + 0.4, y, w: CW - 0.4, h: rowH - 0.1, fontFace: t.body, fontSize: 16, valign: 'top', lineSpacingMultiple: 1.1 });
  });
}

function rDefinition(s: Slide, t: PptxTheme, d: any): void {
  if (d.kicker) kicker(s, t, d.kicker);
  s.addText(clean(d.term), { x: M - 0.02, y: d.kicker ? 1.0 : 0.7, w: CW, h: 0.9, fontFace: t.display, fontSize: 38, color: t.text, bold: true });
  s.addText(rich(d.definition), { x: M, y: d.kicker ? 2.0 : 1.7, w: CW * 0.92, h: 1.3, fontFace: t.body, fontSize: 18, color: t.muted, valign: 'top', lineSpacingMultiple: 1.15 });
  const aspects = (Array.isArray(d.aspects) ? d.aspects : []).slice(0, 3);
  if (aspects.length) {
    const n = aspects.length, gap = 0.4, cw = (CW - gap * (n - 1)) / n;
    const y = 3.7, h = 2.9;
    aspects.forEach((a: any, i: number) => {
      const x = M + i * (cw + gap);
      card(s, t, x, y, cw, h);
      s.addText(clean(a.label).toUpperCase(), { x: x + 0.3, y: y + 0.3, w: cw - 0.6, h: 0.4, fontFace: t.body, fontSize: 12, color: t.numColor, bold: true, charSpacing: 1 });
      s.addText(rich(a.text), { x: x + 0.3, y: y + 0.85, w: cw - 0.6, h: h - 1.1, fontFace: t.body, fontSize: 14, color: t.muted, valign: 'top' });
    });
  }
}

function rConclusion(s: Slide, t: PptxTheme, d: any): void {
  if (d.kicker) kicker(s, t, d.kicker);
  s.addText(clean(d.title), { x: M, y: d.kicker ? 1.0 : 0.7, w: CW, h: 0.8, fontFace: t.display, fontSize: 30, color: t.text, bold: true });
  const points = (Array.isArray(d.points) ? d.points : []).slice(0, 4);
  const top = d.kicker ? 2.0 : 1.7;
  const avail = H - top - (d.closing ? 1.0 : 0.5);
  const rowH = avail / Math.max(points.length, 1);
  points.forEach((p: any, i: number) => {
    const y = top + i * rowH;
    s.addShape('ellipse' as any, { x: M, y: y + 0.05, w: 0.45, h: 0.45, fill: { color: t.accent } });
    s.addText(String(i + 1), { x: M, y: y + 0.05, w: 0.45, h: 0.45, align: 'center', valign: 'middle', fontFace: t.display, fontSize: 15, color: t.onAccent, bold: true });
    s.addText(rich(p), { x: M + 0.7, y, w: CW - 0.7, h: rowH - 0.1, fontFace: t.body, fontSize: 17, color: t.text, valign: 'top', lineSpacingMultiple: 1.1 });
  });
  if (d.closing) s.addText(clean(d.closing), { x: M, y: H - 0.9, w: CW, h: 0.5, fontFace: t.body, fontSize: 14, color: t.muted, italic: true, valign: 'top' });
}

function rReferences(s: Slide, t: PptxTheme, d: any): void {
  s.addText(clean(d.title), { x: M, y: 0.7, w: CW, h: 0.8, fontFace: t.display, fontSize: 30, color: t.text, bold: true });
  const items = (Array.isArray(d.items) ? d.items : []).slice(0, 8);
  const runs = items.map((it: any, i: number) => ({ text: `${i + 1}. ${clean(typeof it === 'string' ? it : it.text)}`, options: { breakLine: true, color: t.muted, fontSize: 13 } }));
  s.addText(runs, { x: M, y: 1.9, w: CW, h: H - 1.9 - 0.5, fontFace: t.body, valign: 'top', lineSpacingMultiple: 1.3 });
}

function rClosing(s: Slide, t: PptxTheme, d: any): void {
  s.addText(clean(d.title), { x: M, y: 2.5, w: CW, h: 1.6, align: 'center', valign: 'middle', fontFace: t.display, fontSize: 44, color: t.text, bold: true });
  if (d.subtitle) s.addText(clean(d.subtitle), { x: M + 1, y: 4.3, w: CW - 2, h: 0.9, align: 'center', fontFace: t.body, fontSize: 18, color: t.muted, valign: 'top' });
  if (d.contact) s.addText(clean(d.contact), { x: M, y: 5.5, w: CW, h: 0.5, align: 'center', fontFace: t.body, fontSize: 15, color: t.numColor, bold: true });
}

function rRelevance(s: Slide, t: PptxTheme, d: any): void {
  if (d.kicker) kicker(s, t, d.kicker);
  s.addText(clean(d.title), { x: M, y: d.kicker ? 1.0 : 0.7, w: CW, h: 0.8, fontFace: t.display, fontSize: 28, color: t.text, bold: true });
  let top = d.kicker ? 1.95 : 1.65;
  if (d.lead) { s.addText(rich(d.lead), { x: M, y: top, w: CW * 0.92, h: 0.7, fontFace: t.body, fontSize: 16, color: t.muted, valign: 'top', lineSpacingMultiple: 1.1 }); top += 0.85; }
  const hasStat = !!d.stat;
  const listW = hasStat ? CW * 0.6 : CW * 0.92;
  const points = (Array.isArray(d.points) ? d.points : []).slice(0, 3);
  s.addText(bullets(points.map((p: any) => p.text), t, t.muted), { x: M, y: top, w: listW, h: H - top - 0.6, fontFace: t.body, fontSize: 16, valign: 'top', lineSpacingMultiple: 1.25 });
  if (hasStat) {
    const cx = M + listW + 0.4, cw = CW - listW - 0.4, ch = 2.7;
    card(s, t, cx, top, cw, ch, t.surface);
    s.addText(statNumStr(d.stat), { x: cx + 0.3, y: top + 0.3, w: cw - 0.6, h: 1.0, fontFace: t.display, fontSize: 34, color: t.numColor, bold: true, valign: 'top' });
    s.addText(clean(d.stat.label), { x: cx + 0.3, y: top + 1.4, w: cw - 0.6, h: 0.9, fontFace: t.body, fontSize: 13, color: t.muted, valign: 'top' });
    if (d.source) s.addText(clean(d.source), { x: cx + 0.3, y: top + ch - 0.5, w: cw - 0.6, h: 0.4, fontFace: t.body, fontSize: 9, color: t.muted, valign: 'top' });
  } else if (d.source) {
    s.addText(clean(d.source), { x: M, y: H - 0.7, w: CW, h: 0.3, fontFace: t.body, fontSize: 9, color: t.muted, valign: 'top' });
  }
}

function rAimTasks(s: Slide, t: PptxTheme, d: any): void {
  if (d.kicker) kicker(s, t, d.kicker);
  s.addText(clean(d.title), { x: M, y: d.kicker ? 1.0 : 0.7, w: CW, h: 0.8, fontFace: t.display, fontSize: 30, color: t.text, bold: true });
  const aimY = d.kicker ? 1.95 : 1.65;
  card(s, t, M, aimY, CW, 1.0, t.surface);
  s.addText(rich(d.aim), { x: M + 0.3, y: aimY + 0.12, w: CW - 0.6, h: 0.76, fontFace: t.body, fontSize: 15, color: t.text, bold: true, valign: 'middle', lineSpacingMultiple: 1.1 });
  const tasks = (Array.isArray(d.tasks) ? d.tasks : []).slice(0, 5);
  const top = aimY + 1.35;
  const rowH = (H - top - 0.4) / Math.max(tasks.length, 1);
  tasks.forEach((tk: any, i: number) => {
    const y = top + i * rowH;
    s.addShape('ellipse' as any, { x: M, y: y + 0.03, w: 0.4, h: 0.4, fill: { color: t.accent } });
    s.addText(String(i + 1), { x: M, y: y + 0.03, w: 0.4, h: 0.4, align: 'center', valign: 'middle', fontFace: t.display, fontSize: 14, color: t.onAccent, bold: true });
    s.addText(clean(tk), { x: M + 0.65, y, w: CW - 0.65, h: rowH - 0.1, fontFace: t.body, fontSize: 16, color: t.text, valign: 'top', lineSpacingMultiple: 1.1 });
  });
}

function rObjectSubject(s: Slide, t: PptxTheme, d: any): void {
  if (d.kicker) kicker(s, t, d.kicker);
  s.addText(clean(d.title), { x: M, y: d.kicker ? 1.0 : 0.7, w: CW, h: 0.8, fontFace: t.display, fontSize: 28, color: t.text, bold: true });
  const gap = 0.5, w = (CW - gap) / 2, y = 2.2, h = 4.3;
  const cols = [
    { c: d.object ?? {}, accent: false, x: M },
    { c: d.subject ?? {}, accent: true, x: M + w + gap },
  ];
  cols.forEach(({ c, accent, x }) => {
    card(s, t, x, y, w, h, accent ? t.accent : t.surface);
    const fg = accent ? t.onAccent : t.text;
    const mut = accent ? t.onAccent : t.muted;
    s.addText(clean(c.label).toUpperCase(), { x: x + 0.35, y: y + 0.35, w: w - 0.7, h: 0.4, fontFace: t.body, fontSize: 12, color: accent ? t.onAccent : t.numColor, bold: true, charSpacing: 2 });
    s.addText(rich(c.text), { x: x + 0.35, y: y + 1.0, w: w - 0.7, h: h - 1.3, fontFace: t.body, fontSize: 16, color: mut, valign: 'top', lineSpacingMultiple: 1.25 });
  });
}

function rFinding(s: Slide, t: PptxTheme, d: any): void {
  if (d.kicker) kicker(s, t, d.kicker);
  s.addText(clean(d.title), { x: M, y: d.kicker ? 1.0 : 0.7, w: CW, h: 0.9, fontFace: t.display, fontSize: 26, color: t.text, bold: true });
  const points = (Array.isArray(d.points) ? d.points : []).slice(0, 3);
  const bodyW = points.length ? CW * 0.6 : CW * 0.92;
  s.addText(rich(d.evidence), { x: M, y: 2.3, w: bodyW, h: 3.9, fontFace: t.body, fontSize: 16, color: t.text, valign: 'top', lineSpacingMultiple: 1.3 });
  if (points.length) {
    s.addText(bullets(points.map((p: any) => p.text), t, t.muted), { x: M + bodyW + 0.5, y: 2.3, w: CW - bodyW - 0.5, h: 3.9, fontFace: t.body, fontSize: 15, valign: 'top', lineSpacingMultiple: 1.25 });
  }
  if (d.source) s.addText(clean(d.source), { x: M, y: 6.4, w: bodyW, h: 0.35, fontFace: t.body, fontSize: 9, color: t.muted, valign: 'top' });
}

function rProblemsSolutions(s: Slide, t: PptxTheme, d: any): void {
  s.addText(clean(d.title), { x: M, y: 0.6, w: CW, h: 0.8, fontFace: t.display, fontSize: 26, color: t.text, bold: true });
  if (d.subtitle) s.addText(clean(d.subtitle), { x: M, y: 1.4, w: CW, h: 0.5, fontFace: t.body, fontSize: 15, color: t.muted });
  const pairs = (Array.isArray(d.pairs) ? d.pairs : []).slice(0, 3);
  const gap = 0.5, w = (CW - gap) / 2;
  const headY = 2.15, top = 2.55;
  s.addText('MUAMMO', { x: M, y: headY, w, h: 0.3, fontFace: t.body, fontSize: 12, color: t.muted, bold: true, charSpacing: 2 });
  s.addText('YECHIM', { x: M + w + gap, y: headY, w, h: 0.3, fontFace: t.body, fontSize: 12, color: t.numColor, bold: true, charSpacing: 2 });
  const rowH = (H - top - 0.4) / Math.max(pairs.length, 1);
  pairs.forEach((p: any, i: number) => {
    const y = top + i * rowH, ch = rowH - 0.25;
    card(s, t, M, y, w, ch, t.surface);
    s.addText(rich(p.problem), { x: M + 0.3, y: y + 0.2, w: w - 0.6, h: ch - 0.4, fontFace: t.body, fontSize: 14, color: t.muted, valign: 'middle', lineSpacingMultiple: 1.15 });
    card(s, t, M + w + gap, y, w, ch, t.accent);
    s.addText(rich(p.solution), { x: M + w + gap + 0.3, y: y + 0.2, w: w - 0.6, h: ch - 0.4, fontFace: t.body, fontSize: 14, color: t.onAccent, valign: 'middle', lineSpacingMultiple: 1.15 });
  });
}

/** Exported additively so pptx.editable.ts can fall back to the original,
 *  hand-tuned renderer for slide types not yet migrated to the layout-plan +
 *  text-fit pipeline (see the "Do not attempt to perfect all slide types at
 *  once" scoping note) — reusing these avoids duplicating ~20 templates. */
export const LEGACY_PPTX_RENDERERS: Record<string, (s: Slide, t: PptxTheme, d: any) => void> = {
  TITLE: rTitle, AGENDA: rAgenda, CONTENT: rContent, DEFINITION: rDefinition,
  BATAFSIL: rBatafsil, MISOL: rMisol, TURLAR: rTurlar,
  COMPARISON: rComparison, PROCESS: rProcess, TIMELINE: rTimeline, STATS: rStats,
  CONCLUSION: rConclusion, REFERENCES: rReferences, CLOSING: rClosing,
  RELEVANCE: rRelevance, AIM_TASKS: rAimTasks, OBJECT_SUBJECT: rObjectSubject,
  FINDING: rFinding, PROBLEMS_SOLUTIONS: rProblemsSolutions,
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
    const fn = LEGACY_PPTX_RENDERERS[sl.type] ?? rInsight;
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
