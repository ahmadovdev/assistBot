import {
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer, { Browser } from 'puppeteer';

@Injectable()
export class BrowserService implements OnModuleDestroy {
  private readonly logger = new Logger(BrowserService.name);
  private browser?: Browser;
  private launchPromise?: Promise<Browser>;

  constructor(private readonly config: ConfigService) {}

  private async getBrowser(): Promise<Browser> {
    if (this.browser?.connected) return this.browser;
    if (this.launchPromise) return this.launchPromise;

    const executablePath = this.config.get<string>('app.render.puppeteerExecutablePath');
    this.launchPromise = puppeteer
      .launch({
        headless: true,
        executablePath: executablePath || undefined,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      })
      .then((browser) => {
        this.browser = browser;
        this.browser.once('disconnected', () => {
          this.logger.warn('Puppeteer browser disconnected');
          this.browser = undefined;
          this.launchPromise = undefined;
        });
        this.logger.log('Puppeteer browser launched');
        return browser;
      })
      .catch((err) => {
        this.browser = undefined;
        this.launchPromise = undefined;
        throw err;
      });

    return this.launchPromise;
  }

  async onModuleDestroy(): Promise<void> {
    const browser = this.browser;
    this.browser = undefined;
    this.launchPromise = undefined;
    await browser?.close();
  }

  /** Render an HTML document to a PDF buffer. Defaults to 1280x720 pages
   *  (legacy renderer); the academic engine passes 1920x1080. */
  async htmlToPdf(
    html: string,
    size: { width: number; height: number } = { width: 1280, height: 720 },
  ): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
      await page.setViewport({ width: size.width, height: size.height, deviceScaleFactor: 2 });
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 45000 });
      await page.evaluateHandle('document.fonts.ready');
      const pdf = await page.pdf({
        width: `${size.width}px`,
        height: `${size.height}px`,
        printBackground: true,
        pageRanges: '',
      });
      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  }

  /**
   * Renders a full deck HTML document ONCE and screenshots every element
   * matching `selector` (one per slide) as a PNG — used by the PPTX
   * pixelPerfect/hybrid renderers. A single page load + N element
   * screenshots, not N full-deck page loads (avoids the "double-rendering
   * the whole deck per slide" cost).
   *
   * `deviceScaleFactor` is what actually controls output resolution here:
   * the HTML canvas is fixed-px (1280x720 legacy / 1920x1080 academic), so
   * e.g. deviceScaleFactor 2 on the 1280x720 canvas yields exactly the
   * 2560x1440 PPTX_SCREENSHOT default — no viewport size change needed.
   */
  async screenshotSlides(
    html: string,
    opts: { selector: string; width: number; height: number; deviceScaleFactor?: number },
  ): Promise<Buffer[]> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
      await page.setViewport({
        width: opts.width,
        height: opts.height,
        deviceScaleFactor: opts.deviceScaleFactor ?? 2,
      });
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 45000 });
      await page.evaluateHandle('document.fonts.ready');
      const elements = await page.$$(opts.selector);
      const buffers: Buffer[] = [];
      for (const el of elements) {
        const shot = await el.screenshot({ type: 'png' });
        buffers.push(Buffer.from(shot));
      }
      return buffers;
    } finally {
      await page.close();
    }
  }

}
