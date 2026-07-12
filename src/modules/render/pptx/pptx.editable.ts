// pptx.editable.ts
// Mode 2: real, fully-editable PowerPoint elements — same concept as the
// original pptx.builder.ts, but routed through the new pipeline:
//   content -> buildPptxSlidePlan() -> validateSlidePlan() -> renderSlidePlan()
// for the slide types most prone to the "sochilib ketmoqda" overflow bug
// (the ones whose old renderer divides available height EQUALLY by item
// count — `rowH = avail / items.length` — instead of measuring each item's
// actual text length; see pptx.text-fit.ts's fitRowsToHeight doc comment).
//
// Scope (deliberate, per "do not attempt to perfect all slide types at
// once"): CONTENT, DEFINITION, BATAFSIL, CONCLUSION, AIM_TASKS,
// FINDING and RELEVANCE are migrated. Every other type
// (TITLE, AGENDA, TURLAR, COMPARISON, PROCESS, TIMELINE,
// STATS, REFERENCES, CLOSING, OBJECT_SUBJECT, PROBLEMS_SOLUTIONS) still uses
// the original, hand-tuned LEGACY_PPTX_RENDERERS from pptx.builder.ts —
// reused directly (not duplicated) via renderLegacySlide() below. This is an
// explicitly allowed, honest partial migration, not an oversight.

import PptxGenJS from 'pptxgenjs';
import { PptxTheme, getPptxTheme } from './pptx.theme';
import { PPTX_CANVAS } from './pptx.constants';
import { PPTX_GRID } from './pptx.grid';
import { PptxSlidePlan, PptxTextBox, PptxShapeBox, validateSlidePlan } from './pptx.layout';
import { renderSlidePlan } from './pptx.draw';
import { fitRowsToHeight, fitTextToBox, FitRowsOptions, FitTextToBoxOptions } from './pptx.text-fit';
import { LEGACY_PPTX_RENDERERS, rInsight, clean, parseStrong, Slide } from './pptx.builder';

const M = PPTX_GRID.marginX;
const CW = PPTX_GRID.contentW;

/** Migrated slide types — the source of truth for the dispatch in
 *  buildPptxSlidePlan() below. */
const MIGRATED_TYPES = new Set([
  'CONTENT', 'DEFINITION', 'BATAFSIL', 'CONCLUSION', 'AIM_TASKS',
  'FINDING', 'RELEVANCE',
]);

let boxIdCounter = 0;
const nextId = (role: string) => `${role}-${boxIdCounter++}`;

function kickerBox(text: string | undefined, t: PptxTheme): PptxTextBox | undefined {
  if (!text) return undefined;
  return {
    id: nextId('kicker'), kind: 'text', role: 'kicker',
    x: M, y: PPTX_GRID.kickerY, w: CW, h: PPTX_GRID.kickerH,
    text: clean(text).toUpperCase(),
    fontFace: t.body, fontSize: 12, color: t.numColor, bold: true, charSpacing: 3,
    fitPolicy: 'fixed',
  };
}

function titleBox(text: string, t: PptxTheme, hasKicker: boolean, fontSize = 28): PptxTextBox {
  return {
    id: nextId('title'), kind: 'text', role: 'title',
    x: M, y: hasKicker ? PPTX_GRID.titleY : PPTX_GRID.titleYNoKicker, w: CW, h: 0.8,
    text: clean(text),
    fontFace: t.display, fontSize, color: t.text, bold: true,
    fitPolicy: 'shrink-once', minFontSize: Math.round(fontSize * 0.75),
  };
}

/** Rich-run box (inline <strong> preserved) at an already-computed
 *  position/height — sizing happens via fitRowsToHeight before this is
 *  called, so the box itself never re-measures (fitPolicy 'fixed'). */
function richRowBox(
  id: string, x: number, y: number, w: number, h: number,
  headingRuns: { text: string; options?: Record<string, unknown> }[],
  t: PptxTheme, fontSize: number, color: string,
): PptxTextBox {
  return {
    id, kind: 'text', role: 'body',
    x, y, w, h, text: headingRuns,
    fontFace: t.body, fontSize, color,
    valign: 'top', lineSpacingMultiple: 1.15,
    fitPolicy: 'fixed',
  };
}

