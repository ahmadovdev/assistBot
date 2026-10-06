// pptx.draw.ts
// Dumb drawing helpers: take a finished PptxAnyBox and draw the source data
// exactly as supplied.

import PptxGenJS from 'pptxgenjs';
import type { PptxTextBox, PptxImageBox, PptxShapeBox, PptxSlidePlan } from './pptx.layout';

type Slide = PptxGenJS.Slide;

export function drawText(slide: Slide, box: PptxTextBox): void {
  slide.addText(box.text as any, {
    x: box.x, y: box.y, w: box.w, h: box.h,
    fontFace: box.fontFace,
    fontSize: box.fontSize,
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

/** Draws every box in a plan, back-to-front by `z` (default 0). */
export function renderSlidePlan(slide: Slide, plan: PptxSlidePlan): void {
  const sorted = [...plan.boxes].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
  for (const box of sorted) {
    if (box.kind === 'text') drawText(slide, box);
    else if (box.kind === 'image') drawImage(slide, box);
    else drawShape(slide, box);
  }
}
