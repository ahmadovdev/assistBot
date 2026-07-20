// premium_academic/tokens.ts
// Design tokens + base/reset/canvas + shared typography/primitive CSS for the
// `premium_academic` theme — a cream-paper, serif-titled academic look
// (grid-line watermark, navy/gold accents). Ported from a user-supplied
// static HTML design (21 example slides); this file holds everything that
// applies ACROSS slide types (variables, reset, `.slide` canvas, typography
// scale, `.card`/`.grid-*`/`.pill`/`.marker`/`.table`/`.callout`/etc.).
// Per-type layout CSS (`.cover-grid`, `.agenda-list`, ...) lives in slides.ts.
//
// Same string-emitting convention as templates/document.ts and
// academic/tokens.ts: one function returning a CSS string, consumed by deck.ts.

/** Canvas: 16:9, 1280x720 — matches the classic (non-modern_academic) engine,
 *  so the shared screenshot/PPTX pipeline in render.service.ts needs no new
 *  canvas-size branch beyond routing. */
export const PREMIUM_ACADEMIC_CANVAS = { w: 1280, h: 720 } as const;

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?" +
  'family=Inter:wght@400;500;600;700;800&display=swap\');';

export function getPremiumAcademicBaseCss(): string {
  return `
${FONT_IMPORT}

:root {
  --paper: #f7f4ee;
  --paper-2: #fbfaf7;
  --ink: #17191d;
  --ink-soft: #2c3037;
  --muted: #6f7682;
  --muted-2: #9aa1aa;
  --rule: #d9d6ce;
  --rule-strong: #bbb7ad;

  --blue: #173b67;
  --indigo: #35436f;
  --teal: #174f55;
  --steel: #6d8199;
  --gold: #b59a5b;
  --gold-soft: #e8ddc0;

  --success: #244f44;
  --problem: #6a2d2a;

  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;

  --shadow-soft: 0 18px 45px rgba(24, 28, 34, 0.08);
  --shadow-card: 0 8px 24px rgba(24, 28, 34, 0.055);

  --font-title: Georgia, 'Times New Roman', serif;
  --font-body: Inter, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;

  --m: 58px;
  --gap: 20px;
  --gap-lg: 32px;

  --kicker: 12px;
  --body: 21px;
  --small: 17px;
  --micro: 13px;
  --title: 54px;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.pa-deck { display: flex; flex-direction: column; align-items: center; gap: 0; }

.pa-slide {
  width: ${PREMIUM_ACADEMIC_CANVAS.w}px;
  height: ${PREMIUM_ACADEMIC_CANVAS.h}px;
  position: relative;
  overflow: hidden;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-body);
  isolation: isolate;
}

.pa-slide::before {
  content: "";
  position: absolute;
  left: 58px;
  top: 0;
  width: 160px;
  height: 100%;
  pointer-events: none;
  border-left: 1px solid rgba(23,59,103,0.035);
  border-right: 1px solid rgba(23,59,103,0.025);
  z-index: -2;
}

.pa-slide::after {
  content: "";
  position: absolute;
  left: var(--m);
  right: var(--m);
  bottom: 38px;
  height: 1px;
  background: rgba(23,25,29,0.08);
}

.pa-inner {
  position: absolute;
  inset: var(--m);
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 22px;
}

/* Single occupant of the middle 1fr row (see components.ts frame()) — top-
   anchored block flow, never centers short content in the leftover space. */
.pa-body {
  min-height: 0;
  overflow: hidden;
}

.pa-kicker {
  font-size: var(--kicker);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--blue);
  font-weight: 700;
}

.pa-kicker-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--muted);
}

.pa-slide-no {
  font-size: 12px;
  color: var(--muted-2);
  letter-spacing: 0.08em;
}

.pa-title-serif {
  font-family: var(--font-title);
  font-weight: 500;
  letter-spacing: 0;
  line-height: 0.98;
}

.pa-title-main {
  font-family: var(--font-title);
  font-weight: 500;
  font-size: var(--title);
  letter-spacing: 0;
  line-height: 1.04;
  max-width: 970px;
}

.pa-subtitle { color: var(--muted); font-size: 21px; line-height: 1.45; max-width: 800px; }
.pa-text { color: var(--ink-soft); font-size: var(--body); line-height: 1.48; }
.pa-small { color: var(--muted); font-size: var(--small); line-height: 1.45; }
.pa-micro { color: var(--muted-2); font-size: var(--micro); line-height: 1.35; }

.pa-footer-note {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 20px;
  color: var(--muted-2);
  font-size: 12px;
}

.pa-card {
  background: rgba(255,255,255,0.56);
  border: 1px solid rgba(23,25,29,0.10);
  border-radius: var(--radius-md);
  padding: 24px;
  box-shadow: var(--shadow-card);
}
.pa-card.flat { box-shadow: none; background: rgba(255,255,255,0.38); }
.pa-card.emphasis {
  background: var(--blue);
  color: #fff;
  border-color: rgba(255,255,255,0.16);
  overflow: hidden; /* safety net if a font-fit calc still undershoots */
}
.pa-card.emphasis .pa-small,
.pa-card.emphasis .pa-micro { color: rgba(255,255,255,0.73); }
.pa-card h3 { font-size: 24px; line-height: 1.15; letter-spacing: 0; margin-bottom: 10px; }
.pa-card .pa-label {
  font-size: 12px; color: var(--blue); text-transform: uppercase;
  letter-spacing: 0.12em; font-weight: 700; margin-bottom: 12px;
}
.pa-card.emphasis .pa-label { color: rgba(255,255,255,0.82); }

.pa-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--gap); }
.pa-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--gap); }
.pa-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--gap); }

.pa-rule { height: 1px; background: var(--rule); }

.pa-pill {
  display: inline-flex; align-items: center; gap: 8px;
  border: 1px solid rgba(23,59,103,0.22); color: var(--blue);
  border-radius: 999px; padding: 7px 12px; font-size: 13px; font-weight: 650;
  background: rgba(255,255,255,0.45);
}

.pa-marker {
  width: 28px; height: 28px; border-radius: 50%;
  display: grid; place-items: center;
  color: var(--paper-2); background: var(--blue);
  font-size: 13px; font-weight: 700; flex: 0 0 auto;
}

.pa-academic-icon {
  width: 42px; height: 42px;
  border: 1px solid rgba(23,59,103,0.22); border-radius: 12px;
  position: relative;
  background: rgba(23,59,103,0.055);
}
.pa-academic-icon::after {
  content: "";
  position: absolute; left: 8px; bottom: 10px; width: 25px; height: 16px;
  border-left: 2px solid var(--blue); border-bottom: 2px solid var(--blue);
  transform: skewX(-16deg); opacity: .8;
}

.pa-table { width: 100%; border-collapse: collapse; font-size: 16px; }
.pa-table th {
  color: var(--blue); text-align: left; font-size: 12px; letter-spacing: 0.1em;
  text-transform: uppercase; padding: 0 0 12px; border-bottom: 1px solid var(--rule-strong);
}
.pa-table td {
  padding: 14px 0; border-bottom: 1px solid var(--rule); color: var(--ink-soft);
  line-height: 1.35; vertical-align: top;
}

.pa-value {
  font-family: var(--font-title); font-size: 62px; line-height: 0.92;
  letter-spacing: 0; color: var(--blue);
}
.pa-unit { font-size: 18px; color: var(--muted); margin-left: 4px; }

.pa-callout {
  border-left: 4px solid var(--blue); padding: 16px 18px; font-size: 18px; line-height: 1.32;
  background: rgba(23,59,103,0.055); border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}
.pa-source { font-size: 11px; color: var(--muted-2); }

.pa-formula {
  font-family: 'Cambria Math', 'Times New Roman', serif; color: var(--ink);
  background: rgba(255,255,255,0.5); border: 1px solid var(--rule);
  border-radius: var(--radius-sm); padding: 14px 16px; font-size: 21px;
}

@media print {
  .pa-deck { gap: 0; }
  .pa-slide { box-shadow: none; border: none; break-after: page; }
}
`;
}