/** Wraps fitRowsToHeight() and records a warning when it had to shrink the
 *  font below the preferred size — otherwise a shrink event is invisible
 *  (the resulting boxes are marked fitPolicy:'fixed' since sizing already
 *  happened here, so drawText's own shrink-tracking never sees it). */
function notedFitRows(items: string[], opts: FitRowsOptions, warnings: string[], label: string) {
  const result = fitRowsToHeight(items, opts);
  if (result.fontSize < opts.fontSize) {
    warnings.push(`${label}: font shrunk ${opts.fontSize}→${result.fontSize}pt to fit ${items.length} item(s)`);
  }
  return result;
}

/** Same as notedFitRows, for the single-field fitTextToBox() call sites
 *  (lead/definition/body/aim/evidence — all pre-sized here, so their boxes
 *  are drawn with fitPolicy:'fixed' and would otherwise never surface a
 *  shrink/truncate event to the debug warnings list). */
function notedFitText(text: string, opts: FitTextToBoxOptions, warnings: string[], label: string) {
  const result = fitTextToBox(text, opts);
  if (result.shrunk) warnings.push(`${label}: font shrunk ${opts.fontSize}→${result.fontSize}pt`);
  if (result.truncated) warnings.push(`${label}: text truncated to fit its box`);
  return result;
}

function richRuns(heading: string | undefined, body: string, headColor: string, bodyColor: string): { text: string; options?: Record<string, unknown> }[] {
  const runs: { text: string; options?: Record<string, unknown> }[] = [];
  if (heading) runs.push({ text: clean(heading) + '  ', options: { bold: true, color: headColor } });
  for (const seg of parseStrong(body)) {
    runs.push({ text: seg.text, options: { color: bodyColor, ...(seg.bold ? { bold: true } : {}) } });
  }
  return runs;
}

// ============================================================
// Per-type plan builders
// ============================================================

function planContent(d: any, t: PptxTheme): PptxSlidePlan {
  const boxes: PptxSlidePlan['boxes'] = [];
  const warnings: string[] = [];
  const kb = kickerBox(d.kicker, t);
  if (kb) boxes.push(kb);
  boxes.push(titleBox(d.title, t, !!d.kicker, 28));

  let top = d.kicker ? PPTX_GRID.leadY : PPTX_GRID.titleYNoKicker + 0.95;
  if (d.lead) {
    const fit = notedFitText(clean(d.lead), { fontSize: 15, boxWidth: CW * 0.92, boxHeight: 0.7, fitPolicy: 'shrink-once', minFontSize: 11 }, warnings, 'lead');
    boxes.push({
      id: nextId('lead'), kind: 'text', role: 'lead',
      x: M, y: top, w: CW * 0.92, h: 0.7,
      text: fit.text, fontFace: t.body, fontSize: fit.fontSize, color: t.muted,
      valign: 'top', lineSpacingMultiple: 1.1, fitPolicy: 'fixed',
    });
    top += 0.85;
  }

  const points = (Array.isArray(d.points) ? d.points : []).slice(0, 5);
  const measureStrings = points.map((p: any) => `${p.heading ?? ''} ${clean(p.text)}`.trim());
  const { fontSize, positions } = notedFitRows(measureStrings, {
    fontSize: 16, boxWidth: CW - 0.4, totalHeight: PPTX_CANVAS.height - top - 0.5, startY: top, minFontSize: 11,
  }, warnings, 'points');
  points.forEach((p: any, i: number) => {
    const { y, h } = positions[i];
    boxes.push({
      id: nextId('dot'), kind: 'shape', shape: 'ellipse',
      x: M, y: y + 0.1, w: 0.14, h: 0.14, fill: t.accent,
    });
    boxes.push(richRowBox(nextId('point'), M + 0.4, y, CW - 0.4, h, richRuns(p.heading, p.text, t.text, t.muted), t, fontSize, t.text));
  });

  return { type: 'CONTENT', mode: 'editable', boxes, warnings };
}

