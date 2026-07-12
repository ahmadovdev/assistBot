// pptx.text-fit.ts
// THE fix for "sochilib ketmoqda" (PPTX text overflowing/scattering): the old
// pptx.builder.ts renderers use FIXED box heights and FIXED font sizes
// regardless of actual text length (e.g. rDefinition's definition box is
// always h:1.3in; rConclusion/rContent/rAimTasks/etc. divide the available
// height evenly by item count — `rowH = avail / items.length` — so one long
// item and one short item get the same box). PowerPoint does not auto-shrink
// text to fit a box by default, so long AI-generated Uzbek text (which runs
// longer than English — same words carry more characters) silently overflows.
//
// This module estimates rendered text height WITHOUT a live PowerPoint/
// Puppeteer instance (pptxgenjs has no text-measurement API), using an
// average-character-width heuristic, then shrinks the font size (once) or
// truncates when the estimate says text won't fit the given box.

export interface EstimateTextHeightOptions {
  fontSize: number;
  boxWidth: number; // inches
  lineHeight?: number;
  /** Average glyph width as a fraction of font size (in inches at 72pt/in).
   *  ~0.48 fits Calibri/Georgia body text reasonably; bold/serif headings
   *  run a bit wider — callers can pass a higher factor for those. */
  avgCharWidthFactor?: number;
}

/** Approximate rendered height (inches) of `text` wrapped inside a box of
 *  `boxWidth` inches, at `fontSize` pt. Deliberately conservative (slightly
 *  over-estimates) — better to shrink text a bit early than to overflow. */
export function estimateTextHeight(text: string, opts: EstimateTextHeightOptions): number {
  const clean = String(text ?? '').trim();
  if (!clean) return 0;
  const avgCharWidthIn = (opts.fontSize / 72) * (opts.avgCharWidthFactor ?? 0.48);
  const charsPerLine = Math.max(8, Math.floor(opts.boxWidth / avgCharWidthIn));
  // Count explicit line breaks too — multi-paragraph fields (rare here, but
  // bullet lists built with breakLine runs pass one item at a time) still
  // need each hard break counted as at least one line.
  const paragraphs = clean.split('\n');
  let lines = 0;
  for (const p of paragraphs) {
    lines += Math.max(1, Math.ceil(p.length / charsPerLine));
  }
  return lines * (opts.fontSize / 72) * (opts.lineHeight ?? 1.22);
}

export interface FitTextResult {
  fontSize: number;
  text: string;
  truncated: boolean;
  shrunk: boolean;
  /** Height actually used at the returned fontSize/text — always <= boxHeight
   *  (or the closest achievable value when even min font + truncation still
   *  slightly overflows an extremely small box). */
  estimatedHeight: number;
}

export interface FitTextToBoxOptions extends EstimateTextHeightOptions {
  boxHeight: number; // inches
  minFontSize?: number; // floor for shrink-once, default fontSize * 0.7
  fitPolicy?: 'fixed' | 'shrink-once' | 'truncate';
}

/**
 * Fits `text` into a box: for 'shrink-once', tries progressively smaller
 * font sizes (in 1pt steps) down to `minFontSize` before giving up; for
 * 'truncate', keeps the original font size and cuts text with an ellipsis
 * once it no longer fits; for 'fixed', never changes anything (caller has
 * already sized the box safely, e.g. a single short label).
 * Never throws — worst case returns the min-font/most-truncated candidate,
 * which the caller should treat as "still overflowing" (see
 * pptx.layout.ts's validateSlidePlan as the safety-net check).
 */
