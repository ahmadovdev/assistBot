import { Injectable } from '@nestjs/common';
import { BrowserService } from './browser.service';
import { buildDeck, DeckSlide } from './templates/deck';

@Injectable()
export class RenderService {
  constructor(private readonly browser: BrowserService) {}

  async renderPdf(themeId: string, slides: DeckSlide[]): Promise<Buffer> {
    const html = buildDeck(themeId, slides);
    return this.browser.htmlToPdf(html);
  }
}