function planDefinition(d: any, t: PptxTheme): PptxSlidePlan {
  const boxes: PptxSlidePlan['boxes'] = [];
  const warnings: string[] = [];
  const kb = kickerBox(d.kicker, t);
  if (kb) boxes.push(kb);
  boxes.push({
    id: nextId('term'), kind: 'text', role: 'title',
    x: M - 0.02, y: d.kicker ? PPTX_GRID.titleY : PPTX_GRID.titleYNoKicker, w: CW, h: 0.9,
    text: clean(d.term), fontFace: t.display, fontSize: 36, color: t.text, bold: true,
    fitPolicy: 'shrink-once', minFontSize: 26,
  });

  const defTop = d.kicker ? 2.0 : 1.7;
  const aspects = (Array.isArray(d.aspects) ? d.aspects : []).slice(0, 3);
  const defH = aspects.length ? 1.5 : 3.5; // more room when there's no card row below
  const fitDef = notedFitText(clean(d.definition), { fontSize: 17, boxWidth: CW * 0.92, boxHeight: defH, fitPolicy: 'shrink-once', minFontSize: 12 }, warnings, 'definition');
  boxes.push({
    id: nextId('definition'), kind: 'text', role: 'body',
    x: M, y: defTop, w: CW * 0.92, h: defH,
    text: fitDef.text, fontFace: t.body, fontSize: fitDef.fontSize, color: t.muted,
    valign: 'top', lineSpacingMultiple: 1.15, fitPolicy: 'fixed',
  });

  if (aspects.length) {
    const n = aspects.length, gap = 0.4, cw = (CW - gap * (n - 1)) / n;
    const y = defTop + defH + 0.5, h = PPTX_CANVAS.height - (defTop + defH + 0.5) - 0.5;
    aspects.forEach((a: any, i: number) => {
      const x = M + i * (cw + gap);
      boxes.push({ id: nextId('card'), kind: 'shape', shape: 'roundRect', x, y, w: cw, h, fill: t.surface, line: t.border, radius: t.radius });
      boxes.push({
        id: nextId('aspect-label'), kind: 'text', role: 'side',
        x: x + 0.3, y: y + 0.3, w: cw - 0.6, h: 0.4,
        text: clean(a.label).toUpperCase(), fontFace: t.body, fontSize: 12, color: t.numColor, bold: true, charSpacing: 1,
        fitPolicy: 'fixed',
      });
      const fitAspect = notedFitText(clean(a.text), { fontSize: 14, boxWidth: cw - 0.6, boxHeight: h - 1.1, fitPolicy: 'shrink-once', minFontSize: 10 }, warnings, `aspect-${i}`);
      boxes.push({
        id: nextId('aspect-text'), kind: 'text', role: 'side',
        x: x + 0.3, y: y + 0.85, w: cw - 0.6, h: h - 1.1,
        text: fitAspect.text, fontFace: t.body, fontSize: fitAspect.fontSize, color: t.muted,
        valign: 'top', fitPolicy: 'fixed',
      });
    });
  }

  return { type: 'DEFINITION', mode: 'editable', boxes, warnings };
}

