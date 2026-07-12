// pptx.draw.ts
// Dumb drawing helpers: take a finished PptxAnyBox (already positioned in
// inches) and call the matching pptxgenjs primitive. The only "smart" bit is
// drawText running plain-string boxes through pptx.text-fit.ts first — this
// is the single choke point where overflow gets caught before PowerPoint
// ever sees the text, instead of being discovered after the fact.

import PptxGenJS from 'pptxgenjs';
import type { PptxTextBox, PptxImageBox, PptxShapeBox, PptxSlidePlan } from './pptx.layout';
import { fitTextToBox } from './pptx.text-fit';

type Slide = PptxGenJS.Slide;

export function drawText(slide: Slide, box: PptxTextBox, warnings?: string[]): void {
  let text = box.text;
  let fontSize = box.fontSize;

  // Rich-text runs (inline bold from <strong>, bullet lists) size their own
  // rows upstream and pass fitPolicy:'fixed' or omit it — only plain strings
  // go through the fit/shrink/truncate pipeline here.
  if (typeof text === 'string' && box.fitPolicy && box.fitPolicy !== 'fixed') {
    const fit = fitTextToBox(text, {
      fontSize: box.fontSize,
      boxWidth: box.w,
      boxHeight: box.h,
      fitPolicy: box.fitPolicy,
      minFontSize: box.minFontSize,
    });
    text = fit.text;
    fontSize = fit.fontSize;
    if ((fit.shrunk || fit.truncated) && warnings) {
      const parts: string[] = [];
      if (fit.shrunk) parts.push(`font shrunk ${box.fontSize}→${fit.fontSize}pt`);
      if (fit.truncated) parts.push('text truncated');
      warnings.push(`${box.id}: ${parts.join(', ')}`);
    }
  }

  slide.addText(text as any, {
    x: box.x, y: box.y, w: box.w, h: box.h,
    fontFace: box.fontFace,
    fontSize,
    color: box.color,
    bold: box.bold,
    italic: box.italic,
    align: box.align,
    valign: box.valign ?? 'top',
    lineSpacingMultiple: box.lineSpacingMultiple,
    charSpacing: box.charSpacing,
    ...(box.transparency != null ? { transparency: box.transparency } : {}),
  } as any);
}

export function drawImage(slide: Slide, box: PptxImageBox): void {
  if (!box.data && !box.path) return;
  slide.addImage({
    x: box.x, y: box.y, w: box.w, h: box.h,
    ...(box.data ? { data: box.data } : {}),
    ...(box.path ? { path: box.path } : {}),
    ...(box.altText ? { altText: box.altText } : {}),
  } as any);
}

export function drawShape(slide: Slide, box: PptxShapeBox): void {
  slide.addShape(box.shape as any, {
    x: box.x, y: box.y, w: box.w, h: box.h,
    ...(box.fill ? { fill: { color: box.fill } } : {}),
    ...(box.line ? { line: { color: box.line, width: 1 } } : {}),
    ...(box.radius != null ? { rectRadius: box.radius } : {}),
  });
}

/**
 * Draws every box in a plan, back-to-front by `z` (default 0). Per-box
 * failures are caught and recorded as plan warnings rather than aborting the
 * whole slide — matches the existing buildPptx() per-slide try/catch
 * philosophy (one bad box shouldn't break the deck).
 */
export function renderSlidePlan(slide: Slide, plan: PptxSlidePlan): void {
  const sorted = [...plan.boxes].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
  for (const box of sorted) {
    try {
      if (box.kind === 'text') drawText(slide, box, plan.warnings);
      else if (box.kind === 'image') drawImage(slide, box);
      else drawShape(slide, box);
    } catch (e) {
      plan.warnings.push(`${plan.type}/${box.id}: draw failed: ${String(e)}`);
    }
  }
}
