// pptx.hybrid.ts
// Mode 3 (default): the preferred trade-off between pixelPerfect's visual
// fidelity and editable's editability.
//
// v1 approach (see the TODO below for what "true" hybrid would add):
//   1. Full-slide screenshot background (identical to pixelPerfect) — this
//      keeps the complex HTML/CSS visual design completely stable.
//   2. On top, invisible (100% transparent) editable pptxgenjs text boxes
//      for title/body/footer, positioned via PPTX_GRID's zones and
//      generically extracted from each slide's content object.
//
// Why invisible rather than visible-and-aligned: aligning a *visible*
// editable text box exactly on top of where that text sits in the
// screenshot would require per-slide-type, per-layout-variant pixel
// coordinates (every legacy layout — editorial_split, bento_academic, etc.
// — and every academic-engine layout positions title/body differently, and
// several use flexbox/grid with content-dependent auto-sizing, not fixed
// boxes). That mapping is a genuinely large, error-prone effort — doing it
// badly would show visibly misaligned duplicate text, which is *worse* than
// no editability. An invisible overlay sidesteps that entirely: the slide
// LOOKS pixel-identical to pixelPerfect (nothing duplicate is visible), but
// PowerPoint's outline view / Ctrl+A / clicking into the box still finds and
// lets you edit real text runs for title/body/footer.
//
// TODO(true hybrid v2): render a text-free ("background-only") variant of
// each HTML template (e.g. a `hideText` CSS class toggled before
// screenshotting) and compute each visible text element's actual rendered
// bounding box (via `element.boundingBox()` in Puppeteer) to overlay
// pixel-aligned, VISIBLE editable text instead of an invisible phantom copy.

import PptxGenJS from 'pptxgenjs';
import { DeckSlide } from '../templates/deck';
import { PPTX_CANVAS } from './pptx.constants';
import { PPTX_GRID } from './pptx.grid';
import { getPptxTheme } from './pptx.theme';
import type { PptxSlidePlan, PptxTextBox, PptxImageBox } from './pptx.layout';
import { renderSlidePlan } from './pptx.draw';

export interface HybridResult {
  buffer: Buffer;
  warnings: string[];
}

const clean = (s: unknown): string => String(s ?? '').replace(/<[^>]+>/g, '').trim();

/** Generic "what's the title-like field" extraction across slide types —
 *  deliberately loose (covers the common field names) since v1's overlay
 *  position is approximate anyway; a wrong/missing extraction just means no
 *  invisible title box gets added for that slide, not a broken layout. */
function extractTitle(content: Record<string, any>): string | undefined {
  return content.title || content.term || content.quote || undefined;
}

function extractBody(content: Record<string, any>): string | undefined {
  return (
    content.body || content.definition || content.lead || content.evidence || content.aim || undefined
  );
}

function extractFooter(content: Record<string, any>): string | undefined {
  return content.source || content.closing || undefined;
}

function buildHybridPlan(slide: DeckSlide, index: number, image: Buffer, themeId: string): PptxSlidePlan {
  const t = getPptxTheme(themeId);
  const content = (slide.content ?? {}) as Record<string, any>;
  const boxes: (PptxTextBox | PptxImageBox)[] = [
    {
      id: 'background',
      kind: 'image',
      x: 0,
      y: 0,
      w: PPTX_CANVAS.width,
      h: PPTX_CANVAS.height,
      data: `data:image/png;base64,${image.toString('base64')}`,
      z: 0,
    },
  ];

  const title = extractTitle(content);
  if (title) {
    boxes.push({
      id: 'title-overlay',
      kind: 'text',
      role: 'title',
      x: PPTX_GRID.contentX,
      y: PPTX_GRID.titleY,
      w: PPTX_GRID.contentW,
      h: PPTX_GRID.titleH,
      text: clean(title),
      fontFace: t.display,
      fontSize: 28,
      color: t.text,
      bold: true,
      transparency: 100,
      z: 1,
    });
  }

  const body = extractBody(content);
  if (body) {
    boxes.push({
      id: 'body-overlay',
      kind: 'text',
      role: 'body',
      x: PPTX_GRID.contentX,
      y: PPTX_GRID.bodyY,
      w: PPTX_GRID.contentW,
      h: PPTX_GRID.bodyH,
      text: clean(body),
      fontFace: t.body,
      fontSize: 16,
      color: t.text,
      transparency: 100,
      z: 1,
    });
  }

  const footer = extractFooter(content);
  if (footer) {
    boxes.push({
      id: 'footer-overlay',
      kind: 'text',
      role: 'footer',
      x: PPTX_GRID.contentX,
      y: PPTX_GRID.footerY,
      w: PPTX_GRID.contentW,
      h: PPTX_GRID.footerH,
      text: clean(footer),
      fontFace: t.body,
      fontSize: 10,
      color: t.muted,
      transparency: 100,
      z: 1,
    });
  }

  return { type: slide.type, mode: 'hybrid', boxes, warnings: [] };
}

/**
 * Builds the hybrid PPTX: `slideImages[i]` (full-slide screenshots, same as
 * pixelPerfect) become each slide's background; title/body/footer become
 * invisible editable overlays extracted generically from `slides[i].content`.
 */
export async function buildHybridPptx(
  slideImages: Buffer[],
  slides: DeckSlide[],
  themeId: string,
): Promise<HybridResult> {
  if (slideImages.length !== slides.length) {
    throw new Error(
      `hybrid: screenshot count (${slideImages.length}) does not match slide count (${slides.length})`,
    );
  }

  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'L16x9', width: PPTX_CANVAS.width, height: PPTX_CANVAS.height });
  pptx.layout = 'L16x9';
  pptx.author = 'Lumio';
  pptx.company = 'Lumio';

  const warnings: string[] = [];
  slides.forEach((slideData, i) => {
    const plan = buildHybridPlan(slideData, i, slideImages[i], themeId);
    const slide = pptx.addSlide();
    renderSlidePlan(slide, plan);
    warnings.push(...plan.warnings);
  });

  const buffer = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
  return { buffer, warnings };
}