function planBatafsil(d: any, t: PptxTheme): PptxSlidePlan {
  const boxes: PptxSlidePlan['boxes'] = [];
  const warnings: string[] = [];
  const kb = kickerBox(d.kicker, t);
  if (kb) boxes.push(kb);
  boxes.push(titleBox(d.title, t, !!d.kicker, 26));

  const points = (Array.isArray(d.points) ? d.points : []).slice(0, 4);
  const top = 2.3, avail = PPTX_CANVAS.height - top - 0.5;
  const bodyW = points.length ? CW * 0.6 : CW * 0.92;

  const fitBody = notedFitText(clean(d.body), { fontSize: 17, boxWidth: bodyW, boxHeight: avail, fitPolicy: 'shrink-once', minFontSize: 12, lineHeight: 1.3 }, warnings, 'body');
  boxes.push({
    id: nextId('body'), kind: 'text', role: 'body',
    x: M, y: top, w: bodyW, h: avail,
    text: fitBody.text, fontFace: t.body, fontSize: fitBody.fontSize, color: t.text,
    valign: 'top', lineSpacingMultiple: 1.3, fitPolicy: 'fixed',
  });

  if (points.length) {
    const texts = points.map((p: any) => clean(p.text));
    const { fontSize, positions } = notedFitRows(texts, {
      fontSize: 15, boxWidth: CW - bodyW - 0.5, totalHeight: avail, startY: top, gap: 0.2, minFontSize: 11,
    }, warnings, 'side-points');
    points.forEach((p: any, i: number) => {
      const { y, h } = positions[i];
      boxes.push({ id: nextId('sidedot'), kind: 'shape', shape: 'ellipse', x: M + bodyW + 0.5, y: y + 0.08, w: 0.1, h: 0.1, fill: t.accent });
      boxes.push({
        id: nextId('sidetext'), kind: 'text', role: 'side',
        x: M + bodyW + 0.7, y, w: CW - bodyW - 0.7, h,
        text: clean(p.text), fontFace: t.body, fontSize, color: t.muted,
        valign: 'top', lineSpacingMultiple: 1.25, fitPolicy: 'fixed',
      });
    });
  }

  return { type: 'BATAFSIL', mode: 'editable', boxes, warnings };
}

function planConclusion(d: any, t: PptxTheme): PptxSlidePlan {
  const boxes: PptxSlidePlan['boxes'] = [];
  const warnings: string[] = [];
  const kb = kickerBox(d.kicker, t);
  if (kb) boxes.push(kb);
  boxes.push(titleBox(d.title || 'Xulosa', t, !!d.kicker, 28));

  const points = (Array.isArray(d.points) ? d.points : []).slice(0, 4);
  const top = d.kicker ? 2.0 : 1.7;
  const avail = PPTX_CANVAS.height - top - (d.closing ? 1.0 : 0.5);
  const texts = points.map((p: any) => clean(p));
  const { fontSize, positions } = notedFitRows(texts, {
    fontSize: 17, boxWidth: CW - 0.7, totalHeight: avail, startY: top, gap: 0.25, minFontSize: 12,
  }, warnings, 'points');
  points.forEach((p: any, i: number) => {
    const { y, h } = positions[i];
    const badgeH = Math.min(0.45, h);
    boxes.push({ id: nextId('num-badge'), kind: 'shape', shape: 'ellipse', x: M, y, w: badgeH, h: badgeH, fill: t.accent });
    boxes.push({
      id: nextId('num'), kind: 'text', role: 'side',
      x: M, y, w: badgeH, h: badgeH, text: String(i + 1),
      fontFace: t.display, fontSize: 15, color: t.onAccent, bold: true, align: 'center', valign: 'middle',
      fitPolicy: 'fixed',
    });
    boxes.push({
      id: nextId('point'), kind: 'text', role: 'body',
      x: M + 0.7, y, w: CW - 0.7, h,
      text: clean(p), fontFace: t.body, fontSize, color: t.text,
      valign: 'top', lineSpacingMultiple: 1.1, fitPolicy: 'fixed',
    });
  });

  if (d.closing) {
    boxes.push({
      id: nextId('closing'), kind: 'text', role: 'footer',
      x: M, y: PPTX_CANVAS.height - 0.9, w: CW, h: 0.5,
      text: clean(d.closing), fontFace: t.body, fontSize: 14, color: t.muted, italic: true,
      valign: 'top', fitPolicy: 'shrink-once', minFontSize: 10,
    });
  }

  return { type: 'CONCLUSION', mode: 'editable', boxes, warnings };
}