export function fitTextToBox(text: string, opts: FitTextToBoxOptions): FitTextResult {
  const clean = String(text ?? '').trim();
  const policy = opts.fitPolicy ?? 'shrink-once';
  const baseHeight = estimateTextHeight(clean, opts);

  if (policy === 'fixed' || baseHeight <= opts.boxHeight) {
    return { fontSize: opts.fontSize, text: clean, truncated: false, shrunk: false, estimatedHeight: baseHeight };
  }

  if (policy === 'shrink-once') {
    const minSize = opts.minFontSize ?? Math.max(8, Math.round(opts.fontSize * 0.7));
    for (let size = opts.fontSize - 1; size >= minSize; size--) {
      const h = estimateTextHeight(clean, { ...opts, fontSize: size });
      if (h <= opts.boxHeight) {
        return { fontSize: size, text: clean, truncated: false, shrunk: true, estimatedHeight: h };
      }
    }
    // Still doesn't fit at the floor size — fall through to truncation at
    // the minimum size rather than silently overflowing.
    const truncated = truncateForHeight(clean, { ...opts, fontSize: minSize });
    return {
      fontSize: minSize,
      text: truncated,
      truncated: true,
      shrunk: true,
      estimatedHeight: estimateTextHeight(truncated, { ...opts, fontSize: minSize }),
    };
  }

  // policy === 'truncate'
  const truncated = truncateForHeight(clean, opts);
  return {
    fontSize: opts.fontSize,
    text: truncated,
    truncated: true,
    shrunk: false,
    estimatedHeight: estimateTextHeight(truncated, opts),
  };
}

/** Binary-search-ish shrink of the string length until it fits `boxHeight`
 *  at the given fontSize, appending an ellipsis. */
function truncateForHeight(text: string, opts: FitTextToBoxOptions): string {
  if (estimateTextHeight(text, opts) <= opts.boxHeight) return text;
  let lo = 0, hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const candidate = text.slice(0, mid).trim() + '…';
    if (estimateTextHeight(candidate, opts) <= opts.boxHeight) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return lo > 0 ? text.slice(0, lo).trim() + '…' : '…';
}

export interface FitRowsOptions {
  fontSize: number;
  boxWidth: number;
  totalHeight: number;
  startY: number;
  gap?: number;
  lineHeight?: number;
  minFontSize?: number;
}

export interface FitRowsResult {
  fontSize: number;
  positions: { y: number; h: number }[];
}

/**
 * THE fix for pptx.builder.ts's systemic `rowH = avail / items.length`
 * pattern (rContent/rConclusion/rAimTasks/rProcess/
 * rTimeline/rProblemsSolutions/rFinding/rRelevance all divide available
 * height EQUALLY regardless of each item's actual text length — so a
 * 150-char point and a 20-char point get the same box, and the long one
 * overflows while the short one wastes space).
 *
 * Instead: measure each item's NATURAL height at the preferred font size:
 * if they all fit within `totalHeight` stacked with `gap` between them, use
 * that font size as-is (items keep their own natural height, not a forced
 * equal share). If the sum overflows, shrink the font size for ALL items
 * together (one shared size, not per-item — keeps a uniform, professional
 * look across the list) until they fit, down to `minFontSize`.
 */
export function fitRowsToHeight(items: string[], opts: FitRowsOptions): FitRowsResult {
  const gap = opts.gap ?? 0.15;
  const minFontSize = opts.minFontSize ?? Math.max(8, Math.round(opts.fontSize * 0.65));
  const n = items.length || 1;

  let fontSize = opts.fontSize;
  for (; fontSize >= minFontSize; fontSize--) {
    const heights = items.map((it) =>
      Math.max(0.32, estimateTextHeight(it, { fontSize, boxWidth: opts.boxWidth, lineHeight: opts.lineHeight })),
    );
    const total = heights.reduce((a, b) => a + b, 0) + gap * Math.max(0, n - 1);
    if (total <= opts.totalHeight || fontSize === minFontSize) {
      const positions: { y: number; h: number }[] = [];
      let y = opts.startY;
      for (const h of heights) {
        positions.push({ y, h });
        y += h + gap;
      }
      return { fontSize, positions };
    }
  }
  // Unreachable (loop always returns at fontSize === minFontSize), kept for
  // type-completeness / to satisfy strict control-flow analysis.
  return { fontSize: minFontSize, positions: items.map((_, i) => ({ y: opts.startY + i * 0.4, h: 0.4 })) };
}
