import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrowserService } from './browser.service';
import { buildDeck, DeckSlide } from './templates/deck';
import { buildAcademicDeck } from './academic/deck';
import { buildPremiumAcademicDeck } from './premium_academic/deck';
import { buildSoftCurvesDeck } from './soft_curves/deck';
import { buildPptx } from './pptx/pptx.builder';
import { buildEditablePptx } from './pptx/pptx.editable';
import { buildPixelPerfectPptx } from './pptx/pptx.pixel-perfect';
import { buildHybridPptx } from './pptx/pptx.hybrid';
import { PPTX_SCREENSHOT } from './pptx/pptx.constants';
import { checkRenderContract, formatRenderContractIssues } from './render-contract';

export type PptxRenderMode = 'pixelPerfect' | 'editable' | 'hybrid';

export interface RenderPptxOptions {
  mode?: PptxRenderMode;
  screenshot?: {
    width?: number;
    height?: number;
    deviceScaleFactor?: number;
  };
  editableText?: boolean;
  debug?: boolean;
}

export interface RenderPptxResult {
  buffer: Buffer;
  mode: PptxRenderMode;
  warnings: string[];
  /** Set when hybrid silently fell back to pixelPerfect. */
  fallbackReason?: string;
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
      this.warnRenderContract(themeId, slides, html);
      return this.browser.htmlToPdf(html, { width: 1920, height: 1080 });
    }
    if (this.usePremiumAcademic(themeId)) {
      const html = buildPremiumAcademicDeck(themeId, slides);
      this.warnRenderContract(themeId, slides, html);
      return this.browser.htmlToPdf(html);
    }
    if (this.useSoftCurves(themeId)) {
      const html = buildSoftCurvesDeck(themeId, slides);
      this.warnRenderContract(themeId, slides, html);
      return this.browser.htmlToPdf(html);
    }
    const html = buildDeck(themeId, slides);
    this.warnRenderContract(themeId, slides, html);
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

  private warnRenderContract(themeId: string, slides: DeckSlide[], html: string): void {
    const issues = checkRenderContract(slides, html);
    if (!issues.length) return;
    const sample = formatRenderContractIssues(issues).slice(0, 12).join('; ');
    this.logger.warn(
      `Render contract warnings for theme=${themeId}: ${issues.length} generated text fields not found in HTML. ${sample}`,
    );
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
    this.warnRenderContract(themeId, slides, html);
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
      try {
        const images = await this.screenshotDeck(themeId, slides, options.screenshot);
        const result = await buildHybridPptx(images, slides, themeId);
        if (options.debug) {
          this.logger.log(`PPTX debug: mode=hybrid slides=${images.length} warnings=${JSON.stringify(result.warnings)}`);
        }
        return { buffer: result.buffer, mode: 'hybrid', warnings: result.warnings };
      } catch (e) {
        // Hybrid is explicitly allowed to fall back to pixelPerfect — visual
        // quality must never be worse than pixelPerfect just because the
        // (newer, less-tested) hybrid path hit a snag.
        const reason = String(e);
        this.logger.warn(`Hybrid PPTX failed, falling back to pixelPerfect: ${reason}`);
        const images = await this.screenshotDeck(themeId, slides, options.screenshot);
        const result = await buildPixelPerfectPptx(images);
        return { buffer: result.buffer, mode: 'pixelPerfect', warnings: result.warnings, fallbackReason: reason };
      }
    }

    // mode === 'editable': layout-plan + text-fit pipeline for the 8
    // highest-overflow-risk types, original hand-tuned renderer for the
    // rest (see pptx.editable.ts's MIGRATED_TYPES). Falls back to the
    // original buildPptx() wholesale if the new pipeline throws — the old
    // path stays available exactly as the acceptance criteria require.
    try {
      const result = await buildEditablePptx(themeId, slides);
      if (options.debug) {
        this.logger.log(`PPTX debug: mode=editable slides=${slides.length} warnings=${JSON.stringify(result.warnings)}`);
      }
      return { buffer: result.buffer, mode: 'editable', warnings: result.warnings };
    } catch (e) {
      const reason = String(e);
      this.logger.warn(`Editable (layout-plan) PPTX failed, falling back to legacy buildPptx: ${reason}`);
      const buffer = await buildPptx(themeId, slides);
      return { buffer, mode: 'editable', warnings, fallbackReason: reason };
    }
  }
}
