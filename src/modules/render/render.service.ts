import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrowserService } from './browser.service';
import { buildDeck, DeckSlide } from './templates/deck';
import { buildAcademicDeck } from './academic/deck';
import { buildPremiumAcademicDeck } from './premium_academic/deck';
import { buildSoftCurvesDeck } from './soft_curves/deck';
import { buildPixelPerfectPptx } from './pptx/pptx.pixel-perfect';
import { buildHybridPptx } from './pptx/pptx.hybrid';
import { PPTX_SCREENSHOT } from './pptx/pptx.constants';

export type PptxRenderMode = 'pixelPerfect' | 'hybrid';

export interface RenderPptxOptions {
  mode?: PptxRenderMode;
  screenshot?: {
    width?: number;
    height?: number;
    deviceScaleFactor?: number;
  };
  debug?: boolean;
}

export interface RenderPptxResult {
  buffer: Buffer;
  mode: PptxRenderMode;
  warnings: string[];
}

@Injectable()
export class RenderService {
  private readonly logger = new Logger(RenderService.name);

  constructor(
    private readonly browser: BrowserService,
    private readonly config: ConfigService,
  ) {}

  private useAcademic(themeId: string): boolean {
    // The academic engine is used when the user selects the 'modern_academic'
    // theme, or when the RENDER_ENGINE=academic global override is set.
    return themeId === 'modern_academic'
      || this.config.get<string>('app.render.engine') === 'academic';
  }

  private usePremiumAcademic(themeId: string): boolean {
    return themeId === 'premium_academic';
  }

  private useSoftCurves(themeId: string): boolean {
    return themeId === 'soft_curves_research';
  }

  async renderPdf(themeId: string, slides: DeckSlide[]): Promise<Buffer> {
    // Academic engine renders the modern_academic design at 1920x1080;
    // premium_academic renders its own design at 1280x720; every other
    // theme uses the existing (classic) renderer, unchanged.
    if (this.useAcademic(themeId)) {
      const html = buildAcademicDeck(themeId, slides);
      return this.browser.htmlToPdf(html, { width: 1920, height: 1080 });
    }
    if (this.usePremiumAcademic(themeId)) {
      const html = buildPremiumAcademicDeck(themeId, slides);
      return this.browser.htmlToPdf(html);
    }
    if (this.useSoftCurves(themeId)) {
      const html = buildSoftCurvesDeck(themeId, slides);
      return this.browser.htmlToPdf(html);
    }
    const html = buildDeck(themeId, slides);
    return this.browser.htmlToPdf(html);
  }

  /** Builds the deck HTML for whichever engine this theme uses, and returns
   *  the matching per-slide CSS selector + native canvas size — shared by
   *  every screenshot-based PPTX mode (pixelPerfect, hybrid background). */
  private buildDeckHtml(themeId: string, slides: DeckSlide[]) {
    if (this.useAcademic(themeId)) {
      return { html: buildAcademicDeck(themeId, slides), selector: '.a-slide', canvas: { width: 1920, height: 1080 } };
    }
    if (this.usePremiumAcademic(themeId)) {
      return { html: buildPremiumAcademicDeck(themeId, slides), selector: '.pa-slide', canvas: { width: 1280, height: 720 } };
    }
    if (this.useSoftCurves(themeId)) {
      return { html: buildSoftCurvesDeck(themeId, slides), selector: '.sc-slide', canvas: { width: 1280, height: 720 } };
    }
    return { html: buildDeck(themeId, slides), selector: '.slide', canvas: { width: 1280, height: 720 } };
  }

  /** Screenshots every slide once, at the requested (or default) resolution.
   *  `deviceScaleFactor` is derived from the requested screenshot width vs
   *  the HTML canvas's native px width, so callers can just say "I want
   *  2560x1440" without knowing which engine/canvas size backs this theme. */
  private async screenshotDeck(
    themeId: string,
    slides: DeckSlide[],
    screenshotOpts?: RenderPptxOptions['screenshot'],
  ): Promise<Buffer[]> {
    const { html, selector, canvas } = this.buildDeckHtml(themeId, slides);
    const targetWidth = screenshotOpts?.width ?? PPTX_SCREENSHOT.width;
    const deviceScaleFactor =
      screenshotOpts?.deviceScaleFactor ?? Math.max(1, Math.round(targetWidth / canvas.width));
    return this.browser.screenshotSlides(html, {
      selector,
      width: canvas.width,
      height: canvas.height,
      deviceScaleFactor,
    });
  }

  async renderPptx(
    themeId: string,
    slides: DeckSlide[],
    options: RenderPptxOptions = {},
  ): Promise<RenderPptxResult> {
    const mode = options.mode ?? 'hybrid';
    const warnings: string[] = [];

    if (mode === 'pixelPerfect') {
      const images = await this.screenshotDeck(themeId, slides, options.screenshot);
      const result = await buildPixelPerfectPptx(images);
      if (options.debug) {
        this.logger.log(`PPTX debug: mode=pixelPerfect slides=${images.length} warnings=${JSON.stringify(result.warnings)}`);
      }
      return { buffer: result.buffer, mode: 'pixelPerfect', warnings: result.warnings };
    }

    if (mode === 'hybrid') {
      const images = await this.screenshotDeck(themeId, slides, options.screenshot);
      const result = await buildHybridPptx(images, slides, themeId);
      if (options.debug) {
        this.logger.log(`PPTX debug: mode=hybrid slides=${images.length} warnings=${JSON.stringify(result.warnings)}`);
      }
      return { buffer: result.buffer, mode: 'hybrid', warnings: result.warnings };
    }

    throw new Error(`Unsupported PPTX mode: ${String(mode)}`);
  }
}
