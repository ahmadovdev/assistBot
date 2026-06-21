// document.ts
// Generates the complete global CSS string for one theme.
// Inline this into a <style> tag in your HTML document.

import { Theme, getTheme } from './theme';

function buildFontImport(theme: Theme): string {
  // Deduplicate families across display + body
  const families = new Set<string>();
  const want = (name: string) =>
    theme.fonts.display === name || theme.fonts.body === name;

  if (want('Inter'))             families.add('Inter:wght@300;400;500;600;700;800;900');
  if (want('IBM Plex Sans'))     families.add('IBM+Plex+Sans:wght@400;500;600;700');
  if (want('Space Grotesk'))     families.add('Space+Grotesk:wght@400;500;600;700');
  if (want('DM Serif Display'))  families.add('DM+Serif+Display:ital@0;1');

  const params = [...families].map(f => `family=${f}`).join('&');
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

export function getDocumentCss(themeId: string): string {
  const t = getTheme(themeId);
  const c = t.colors;
  const f = t.fonts;
  const r = t.radius;
  const fontUrl = buildFontImport(t);

  return `
@import url('${fontUrl}');

/* ============================================================
   RESET + PRINT COLOR PRESERVATION
   ============================================================ */
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
html, body {
  background: #555;
  -webkit-font-smoothing: antialiased;
  text-rendering: geometricPrecision;
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}
img, svg { display: block; max-width: 100%; }

/* ============================================================
   THEME TOKENS
   ============================================================ */
:root {
  --bg: ${c.bg};
  --surface: ${c.surface};
  --text: ${c.text};
  --text-muted: ${c.textMuted};
  --accent: ${c.accent};
  --accent-soft: ${c.accentSoft};
  --border: ${c.border};

  --font-display: '${f.display}', system-ui, sans-serif;
  --font-body: '${f.body}', system-ui, sans-serif;

  --radius-sm: ${r.sm};
  --radius-md: ${r.md};
  --radius-lg: ${r.lg};

  --pad-x: 96px;
  --pad-y: 72px;
}

body { font-family: var(--font-body); color: var(--text); }

/* ============================================================
   DECK STAGE + PRINT (1 slide per PDF page)
   ============================================================ */
.deck {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  padding: 40px 0;
}
@page { size: 1280px 720px; margin: 0; }
@media print {
  body { background: #fff; padding: 0; }
  .deck { gap: 0; padding: 0; }
  .slide {
    box-shadow: none;
    break-after: page;
    page-break-after: always;
  }
  .slide:last-child { break-after: auto; page-break-after: auto; }
}

/* ============================================================
   SLIDE CONTAINER  (1280 x 720, overflow hidden)
   ============================================================ */
.slide {
  width: 1280px;
  height: 720px;
  overflow: hidden;
  position: relative;
  display: block;
  background: var(--bg);
  color: var(--text);
  box-shadow: 0 20px 60px rgba(0,0,0,0.35);
}
.slide__visual {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}
.slide > *:not(.slide__visual):not(.page-no):not(.theme-tag) {
  position: relative;
  z-index: 1;
}

/* ============================================================
   CORNER LABELS  (page number + theme tag)
   ============================================================ */
.page-no, .theme-tag {
  position: absolute;
  bottom: 28px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  z-index: 50;
}
.page-no  { left: 36px; }
.theme-tag {
  right: 36px;
  display: flex;
  align-items: center;
  gap: 8px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
}
.theme-tag__dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--accent);
}

/* ============================================================
   TYPOGRAPHY SCALE
   ============================================================ */
.h1 {
  font-family: var(--font-display);
  font-size: 76px; font-weight: 700;
  line-height: 1.02; letter-spacing: -0.02em;
  color: var(--text);
}
.h2 {
  font-family: var(--font-display);
  font-size: 44px; font-weight: 700;
  line-height: 1.08; letter-spacing: -0.02em;
  color: var(--text);
}
.h3 {
  font-family: var(--font-display);
  font-size: 24px; font-weight: 700;
  line-height: 1.2;  letter-spacing: -0.01em;
  color: var(--text);
}
.lead { font-size: 21px; line-height: 1.5; font-weight: 400; color: var(--text-muted); }
.text { font-size: 16px; line-height: 1.55; color: var(--text); }
.text--sm { font-size: 14px; line-height: 1.5; }
.muted  { color: var(--text-muted); }
.accent { color: var(--accent); }
.kicker {
  font-size: 13px; font-weight: 700;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--accent);
}

/* ============================================================
   PRIMITIVES
   ============================================================ */
.tag {
  display: inline-block;
  font-size: 12px; font-weight: 600;
  letter-spacing: 0.14em; text-transform: uppercase;
  padding: 7px 14px;
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--accent);
  border: 1px solid var(--border);
}
.divider { height: 1px; background: var(--border); width: 100%; }
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 32px;
}
.btn {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 16px 28px;
  border-radius: var(--radius-md);
  font-size: 15px; font-weight: 600;
  font-family: var(--font-body);
}
.btn--primary   { background: var(--accent); color: var(--bg); }
.btn--secondary { background: transparent; color: var(--text); border: 1px solid var(--border); }

/* ============================================================
   GRID HELPERS
   ============================================================ */
.row { display: flex; gap: 24px; align-items: flex-start; }
.col { display: flex; flex-direction: column; gap: 16px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr;             gap: 24px; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr);     gap: 24px; }
.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr);     gap: 24px; }
.grid-5 { display: grid; grid-template-columns: repeat(5, 1fr);     gap: 20px; }

/* ============================================================
   METRICS
   ============================================================ */
.metric { display: flex; flex-direction: column; gap: 14px; }
.metric__num {
  font-family: var(--font-display);
  font-size: 64px; font-weight: 700;
  letter-spacing: -0.03em; line-height: 1;
  color: var(--text);
}
.metric__lbl { font-size: 15px; color: var(--text-muted); line-height: 1.5; }

/* ============================================================
   STEPS  (used by process + timeline)
   ============================================================ */
.step {
  display: flex; flex-direction: column; gap: 14px;
  padding: 28px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}
.step__node {
  width: 44px; height: 44px;
  border-radius: 50%;
  display: grid; place-items: center;
  background: var(--accent); color: var(--bg);
  font-family: var(--font-display);
  font-weight: 700; font-size: 18px;
}
.step__date {
  font-size: 12px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--text-muted);
}
.step__title { font-size: 20px; font-weight: 700; letter-spacing: -0.01em; color: var(--text); }
.step__body  { font-size: 14px; color: var(--text-muted); line-height: 1.55; }

/* ============================================================
   COMPARISON
   ============================================================ */
.compare { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.compare__col {
  padding: 32px;
  border-radius: var(--radius-lg);
  display: flex; flex-direction: column; gap: 20px;
}
.compare__col--now  { background: var(--surface); border: 1px solid var(--border); color: var(--text-muted); }
.compare__col--next { background: var(--accent);  color: var(--bg); }
.compare__list { list-style: none; display: flex; flex-direction: column; gap: 12px; }
.compare__list li { display: flex; gap: 12px; font-size: 15.5px; line-height: 1.5; }

/* ============================================================
   QUOTE
   ============================================================ */
.quote { display: grid; gap: 32px; align-content: center; }
.quote__mark {
  font-family: var(--font-display);
  font-size: 140px; line-height: 0.5;
  color: var(--accent);
}
.quote__body {
  font-family: var(--font-display);
  font-size: 44px; font-weight: 500;
  line-height: 1.18; letter-spacing: -0.015em;
  max-width: 1020px;
  color: var(--text);
}
.quote__attr {
  display: flex; align-items: center; gap: 18px;
  padding-top: 24px; border-top: 1px solid var(--border);
}
.quote__av {
  width: 52px; height: 52px; border-radius: 50%;
  background: var(--accent); color: var(--bg);
  display: grid; place-items: center;
  font-family: var(--font-display);
  font-weight: 700; font-size: 18px;
}
.quote__who b { display: block; font-size: 16px; font-weight: 600; color: var(--text); }
.quote__who span { font-size: 14px; color: var(--text-muted); }

/* ============================================================
   COMMON LAYOUT BLOCKS
   ============================================================ */
.title-block {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100%;
  padding: var(--pad-y) var(--pad-x);
}
.title-block__center { align-self: center; max-width: 920px; display: flex; flex-direction: column; gap: 24px; }
.title-block__meta {
  display: flex; gap: 48px;
  padding-top: 26px; border-top: 1px solid var(--border);
  font-size: 14px; color: var(--text-muted);
}
.title-block__meta b { color: var(--text); font-weight: 600; display: block; margin-bottom: 4px; }

.content-block {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100%;
  gap: 40px;
  padding: var(--pad-y) var(--pad-x);
}
.content-block__head { max-width: 920px; }
.content-block__body { align-self: center; }

/* ============================================================
   STYLE OVERRIDES - applied via .style-{name} on the slide
   ============================================================ */

/* MINIMAL --------------------------------------------------- */
.style-minimal .kicker { display: flex; align-items: center; gap: 16px; }
.style-minimal .kicker::after { content: ""; flex: 1; height: 1px; background: var(--border); }
.style-minimal .card { box-shadow: none; }
.style-minimal .step {
  background: transparent;
  border: none;
  border-top: 2px solid var(--accent);
  border-radius: 0;
  padding: 26px 0 0 0;
}
.style-minimal .step__node { display: none; }
.style-minimal .compare__col--next { background: transparent; color: var(--text); border-top: 2px solid var(--accent); border-radius: 0; padding: 28px 0 0 0; }
.style-minimal .compare__col--now  { background: transparent; border: none; border-top: 1px solid var(--border); border-radius: 0; padding: 28px 0 0 0; }

/* DARK ----------------------------------------------------- */
.style-dark.slide,
.style-dark .slide {
  background:
    radial-gradient(900px 600px at 78% -10%, rgba(124,92,255,0.22), transparent 60%),
    radial-gradient(700px 500px at 8% 110%,  rgba(0,212,255,0.14), transparent 55%),
    var(--bg);
}
.style-dark .h1 { font-size: 84px; font-weight: 800; letter-spacing: -0.035em; }
.style-dark .h2 { font-weight: 800; letter-spacing: -0.025em; }
.style-dark .grad,
.style-dark .h1 .grad,
.style-dark .h2 .grad {
  background: linear-gradient(92deg, var(--accent), var(--accent-soft));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.style-dark .card {
  backdrop-filter: blur(6px);
  position: relative; overflow: hidden;
}
.style-dark .card::before {
  content: ""; position: absolute; inset: 0;
  border-radius: inherit; pointer-events: none;
  background: linear-gradient(135deg, rgba(124,92,255,0.12), transparent 45%);
}
.style-dark .step {
  background: var(--surface);
  position: relative; overflow: hidden;
}
.style-dark .step__node {
  background: var(--bg);
  border: 2px solid var(--accent);
  color: var(--text);
  box-shadow: 0 0 18px rgba(124,92,255,0.6);
}
.style-dark .btn--primary {
  background: linear-gradient(135deg, var(--accent), var(--accent-soft));
  color: #fff;
}
.style-dark .tag {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--accent-soft);
}

/* EDITORIAL ------------------------------------------------ */
.style-editorial .h1 { font-size: 96px; line-height: 0.92; letter-spacing: -0.025em; }
.style-editorial .h1 .hl,
.style-editorial .h2 .hl {
  background: var(--accent);
  padding: 0 10px;
  color: var(--text);
}
.style-editorial .tag {
  background: transparent;
  border: 2px solid var(--text);
  color: var(--text);
  font-family: var(--font-display);
  border-radius: 0;
}
.style-editorial .card { border: 3px solid var(--text); border-radius: 0; }
.style-editorial .step { border: 3px solid var(--text); border-radius: 0; }
.style-editorial .step__node {
  background: var(--accent); color: var(--text);
  border: 3px solid var(--text);
}
.style-editorial .btn--primary {
  background: var(--text); color: var(--accent);
  border-radius: 0;
  font-family: var(--font-display);
  text-transform: uppercase; letter-spacing: 0.08em;
}
.style-editorial .divider { background: var(--text); height: 3px; }
.style-editorial .compare__col--next { background: var(--accent); color: var(--text); border: 3px solid var(--text); border-radius: 0; }
.style-editorial .compare__col--now  { background: var(--bg); border: 3px solid var(--text); border-radius: 0; color: var(--text); }

/* PASTEL --------------------------------------------------- */
.style-pastel .h1 { font-size: 86px; font-weight: 400; }
.style-pastel .h2 { font-weight: 400; }
.style-pastel .h1 em,
.style-pastel .h2 em {
  font-style: italic;
  color: var(--accent);
}
.style-pastel .kicker {
  display: inline-block;
  background: var(--surface);
  border-radius: 999px;
  padding: 10px 20px;
  font-size: 13px; letter-spacing: 0.1em;
  color: var(--text-muted);
  box-shadow: 0 8px 22px rgba(0,0,0,0.06);
}
.style-pastel .card,
.style-pastel .step {
  background: var(--surface);
  border: none;
  box-shadow: 0 14px 34px rgba(0,0,0,0.06);
}
.style-pastel .step__node {
  background: var(--accent);
  font-family: var(--font-display);
  font-weight: 400;
  color: #fff;
}
.style-pastel .btn--primary {
  background: var(--text); color: var(--bg);
  border-radius: 999px;
}
.style-pastel .compare__col--next { background: var(--accent-soft); color: #fff; border-radius: var(--radius-lg); }
.style-pastel .compare__col--now  { background: var(--surface); border: none; box-shadow: 0 14px 34px rgba(0,0,0,0.06); color: var(--text-muted); }

/* BENTO ---------------------------------------------------- */
.style-bento .h1 { font-size: 64px; font-weight: 700; letter-spacing: -0.035em; }
.style-bento .h2 { font-weight: 700; letter-spacing: -0.025em; }
.style-bento .metric__num { font-weight: 800; }
.style-bento .card { border: 1px solid var(--border); }
.style-bento .step { border: 1px solid var(--border); border-radius: var(--radius-lg); }
.style-bento .btn--primary {
  background: var(--text); color: var(--bg);
  border-radius: 999px;
}
.style-bento .compare__col--now  { background: var(--surface); border: 1px solid var(--border); color: var(--text-muted); }
.style-bento .compare__col--next { background: var(--text); color: #fff; border: none; }
`;
}
