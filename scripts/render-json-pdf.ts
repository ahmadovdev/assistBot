import fs from 'node:fs/promises';
import path from 'node:path';
import { BrowserService } from '../src/modules/render/browser.service';
import { RenderService } from '../src/modules/render/render.service';

interface InputSlide {
  position?: number;
  layout?: string;
  type?: string;
  content?: unknown;
}

interface InputDeck {
  id?: string;
  theme?: string;
  language?: string;
  slides?: InputSlide[];
}

async function main(): Promise<void> {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3] ?? path.join(process.cwd(), 'previews', 'rendered-from-json.pdf');
  if (!inputPath) {
    throw new Error('Usage: pnpm exec ts-node scripts/render-json-pdf.ts <input.json> [output.pdf]');
  }

  const raw = await fs.readFile(inputPath, 'utf8');
  const deck = JSON.parse(raw) as InputDeck;
  const themeId = deck.theme || 'dark_premium';
  const slides = (deck.slides ?? [])
    .map((slide, index) => ({
      position: slide.position ?? index + 1,
      type: slide.layout ?? slide.type ?? 'CONTENT',
      content: slide.content ?? {},
    }))
    .sort((a, b) => a.position - b.position);

  if (!slides.length) throw new Error('No slides found in JSON');

  const config = {
    get(key: string) {
      if (key === 'app.render.puppeteerExecutablePath') return process.env.PUPPETEER_EXECUTABLE_PATH;
      if (key === 'app.render.engine') return undefined;
      return undefined;
    },
  };

  const browser = new BrowserService(config as any);
  const render = new RenderService(browser, config as any);

  try {
    const pdf = await render.renderPdf(themeId, slides);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, pdf);

    const renderedJsonPath = outputPath.replace(/\.pdf$/i, '.rendered.json');
    await fs.writeFile(
      renderedJsonPath,
      JSON.stringify({ id: deck.id, theme: themeId, slides }, null, 2),
    );

    console.log(JSON.stringify({
      outputPath,
      renderedJsonPath,
      bytes: pdf.length,
      slides: slides.length,
    }, null, 2));
  } finally {
    await browser.onModuleDestroy();
  }
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
