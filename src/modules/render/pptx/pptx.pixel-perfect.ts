// pptx.pixel-perfect.ts
// Mode 1: renders each slide as a full-slide image, so PPTX visually matches
// the HTML/PDF render almost 1:1. Text is not editable — this mode trades
// editability for 100% visual fidelity, on purpose (see the mode-comparison
// note in render.service.ts).
//
// Deliberately framework-agnostic: this file knows nothing about Puppeteer.
// The caller (render.service.ts) is responsible for building the deck HTML
// (legacy or academic engine, depending on theme) and screenshotting it via
// BrowserService.screenshotSlides() — this file only turns the resulting
// image buffers into a PPTX. That keeps the pptx/ module's existing
// "zero Puppeteer dependency" property intact for editable/hybrid too.

import PptxGenJS from 'pptxgenjs';
import { PPTX_CANVAS, PPTX_SIZE_WARNING_BYTES } from './pptx.constants';

export interface PixelPerfectResult {
  buffer: Buffer;
  warnings: string[];
}

/**
 * Builds a PPTX where every slide is a single full-bleed image.
 * `slideImages[i]` must already be in the same order as the deck's slides.
 */
export async function buildPixelPerfectPptx(slideImages: Buffer[]): Promise<PixelPerfectResult> {
  const warnings: string[] = [];
  if (!slideImages.length) {
    throw new Error('pixelPerfect: no slide images to insert (deck produced 0 slides)');
  }

  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'L16x9', width: PPTX_CANVAS.width, height: PPTX_CANVAS.height });
  pptx.layout = 'L16x9';
  pptx.author = 'Lumio';
  pptx.company = 'Lumio';

  slideImages.forEach((img, i) => {
    const slide = pptx.addSlide();
    try {
      slide.addImage({
        data: `data:image/png;base64,${img.toString('base64')}`,
        x: 0,
        y: 0,
        w: PPTX_CANVAS.width,
        h: PPTX_CANVAS.height,
      });
    } catch (e) {
      // Image insertion failing is a hard error, not a soft warning — a
      // pixelPerfect slide with no image is a blank slide, not a degraded
      // one, and the caller (render.service.ts) needs to know to fall back.
      throw new Error(`pixelPerfect: failed to insert image for slide ${i}: ${String(e)}`);
    }
  });

  const buffer = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
  if (buffer.length > PPTX_SIZE_WARNING_BYTES) {
    warnings.push(
      `pixelPerfect PPTX is ${(buffer.length / 1024 / 1024).toFixed(1)}MB — consider a lower screenshot resolution.`,
    );
  }
  return { buffer, warnings };
}
