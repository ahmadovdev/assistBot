/**
 * Deterministic overflow QA for every slide type on the fixed 1280x720 canvas.
 *
 * For each SLIDE_TYPE it synthesises WORST-CASE content straight from the Zod
 * card schema (every string at its .max() length, every array at its max
 * count), runs it through the same layout-variant selection production uses,
 * renders the single slide with the real `buildDeck`, and measures whether
 * anything overflows/clips the 1280x720 box in a headless browser.
 *
 * Usage:  npx ts-node scripts/qa-overflow.ts [theme1,theme2,...]
 *   default themes: dark_premium
 *   e.g.  npx ts-node scripts/qa-overflow.ts dark_premium,soft_pastel
 *
 * Exit code is non-zero if any slide overflows — usable as a pre-launch gate.
 */
import { z } from 'zod';
import puppeteer from 'puppeteer';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { SLIDE_TYPES, SlideType } from '../src/modules/ai/layout.catalog';
import { cardSchemaByType } from '../src/modules/ai/schemas/card.schemas';
import { buildDeck } from '../src/modules/render/templates/deck';
import { buildPremiumAcademicDeck } from '../src/modules/render/premium_academic/deck';
import { buildSoftCurvesDeck } from '../src/modules/render/soft_curves/deck';
import { withSelectedLayout, createDeckState } from '../src/modules/render/templates/layout-registry';

const CANVAS = { width: 1280, height: 720 };
const OUT_DIR = join(process.cwd(), 'previews', 'qa');

/** Longest realistic filler of exactly `len` chars (spaces let text wrap). */
function filler(len: number): string {
  const word = 'Nafis ';
  return word.repeat(Math.ceil(len / word.length)).slice(0, len).trim();
}

/** Generate a worst-case (max-filling) instance of a Zod schema. */
function worstCase(schema: z.ZodTypeAny): unknown {
  const def = (schema as any)._def;
  switch (def?.typeName) {
    case 'ZodObject': {
      const shape = def.shape();
      const out: Record<string, unknown> = {};
      for (const key of Object.keys(shape)) out[key] = worstCase(shape[key]);
      return out;
    }
    case 'ZodString': {
      const max = (def.checks ?? []).find((c: any) => c.kind === 'max')?.value ?? 140;
      return filler(max);
    }
    case 'ZodNumber': {
      const max = (def.checks ?? []).find((c: any) => c.kind === 'max')?.value;
      return max ?? 987654;
    }
    case 'ZodBoolean':
      return true;
    case 'ZodEnum':
      return def.values[0];
    case 'ZodNativeEnum':
      return Object.values(def.values)[0];
    case 'ZodArray': {
      const n = def.maxLength?.value ?? def.exactLength?.value ?? def.minLength?.value ?? 4;
      return Array.from({ length: n }, () => worstCase(def.type));
    }
    case 'ZodOptional':
    case 'ZodNullable':
    case 'ZodDefault':
      return worstCase(def.innerType);
    case 'ZodEffects':
      return worstCase(def.schema);
    case 'ZodUnion':
      return worstCase(def.options[0]);
    case 'ZodLiteral':
      return def.value;
    default:
      return undefined;
  }
}

interface Row {
  theme: string;
  type: string;
  slideOverflowPx: number;
  clipped: string[];
  smallText: string[];
  ok: boolean;
}

function buildThemeDeck(theme: string, slides: Array<{ type: string; content: unknown }>): { html: string; selector: string } {
  if (theme === 'premium_academic') {
    return { html: buildPremiumAcademicDeck(theme, slides), selector: '.pa-slide' };
  }
  if (theme === 'soft_curves_research') {
    return { html: buildSoftCurvesDeck(theme, slides), selector: '.sc-slide' };
  }
  return { html: buildDeck(theme, slides), selector: '.slide' };
}