function planAimTasks(d: any, t: PptxTheme): PptxSlidePlan {
  const boxes: PptxSlidePlan['boxes'] = [];
  const warnings: string[] = [];
  const kb = kickerBox(d.kicker, t);
  if (kb) boxes.push(kb);
  boxes.push(titleBox(d.title, t, !!d.kicker, 28));

  const aimY = d.kicker ? 1.95 : 1.65;
  const fitAim = notedFitText(clean(d.aim), { fontSize: 15, boxWidth: CW - 0.6, boxHeight: 0.76, fitPolicy: 'shrink-once', minFontSize: 11 }, warnings, 'aim');
  boxes.push({ id: nextId('aim-card'), kind: 'shape', shape: 'roundRect', x: M, y: aimY, w: CW, h: 1.0, fill: t.surface, radius: t.radius });
  boxes.push({
    id: nextId('aim'), kind: 'text', role: 'body',
    x: M + 0.3, y: aimY + 0.12, w: CW - 0.6, h: 0.76,
    text: fitAim.text, fontFace: t.body, fontSize: fitAim.fontSize, color: t.text, bold: true,
    valign: 'middle', lineSpacingMultiple: 1.1, fitPolicy: 'fixed',
  });

  const tasks = (Array.isArray(d.tasks) ? d.tasks : []).slice(0, 5);
  const top = aimY + 1.35;
  const texts = tasks.map((tk: any) => clean(tk));
  const { fontSize, positions } = notedFitRows(texts, {
    fontSize: 16, boxWidth: CW - 0.65, totalHeight: PPTX_CANVAS.height - top - 0.4, startY: top, gap: 0.15, minFontSize: 11,
  }, warnings, 'tasks');
  tasks.forEach((tk: any, i: number) => {
    const { y, h } = positions[i];
    const badgeH = Math.min(0.4, h);
    boxes.push({ id: nextId('task-badge'), kind: 'shape', shape: 'ellipse', x: M, y, w: badgeH, h: badgeH, fill: t.accent });
    boxes.push({
      id: nextId('task-num'), kind: 'text', role: 'side',
      x: M, y, w: badgeH, h: badgeH, text: String(i + 1),
      fontFace: t.display, fontSize: 14, color: t.onAccent, bold: true, align: 'center', valign: 'middle', fitPolicy: 'fixed',
    });
    boxes.push({
      id: nextId('task'), kind: 'text', role: 'body',
      x: M + 0.65, y, w: CW - 0.65, h,
      text: clean(tk), fontFace: t.body, fontSize, color: t.text,
      valign: 'top', lineSpacingMultiple: 1.1, fitPolicy: 'fixed',
    });
  });

  return { type: 'AIM_TASKS', mode: 'editable', boxes, warnings };
}

function planFinding(d: any, t: PptxTheme): PptxSlidePlan {
  const boxes: PptxSlidePlan['boxes'] = [];
  const warnings: string[] = [];
  const kb = kickerBox(d.kicker, t);
  if (kb) boxes.push(kb);
  boxes.push(titleBox(d.title, t, !!d.kicker, 26));

  const points = (Array.isArray(d.points) ? d.points : []).slice(0, 3);
  const top = 2.3;
  const avail = PPTX_CANVAS.height - top - (d.source ? 0.9 : 0.5);
  const bodyW = points.length ? CW * 0.6 : CW * 0.92;

  const fitEvidence = notedFitText(clean(d.evidence), { fontSize: 16, boxWidth: bodyW, boxHeight: avail, fitPolicy: 'shrink-once', minFontSize: 12, lineHeight: 1.3 }, warnings, 'evidence');
  boxes.push({
    id: nextId('evidence'), kind: 'text', role: 'body',
    x: M, y: top, w: bodyW, h: avail,
    text: fitEvidence.text, fontFace: t.body, fontSize: fitEvidence.fontSize, color: t.text,
    valign: 'top', lineSpacingMultiple: 1.3, fitPolicy: 'fixed',
  });

  if (points.length) {
    const texts = points.map((p: any) => clean(p.text));
    const { fontSize, positions } = notedFitRows(texts, {
      fontSize: 15, boxWidth: CW - bodyW - 0.5, totalHeight: avail, startY: top, gap: 0.2, minFontSize: 11,
    }, warnings, 'side-points');
    points.forEach((p: any, i: number) => {
      const { y, h } = positions[i];
      boxes.push({ id: nextId('finding-dot'), kind: 'shape', shape: 'ellipse', x: M + bodyW + 0.5, y: y + 0.08, w: 0.1, h: 0.1, fill: t.accent });
      boxes.push({
        id: nextId('finding-side'), kind: 'text', role: 'side',
        x: M + bodyW + 0.7, y, w: CW - bodyW - 0.7, h,
        text: clean(p.text), fontFace: t.body, fontSize, color: t.muted,
        valign: 'top', lineSpacingMultiple: 1.25, fitPolicy: 'fixed',
      });
    });
  }

  if (d.source) {
    boxes.push({
      id: nextId('source'), kind: 'text', role: 'source',
      x: M, y: PPTX_CANVAS.height - 0.6, w: bodyW, h: 0.35,
      text: clean(d.source), fontFace: t.body, fontSize: 9, color: t.muted, fitPolicy: 'fixed',
    });
  }

  return { type: 'FINDING', mode: 'editable', boxes, warnings };
}

