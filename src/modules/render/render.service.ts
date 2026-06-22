import { Injectable } from '@nestjs/common';
import { BrowserService } from './browser.service';
import { buildDeck, DeckSlide } from './templates/deck';
import { buildPptx } from './pptx/pptx.builder';

@Injectable()
export class RenderService {
  constructor(private readonly browser: BrowserService) {}

  async renderPdf(themeId: string, slides: DeckSlide[]): Promise<Buffer> {
    const html = buildDeck(themeId, slides);
    return this.browser.htmlToPdf(html);
  }

  async renderPptx(themeId: string, slides: DeckSlide[]): Promise<Buffer> {
    return buildPptx(themeId, slides);
  }
}
