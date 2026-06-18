import { Injectable } from '@nestjs/common';
import { BrowserService } from './browser.service';
import { buildDocument, RenderSlide } from './templates/document';
import { resolveTheme } from './templates/theme';

@Injectable()
export class RenderService {
  constructor(private readonly browser: BrowserService) {}

  async renderPdf(themeConfig: unknown, slides: RenderSlide[]): Promise<Buffer> {
    const theme = resolveTheme(themeConfig);
    const html = buildDocument(theme, slides);
    return this.browser.htmlToPdf(html);
  }
}