async function main(): Promise<void> {
  const themes = (process.argv[2] ?? 'dark_premium').split(',').map((s) => s.trim());
  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ ...CANVAS, deviceScaleFactor: 1 });

  const rows: Row[] = [];

  for (const theme of themes) {
    const deckState = createDeckState();
    for (const type of SLIDE_TYPES as readonly SlideType[]) {
      let content = worstCase(cardSchemaByType[type]) as Record<string, unknown>;
      try {
        content = withSelectedLayout(type, content, theme, deckState) as Record<string, unknown>;
      } catch {
        /* some types have no registry — keep raw worst-case content */
      }

      const { html, selector } = buildThemeDeck(theme, [{ type, content }]);
      await page.setContent(html, { waitUntil: 'load' });

      // Tolerance: only content whose box extends this many px past the slide
      // edge counts as overflow (absorbs sub-pixel rounding at the boundary).
      const ELEM_TOL = 6;

      const measure = await page.evaluate((args: { elemTol: number; selector: string; type: string }) => {
        const slide = document.querySelector(args.selector) as HTMLElement | null;
        if (!slide) return { found: false, slideOverflowPx: 0, clipped: [] as string[], smallText: [] as string[] };
        const box = slide.getBoundingClientRect();

        // Measure REAL laid-out position of every in-flow element against the
        // fixed slide box. getBoundingClientRect reports the true rect even when
        // an ancestor's overflow:hidden clips it, and even when align/justify
        // center pushes content past an edge — so this catches clipped AND
        // centered-overflow that scrollHeight misses. Absolute/fixed decorative
        // layers (halos, glows, grids) bleed by design and are excluded.
        let slideOverflowPx = 0;
        const clipped: string[] = [];
        const smallText: string[] = [];
        const MIN_BODY_FONT = 16.5;
        const MIN_CONTENT_TEXT_LEN = 34;
        const chromeRe = /(label|kicker|footer|source|slide-no|page|num|number|marker|icon|date|unit|micro|rail|stamp|core|axis|orb|halo|titul|cover-meta|meta|limitation|caveat|src)/i;
        slide.querySelectorAll<HTMLElement>('*').forEach((el) => {
          const s = getComputedStyle(el);
          if (s.position === 'absolute' || s.position === 'fixed') return;
          if (s.display === 'none' || s.visibility === 'hidden') return;
          const r = el.getBoundingClientRect();
          if (r.width < 1 || r.height < 1) return;
          const cls = (el.className || el.tagName).toString().split(' ').slice(0, 2).join('.');
          const over = Math.max(
            r.bottom - box.bottom,
            box.top - r.top,
            r.right - box.right,
            box.left - r.left,
          );
          if (over > args.elemTol) {
            slideOverflowPx = Math.max(slideOverflowPx, over);
            clipped.push(`${cls}(+${Math.round(over)})`);
          }
          const directText = Array.from(el.childNodes)
            .filter((node) => node.nodeType === Node.TEXT_NODE)
            .map((node) => node.textContent ?? '')
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          const text = directText || (el.children.length === 0 ? (el.textContent ?? '').replace(/\s+/g, ' ').trim() : '');
          if (args.type !== 'TITLE' && text.length >= MIN_CONTENT_TEXT_LEN && !chromeRe.test(cls)) {
            const fontPx = Number.parseFloat(s.fontSize);
            if (fontPx > 0 && fontPx < MIN_BODY_FONT) {
              smallText.push(`${cls}(${fontPx.toFixed(1)}px)`);
            }
          }
        });
        return {
          found: true,
          slideOverflowPx: Math.round(slideOverflowPx),
          clipped: clipped.slice(0, 5),
          smallText: smallText.slice(0, 5),
        };
      }, { elemTol: ELEM_TOL, selector, type });

      const ok = measure.found && measure.clipped.length === 0 && measure.smallText.length === 0;
      rows.push({ theme, type, slideOverflowPx: measure.slideOverflowPx, clipped: measure.clipped, smallText: measure.smallText, ok });

      if (!ok) {
        await page.screenshot({ path: join(OUT_DIR, `FAIL_${theme}_${type}.png`) as `${string}.png` });
      }
    }
  }

  await browser.close();

  // Report
  const fails = rows.filter((r) => !r.ok);
  console.log(`\n=== Overflow QA — ${rows.length} slides across ${themes.length} theme(s) ===`);
  for (const r of rows) {
    const status = r.ok ? 'PASS' : 'FAIL';
    const parts = [
      r.slideOverflowPx > 0 ? `overflow=${r.slideOverflowPx}px ${r.clipped.join(' ')}` : '',
      r.smallText.length ? `smallText=${r.smallText.join(' ')}` : '',
    ].filter(Boolean).join('  ');
    const detail = r.ok ? '' : `  ${parts}`;
    console.log(`${status}  ${r.theme.padEnd(16)} ${r.type.padEnd(20)}${detail}`);
  }
  console.log(`\n${rows.length - fails.length}/${rows.length} passed.`);
  if (fails.length) {
    console.log(`Screenshots of failures in: ${OUT_DIR}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
