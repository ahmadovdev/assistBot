import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer, { Browser } from 'puppeteer';

@Injectable()
export class BrowserService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BrowserService.name);
  private browser?: Browser;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const executablePath = this.config.get<string>('app.render.puppeteerExecutablePath');
    this.browser = await puppeteer.launch({
      headless: true,
      executablePath: executablePath || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    this.logger.log('Puppeteer browser launched');
  }

  async onModuleDestroy(): Promise<void> {
    await this.browser?.close();
  }

  /** Render an HTML document to a PDF buffer (1280x720 pages). */
  async htmlToPdf(html: string): Promise<Buffer> {
    if (!this.browser) throw new Error('Browser not initialised');
    const page = await this.browser.newPage();
    try {
      await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 2 });
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 45000 });
      await page.evaluateHandle('document.fonts.ready');
      const pdf = await page.pdf({
        width: '1280px',
        height: '720px',
        printBackground: true,
        pageRanges: '',
      });
      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  }
}
