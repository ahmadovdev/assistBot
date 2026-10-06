// academic/tokens.ts
// Design tokens for the `modern_academic` theme (STITCH_PROMPT_KIT.md PART 1).
// Emits CSS custom properties + base/reset/canvas rules as one string, the same
// way templates/document.ts does for the legacy renderer. Renderers reference
// ONLY semantic vars (var(--accent)), never raw hex.
//
// Scope: ONE theme only (modern_academic). The other 4 Stitch themes (PART 3)
// are intentionally NOT implemented here. Token names are semantic so a future
// theme can be added by swapping the :root block alone.

/** Canvas per spec: 16:9, 1920x1080, 96px safe area, 8px baseline grid. */
export const ACADEMIC_CANVAS = { w: 1920, h: 1080, safe: 96 } as const;

/** Google Fonts import — Inter (UI/body, supports Uzbek diacritics oʻ gʻ ʻ)
 *  + PT Serif (editorial fallback). */
const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?" +
  'family=Inter:wght@400;500;600;700;800&' +
  "family=PT+Serif:ital@0;1&display=swap');";

/** The :root token block for modern_academic. Hex values are the single source
 *  of truth here; components must consume them via var(--*). */
const ROOT_TOKENS = `
:root {
  /* ---- Surfaces (spec §Color palette) ---- */
  --primary-dark:    #0f172a;
  --surface-base:    #ffffff;
  --surface-raised:  #f8fafc;
  --surface-sunken:  #f1f5f9;

  /* ---- Text ---- */
  --text-primary:    #0f172a;
  --text-secondary:  #475569;
  --text-muted:      #94a3b8;
  --text-on-dark:    #ffffff;

  /* ---- Accent (single accent per slide) ---- */
  --accent:          #10b981;
  --accent-strong:   #059669;
  --accent-deep:     #065f46;
  --accent-muted:    #d1fae5;

  /* ---- Borders ---- */
  --border:          #e2e8f0;
  --border-strong:   #cbd5e1;

  /* ---- Semantic status (problems / warnings / ref dots) ---- */
  --danger:          #dc2626;
  --danger-soft:     #fef2f2;
  --success-soft:    #f0fdf4;
  --warning:         #ea580c;
  --info:            #2563eb;
  --info-soft:       #dbeafe;

  /* ---- Typography ---- */
  --font-sans:  'Inter', system-ui, -apple-system, sans-serif;
  --font-serif: 'PT Serif', Georgia, serif;

  /* Type scale (px, 1920x1080 canvas) */
  --type-display-1: 128px; /* STATS big number */
  --type-display-2: 96px;  /* CLOSING / FINDING number */
  --type-hero:      72px;   /* TITLE topic / DEFINITION term */
  --type-h1:        56px;   /* main slide title (agenda/stats headers) */
  --type-h2:        48px;   /* standard content-slide title */
  --type-h3:        32px;   /* section header / quote */
  --type-h4:        24px;   /* subsection / callouts */
  --type-body:      20px;   /* body + bullets */
  --type-small:     16px;   /* small body / notes */
  --type-label:     14px;   /* meta / captions / source */
  --type-micro:     12px;   /* uppercase eyebrow labels */
  --type-nano:      10px;   /* ministry line on TITLE */

  --lh-tight: 1.1;
  --lh-snug:  1.25;
  --lh-body:  1.5;
  --lh-loose: 1.6;
  --ls-label: 0.15em;  /* uppercase meta tracking */
  --ls-tight: -0.02em; /* large titles */

  /* Spacing scale — 8px baseline grid */
  --space-1: 8px;
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 32px;
  --space-5: 40px;
  --space-6: 48px;
  --space-7: 56px;
  --space-8: 64px;
  --space-9: 80px;
  --space-10: 96px;

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;   /* pills */
  --radius-full: 999px;

  /* Stroke */
  --stroke-1: 1px;
  --stroke-2: 2px;
  --stroke-4: 4px;

  /* Canvas */
  --canvas-w: ${ACADEMIC_CANVAS.w}px;
  --canvas-h: ${ACADEMIC_CANVAS.h}px;
  --safe: ${ACADEMIC_CANVAS.safe}px;
}
`;

/** Reset + base element styles + deck/canvas/print rules. No shadows anywhere
 *  (spec: depth via border + surface only). */
const BASE_CSS = `
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
html, body {
  background: #64748b;
  -webkit-font-smoothing: antialiased;
  text-rendering: geometricPrecision;
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}
img, svg { display: block; max-width: 100%; }

body {
  font-family: var(--font-sans);
  color: var(--text-primary);
  font-feature-settings: 'cv11', 'ss01';
}

/* ---- Deck stage (screen preview: slides stacked) ---- */
.a-deck {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 48px;
  padding: 48px 0;
}

/* ---- Slide canvas: fixed 1920x1080, overflow clipped ---- */
.a-slide {
  position: relative;
  width: var(--canvas-w);
  height: var(--canvas-h);
  background: var(--surface-base);
  color: var(--text-primary);
  overflow: hidden;
  flex: none;
}

/* Safe-area content region (96px inset on all sides) */
.a-safe {
  position: absolute;
  inset: var(--safe);
  display: flex;
  flex-direction: column;
}

@page { size: ${ACADEMIC_CANVAS.w}px ${ACADEMIC_CANVAS.h}px; margin: 0; }
@media print {
  html, body { background: #fff; }
  .a-deck { gap: 0; padding: 0; }
  .a-slide { break-after: page; page-break-after: always; }
  .a-slide:last-child { break-after: auto; page-break-after: auto; }
}
`;

/** Full base stylesheet for the academic renderer: font import + tokens + base.
 *  Component CSS (components.ts) and slide CSS are concatenated after this. */
export function getAcademicBaseCss(): string {
  return `${FONT_IMPORT}\n${ROOT_TOKENS}\n${BASE_CSS}`;
}