function planRelevance(d: any, t: PptxTheme): PptxSlidePlan {
  const boxes: PptxSlidePlan['boxes'] = [];
  const warnings: string[] = [];
  const kb = kickerBox(d.kicker, t);
  if (kb) boxes.push(kb);
  boxes.push(titleBox(d.title, t, !!d.kicker, 26));

  let top = d.kicker ? 1.95 : 1.65;
  if (d.lead) {
    const fit = notedFitText(clean(d.lead), { fontSize: 15, boxWidth: CW * 0.92, boxHeight: 0.7, fitPolicy: 'shrink-once', minFontSize: 11 }, warnings, 'lead');
    boxes.push({
      id: nextId('rel-lead'), kind: 'text', role: 'lead',
      x: M, y: top, w: CW * 0.92, h: 0.7,
      text: fit.text, fontFace: t.body, fontSize: fit.fontSize, color: t.muted,
      valign: 'top', lineSpacingMultiple: 1.1, fitPolicy: 'fixed',
    });
    top += 0.85;
  }

  const hasStat = !!d.stat;
  const listW = hasStat ? CW * 0.6 : CW * 0.92;
  const points = (Array.isArray(d.points) ? d.points : []).slice(0, 3);
  const avail = PPTX_CANVAS.height - top - 0.6;
  const texts = points.map((p: any) => clean(p.text));
  const { fontSize, positions } = notedFitRows(texts, {
    fontSize: 16, boxWidth: listW - 0.3, totalHeight: avail, startY: top, gap: 0.2, minFontSize: 11,
  }, warnings, 'points');
  points.forEach((p: any, i: number) => {
    const { y, h } = positions[i];
    boxes.push({ id: nextId('rel-dot'), kind: 'shape', shape: 'ellipse', x: M, y: y + 0.08, w: 0.1, h: 0.1, fill: t.accent });
    boxes.push({
      id: nextId('rel-point'), kind: 'text', role: 'body',
      x: M + 0.3, y, w: listW - 0.3, h,
      text: clean(p.text), fontFace: t.body, fontSize, color: t.muted,
      valign: 'top', lineSpacingMultiple: 1.25, fitPolicy: 'fixed',
    });
  });

  if (hasStat) {
    const cx = M + listW + 0.4, cw = CW - listW - 0.4, ch = 2.7;
    boxes.push({ id: nextId('stat-card'), kind: 'shape', shape: 'roundRect', x: cx, y: top, w: cw, h: ch, fill: t.surface, radius: t.radius });
    const statStr = `${d.stat.approx ? '~' : ''}${clean(d.stat.value)}${d.stat.unit ? ' ' + clean(d.stat.unit) : ''}`;
    boxes.push({
      id: nextId('stat-num'), kind: 'text', role: 'side',
      x: cx + 0.3, y: top + 0.3, w: cw - 0.6, h: 1.0,
      text: statStr, fontFace: t.display, fontSize: 34, color: t.numColor, bold: true, fitPolicy: 'fixed',
    });
    boxes.push({
      id: nextId('stat-label'), kind: 'text', role: 'side',
      x: cx + 0.3, y: top + 1.4, w: cw - 0.6, h: 0.9,
      text: clean(d.stat.label), fontFace: t.body, fontSize: 13, color: t.muted, valign: 'top', fitPolicy: 'fixed',
    });
    if (d.source) {
      boxes.push({
        id: nextId('stat-src'), kind: 'text', role: 'source',
        x: cx + 0.3, y: top + ch - 0.5, w: cw - 0.6, h: 0.4,
        text: clean(d.source), fontFace: t.body, fontSize: 9, color: t.muted, valign: 'top', fitPolicy: 'fixed',
      });
    }
  } else if (d.source) {
    boxes.push({
      id: nextId('rel-source'), kind: 'text', role: 'source',
      x: M, y: PPTX_CANVAS.height - 0.7, w: CW, h: 0.3,
      text: clean(d.source), fontFace: t.body, fontSize: 9, color: t.muted, fitPolicy: 'fixed',
    });
  }

  return { type: 'RELEVANCE', mode: 'editable', boxes, warnings };
}

const PLAN_BUILDERS: Record<string, (d: any, t: PptxTheme) => PptxSlidePlan> = {
  CONTENT: planContent,
  DEFINITION: planDefinition,
  BATAFSIL: planBatafsil,
  CONCLUSION: planConclusion,
  AIM_TASKS: planAimTasks,
  FINDING: planFinding,
  RELEVANCE: planRelevance,
};

/** Builds a validated layout plan for a migrated type, or `undefined` for a
 *  type still on the legacy path (caller falls back to renderLegacySlide). */
export function buildPptxSlidePlan(type: string, content: any, themeId: string): PptxSlidePlan | undefined {
  const builder = PLAN_BUILDERS[type];
  if (!builder) return undefined;
  const t = getPptxTheme(themeId);
  const plan = builder(content ?? {}, t);
  plan.warnings.push(...validateSlidePlan(plan, PPTX_CANVAS.width, PPTX_CANVAS.height));
  return plan;
}

export interface EditableResult {
  buffer: Buffer;
  warnings: string[];
}

export async function buildEditablePptx(themeId: string, slides: { type: string; content: unknown }[]): Promise<EditableResult> {
  const t = getPptxTheme(themeId);
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'L16x9', width: PPTX_CANVAS.width, height: PPTX_CANVAS.height });
  pptx.layout = 'L16x9';
  pptx.author = 'Lumio';
  pptx.company = 'Lumio';

  const warnings: string[] = [];
  slides.forEach((sl, i) => {
    const slide: Slide = pptx.addSlide();
    slide.background = { color: t.bg };
    try {
      const plan = MIGRATED_TYPES.has(sl.type) ? buildPptxSlidePlan(sl.type, sl.content, themeId) : undefined;
      if (plan) {
        renderSlidePlan(slide, plan);
        if (plan.warnings.length) warnings.push(...plan.warnings.map((w) => `slide ${i + 1}: ${w}`));
      } else {
        const fn = LEGACY_PPTX_RENDERERS[sl.type] ?? rInsight;
        fn(slide, t, sl.content ?? {});
      }
    } catch (e) {
      warnings.push(`slide ${i + 1} (${sl.type}): render failed, using fallback title only: ${String(e)}`);
      rInsight(slide, t, (sl.content as any) ?? {});
    }
    if (sl.type !== 'TITLE') {
      slide.addText(String(i + 1).padStart(2, '0'), {
        x: PPTX_CANVAS.width - 1.2, y: PPTX_CANVAS.height - 0.55, w: 0.8, h: 0.3,
        align: 'right', fontFace: t.body, fontSize: 10, color: t.muted,
      });
    }
  });

  const buffer = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
  return { buffer, warnings };
}
