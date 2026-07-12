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
  if (want('Source Sans 3'))     families.add('Source+Sans+3:wght@300;400;500;600;700;800;900');
  if (want('Source Serif 4'))    families.add('Source+Serif+4:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400');
  if (want('Lora'))              families.add('Lora:ital,wght@0,400;0,500;0,600;0,700;1,400');
  if (want('Playfair Display'))  families.add('Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400');
  if (want('Libre Baskerville')) families.add('Libre+Baskerville:ital,wght@0,400;0,700;1,400');
  if (want('IBM Plex Sans'))     families.add('IBM+Plex+Sans:wght@400;500;600;700');

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
.slide > *:not(.slide__visual):not(.page-no):not(.theme-tag):not(.seal-watermark) {
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
  font-size: 26px; font-weight: 700;
  line-height: 1.2;  letter-spacing: -0.01em;
  color: var(--text);
}
.lead { font-size: 23px; line-height: 1.46; font-weight: 400; color: var(--text-muted); text-align: justify; text-justify: inter-word; }
.text { font-size: 18px; line-height: 1.5; color: var(--text); text-align: justify; text-justify: inter-word; }
.text--sm { font-size: 16px; line-height: 1.46; }
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
/* Scoped bump (not the global .text--sm) — TURLAR/DEFINITION card bodies
   read too small at the base 14px on a 1280x720 canvas viewed at a
   distance; other .text--sm usages outside cards are unaffected. Bumped
   again 16->18px: still much smaller than a prose-mode slide's ~19-23px
   paragraph (.prose-body), and adjacent slides in the same deck read as
   inconsistent when a card-grid slide follows a prose slide. */
.card .text--sm { font-size: 18px; line-height: 1.5; }
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
/* TURLAR only (scoped via .turlar-grid, not the shared .grid-4 used by
   STATS/PROCESS/etc.): 4 cards as a 2x2 grid instead of one cramped row —
   each card gets roughly double the width, so bigger icons/text fit more
   comfortably. */
.turlar-grid.grid-4 { grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); gap: 16px; }
.turlar-grid.grid-4 .card { padding: 20px; overflow: hidden; }
.turlar-grid.grid-4 .card__icon { width: 38px; height: 38px; margin-bottom: 10px; }
.turlar-grid.grid-4 .h3 { font-size: 22px; line-height: 1.14; }
.turlar-grid.grid-4 .text--sm { font-size: 16px; line-height: 1.34; }

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
.metric__lbl { font-size: 16px; color: var(--text-muted); line-height: 1.45; }
/* Small unit beside the big figure (Fix 5): structured value = number + unit. */
.metric__unit { font-size: 0.4em; font-weight: 600; color: var(--text-muted); margin-left: 5px; letter-spacing: 0; }
/* Count-aware shrink: 4-5 metrics in a row must use less vertical space. */
.grid-4 .metric__num, .grid-5 .metric__num { font-size: 48px; }
.grid-4 .metric, .grid-5 .metric { gap: 8px; }
.grid-4 .metric__lbl, .grid-5 .metric__lbl { font-size: 15px; }

/* ============================================================
   PROBLEM
   ============================================================ */
.problem-stat {
  display: flex; flex-direction: column; gap: 10px;
  padding: 28px 32px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  min-width: 220px;
}
.problem-stat__num {
  font-family: var(--font-display);
  font-size: 56px; font-weight: 700;
  letter-spacing: -0.03em; line-height: 1;
  color: var(--accent);
}
.problem-stat__lbl { font-size: 15px; color: var(--text-muted); line-height: 1.4; }
.problem-stat__src { font-size: 11px; color: var(--text-muted); letter-spacing: 0.04em; opacity: 0.75; }
.problem-impact {
  font-size: 17px; color: var(--text); line-height: 1.5;
  max-width: 640px;
  text-align: justify; text-justify: inter-word;
}

/* Small citation line shown under data slides (STATS / OPPORTUNITY / CASE_STUDY) */
.source-note {
  font-size: 12px; color: var(--text-muted);
  letter-spacing: 0.04em; opacity: 0.75;
}

/* ============================================================
   INSIGHT
   ============================================================ */
.insight-implications {
  list-style: none; display: flex; flex-direction: column; gap: 12px;
}
.insight-implications li {
  display: flex; gap: 12px;
  font-size: 15px; line-height: 1.5;
  color: var(--text-muted);
}
.insight-implications li span:first-child {
  color: var(--accent); font-weight: 600; flex-shrink: 0;
}

/* ============================================================
   STEPS  (used by process + timeline)
   ============================================================ */
.step {
  display: flex; flex-direction: column; gap: 12px;
  padding: 22px;
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
.step__title { font-size: 19px; font-weight: 700; letter-spacing: -0.01em; color: var(--text); line-height: 1.25; }
.step__body  { font-size: 15.5px; color: var(--text-muted); line-height: 1.5; }
.step__outcome { font-size: 13px; font-weight: 600; color: var(--accent); line-height: 1.4; }
.step__tools { display: flex; flex-wrap: wrap; gap: 6px; margin-top: auto; }
.step__tool {
  font-size: 11px; font-weight: 600;
  padding: 4px 10px; border-radius: 999px;
  background: var(--bg); border: 1px solid var(--border);
  color: var(--text-muted);
}
/* Count-aware shrink: with 4-5 narrow columns the cards must use less space.
   Padding trimmed slightly further (16px->14px) to claw back width for the
   larger text sizes below. */
.grid-4 .step, .grid-5 .step { padding: 14px; gap: 9px; }
.grid-4 .step__node, .grid-5 .step__node { width: 34px; height: 34px; font-size: 15px; }
.grid-4 .step__title, .grid-5 .step__title { font-size: 17px; line-height: 1.22; }
.grid-4 .step__body, .grid-5 .step__body { font-size: 14.5px; line-height: 1.42; }
.grid-4 .step__outcome, .grid-5 .step__outcome { font-size: 12.5px; line-height: 1.35; }
.grid-5 .step__date, .grid-4 .step__date { font-size: 12px; }
/* Timeline milestone number + status node states */
.step__metric { font-family: var(--font-display); font-size: 20px; font-weight: 700; color: var(--accent); line-height: 1.1; }
.step__node--done    { background: var(--accent); color: var(--bg); }
.step__node--current { background: var(--accent); color: var(--bg); box-shadow: 0 0 0 5px var(--accent-soft); }
.step__node--planned { background: transparent; color: var(--text-muted); border: 2px solid var(--border); }

/* SOLUTION — per-feature proof number + whole-solution proof line */
.feature-metric { font-family: var(--font-display); font-size: 22px; font-weight: 700; color: var(--accent); line-height: 1; margin-bottom: 8px; }
.solution-proof {
  display: flex; align-items: center; gap: 12px;
  padding-top: 20px; border-top: 1px solid var(--border);
  font-size: 15px; color: var(--text);
}
.solution-proof span:first-child { color: var(--accent); font-size: 16px; }

/* Count-aware shrink for 4-column card grids */
.grid-4 .card { padding: 20px; }
.grid-4 .card .h3 { font-size: 20px; }

/* ============================================================
   ACADEMIC: AGENDA (Reja)
   ============================================================ */
.agenda { list-style: none; display: flex; flex-direction: column; gap: 18px; width: 100%; }
.agenda--two { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 56px; }
.agenda__item { display: flex; align-items: flex-start; gap: 20px; }
.agenda__num {
  font-family: var(--font-display); font-size: 22px; font-weight: 700;
  color: var(--accent); line-height: 1.2; flex-shrink: 0; min-width: 38px;
}
.agenda__text { display: flex; flex-direction: column; gap: 3px; padding-top: 1px; }
.agenda__label { font-size: 19px; font-weight: 600; color: var(--text); line-height: 1.3; }

/* ACADEMIC: CONTENT (heading + bullet points) — the workhorse */
.points { list-style: none; display: flex; flex-direction: column; gap: 14px; width: 100%; }
.points__item { display: flex; align-items: flex-start; gap: 16px; }
.points__dot {
  width: 10px; height: 10px; border-radius: 50%; background: var(--accent);
  flex-shrink: 0; margin-top: 9px;
}
.points__body { font-size: 18px; line-height: 1.5; color: var(--text-muted); }
.points__heading { font-weight: 700; color: var(--text); }

/* ICONS (visual layer) */
.ico { display: block; }
.points__icon {
  width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
  display: grid; place-items: center;
  background: var(--surface); border: 1px solid var(--border);
  color: var(--accent);
}
.card__icon {
  width: 42px; height: 42px; border-radius: 11px; flex-shrink: 0;
  display: grid; place-items: center; margin-bottom: 14px;
  background: var(--accent); color: var(--bg);
}
.card__top { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }

/* ACADEMIC: DEFINITION aspect cards */
.def-aspect__label {
  font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--accent);
}

/* ACADEMIC: CONCLUSION (Xulosa) */
.conclusion { list-style: none; display: flex; flex-direction: column; gap: 14px; width: 100%; }
.conclusion__item { display: flex; align-items: flex-start; gap: 18px; }
.conclusion__num {
  width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
  display: grid; place-items: center;
  background: var(--accent); color: var(--bg);
  font-family: var(--font-display); font-weight: 700; font-size: 15px;
}
.conclusion__text { font-size: 19px; line-height: 1.45; color: var(--text); padding-top: 3px; }
.conclusion__closing {
  font-size: 16px; color: var(--text-muted); font-style: italic;
  padding-top: 18px; border-top: 1px solid var(--border); text-align: justify;
}

/* ACADEMIC: REFERENCES (Adabiyotlar) */
.refs { padding-left: 22px; }
.refs__item {
  font-size: 14px; line-height: 1.5; color: var(--text-muted);
  margin-bottom: 12px; break-inside: avoid; padding-left: 6px;
}

/* ACADEMIC: AIM_TASKS (Maqsad va vazifalar) — aim highlight */
.aim-statement {
  font-size: 20px; line-height: 1.45; color: var(--text); font-weight: 600;
  padding: 15px 24px; border-left: 4px solid var(--accent);
  background: var(--surface); border-radius: var(--radius-md);
  text-align: justify; text-justify: inter-word;
}

/* ACADEMIC: OBJECT_SUBJECT (Ob'ekt va predmet) — paragraph inside compare cols */
.osubj__text { font-size: 17px; line-height: 1.5; color: inherit; margin-top: 4px; }

/* ACADEMIC: PROBLEMS_SOLUTIONS (Muammolar va yechimlar) — matched pairs */
.psol {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 14px 20px; width: 100%; align-items: stretch;
}
.psol__head {
  font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
  padding-bottom: 6px;
}
.psol__head--problem  { color: var(--text-muted); }
.psol__head--solution { color: var(--accent); }
.psol__cell {
  font-size: 15.5px; line-height: 1.4;
  padding: 18px 20px; border-radius: var(--radius-lg);
}
.psol__cell--problem  { background: var(--surface); border: 1px solid var(--border); color: var(--text-muted); }
.psol__cell--solution { background: var(--accent); color: var(--bg); }

/* ACADEMIC: TITUL (title page) — legacy single layout */
.titul__univ { font-size: 15px; font-weight: 700; letter-spacing: 0.05em; color: var(--text); text-transform: uppercase; line-height: 1.3; }
.titul__faculty { font-size: 14px; color: var(--text-muted); margin-top: 5px; }

/* ============================================================
   TITLE SLIDE — 5 layouts (title blueprint)
   ============================================================ */
/* Shared */
.titul-topic {
  font-family: var(--font-display); font-weight: 700;
  line-height: 1.08; letter-spacing: -0.02em; color: var(--text);
}
.titul-badge {
  display: inline-block; font-size: 12.5px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--bg); background: var(--accent);
  padding: 9px 18px; border-radius: var(--radius-md);
}
.titul-worklabel {
  font-size: 15px; font-weight: 700; letter-spacing: 0.22em;
  text-transform: uppercase; color: var(--accent);
}
.titul-min { font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.62; line-height: 1.4; }
.titul-foot { font-size: 14px; color: var(--text-muted); letter-spacing: 0.03em; }

/* 1 — editorial_split (40/60, dark meta panel) */
.titul-split { display: grid; grid-template-columns: 2fr 3fr; height: 100%; }
.titul-panel {
  background: var(--text); color: var(--bg);
  padding: 54px 42px; display: flex; flex-direction: column; justify-content: space-between;
}
.titul-univ2 { font-size: 17px; font-weight: 800; letter-spacing: 0.02em; text-transform: uppercase; margin-top: 14px; line-height: 1.25; }
.titul-sub2 { font-size: 13px; opacity: 0.8; margin-top: 6px; line-height: 1.35; }
.titul-panel__meta { display: flex; flex-direction: column; gap: 15px; }
.titul-meta { display: flex; flex-direction: column; gap: 2px; }
.titul-meta__lbl { font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; opacity: 0.6; }
.titul-meta__val { font-size: 13.5px; font-weight: 600; line-height: 1.3; }
.titul-main {
  padding: 62px 68px; display: grid; grid-template-rows: auto 1fr auto; gap: 18px;
}

/* 2 — classical_centered */
.titul-classic {
  height: 100%; padding: 54px 90px;
  display: flex; flex-direction: column; align-items: center; text-align: center;
}
.titul-classic__head { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.titul-classic__univ { font-size: 19px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em; color: var(--text); margin-top: 8px; }
.titul-classic__center { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 24px; }
.titul-classic__meta { display: flex; justify-content: center; gap: 90px; text-align: left; }
.titul-cmeta__lbl { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--text-muted); margin-bottom: 4px; }
.titul-cmeta__val { font-size: 14px; font-weight: 600; color: var(--text); line-height: 1.35; }

/* 3 — bento_academic */
.titul-bento-wrap { height: 100%; padding: 56px 64px; display: grid; grid-template-rows: 1fr auto; gap: 34px; }
.titul-bento-head { display: flex; flex-direction: column; justify-content: center; gap: 20px; }
.titul-bento { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.titul-bento__cell {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 18px 22px;
  display: flex; flex-direction: column; gap: 6px;
}
.titul-bento__cell--accent { background: var(--accent); border-color: var(--accent); }
.titul-bento__cell--accent .titul-bento__lbl,
.titul-bento__cell--accent .titul-bento__val { color: var(--bg); opacity: 1; }
.titul-bento__lbl { font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: var(--text-muted); }
.titul-bento__val { font-size: 15px; font-weight: 600; color: var(--text); line-height: 1.3; }

/* 4 — typographic_statement */
.titul-typo { height: 100%; padding: 52px 64px; display: grid; grid-template-rows: auto 1fr auto; }
.titul-typo__top { font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-muted); }
.titul-typo__center { align-self: center; display: flex; gap: 28px; align-items: center; }
.titul-typo__bar { width: 6px; align-self: stretch; background: var(--accent); border-radius: 3px; }
.titul-typo__foot { display: flex; justify-content: space-between; align-items: flex-end; }
.titul-typo__student { color: var(--text); font-weight: 600; font-size: 14px; }

/* 5 — vertical_ribbon */
.titul-ribbon-wrap { display: grid; grid-template-columns: 78px 1fr; height: 100%; }
.titul-ribbon { background: var(--text); color: var(--bg); display: flex; align-items: center; justify-content: center; }
.titul-ribbon__txt {
  writing-mode: vertical-rl; transform: rotate(180deg);
  font-size: 13px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; opacity: 0.88;
  max-height: 88%; overflow: hidden;
}
.titul-ribbon-main { padding: 58px 68px; display: grid; grid-template-rows: auto 1fr auto; gap: 18px; }
.titul-ribbon__meta { display: flex; gap: 64px; }

/* PROSE CONTENT MODE — shared across 8 types (CONTENT, DEFINITION, BATAFSIL,
   MISOL, RELEVANCE, OBJECT_SUBJECT, CONCLUSION, AIM_TASKS), see layouts.ts
   proseBody() helper. Values verified against the real 1280x720 canvas at the
   schema's 650-char ceiling — comfortable margin, no overflow. */
.prose-body { font-size: 19px; line-height: 1.65; color: var(--text); max-width: 76ch; text-align: justify; text-justify: inter-word; }
.prose-body strong { color: var(--accent); font-weight: 600; }
/* Length-aware size modifiers (additive — base .prose-body above is
   untouched, these only override when applied). A short paragraph reads
   thin at 19px; letting it run larger makes the slide feel intentional
   rather than empty. Long paragraphs already verified to fit at 19px, so
   --compact merely trims a touch of margin rather than fixing overflow. */
.prose-body--roomy   { font-size: 23px; line-height: 1.6; }
.prose-body--compact { font-size: 17px; line-height: 1.6; }

/* ACADEMIC: BATAFSIL (deep-dive) */
.batafsil__body { font-size: 18px; line-height: 1.6; color: var(--text); text-align: justify; text-justify: inter-word; }
.batafsil__points { list-style: none; display: flex; flex-direction: column; gap: 14px; align-self: start; padding-top: 4px; }
.batafsil__points li { display: flex; gap: 12px; font-size: 16px; line-height: 1.4; color: var(--text-muted); }
.batafsil__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); flex-shrink: 0; margin-top: 7px; }

/* ACADEMIC: FINDING V2 (interpretation + limitation, additive) */
.finding__interpretation { font-size: 16px; line-height: 1.55; color: var(--text-muted); margin-top: 16px; }
.finding__interpretation strong { color: var(--accent); font-weight: 600; }
.finding__limitation { font-size: 13px; line-height: 1.45; color: var(--text-muted); opacity: 0.75; font-style: italic; margin-top: 10px; }

/* DARK: FINDING research brief */
.content-block--finding-brief { gap: 22px; }
.finding-brief {
  min-height: 360px; display: grid; grid-template-columns: minmax(0,1fr) 360px; gap: 24px;
  align-items: stretch;
}
.finding-brief__claim {
  position: relative; overflow: hidden; border-radius: 30px; padding: 30px 38px;
  background:
    radial-gradient(circle at 12% 18%, rgba(201,162,75,.18), transparent 36%),
    linear-gradient(145deg, rgba(255,255,255,.072), rgba(255,255,255,.03));
  border: 1px solid rgba(255,255,255,.14);
  box-shadow: 0 26px 66px rgba(0,0,0,.26), inset 0 1px 0 rgba(255,255,255,.08);
  display: flex; flex-direction: column; justify-content: center;
}
.finding-brief__claim::before {
  content: ""; position: absolute; right: -74px; bottom: -92px; width: 250px; height: 250px;
  border-radius: 50%; border: 1px solid rgba(201,162,75,.22);
}
.finding-brief__stamp {
  color: var(--accent); font: 800 12px/1.2 ui-monospace, 'SF Mono', Consolas, monospace;
  letter-spacing: .16em; text-transform: uppercase; margin-bottom: 18px;
}
.finding-brief__claim p {
  position: relative; z-index: 1; margin: 0; color: var(--text); font-size: 20.5px;
  line-height: 1.39;
}
.finding-brief__source {
  position: relative; z-index: 1; margin-top: 18px; padding-top: 14px;
  border-top: 1px solid rgba(255,255,255,.13); color: var(--text-muted);
  font-size: 13px; line-height: 1.35;
}
.finding-brief__side { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.finding-brief__panel {
  border-radius: 22px; padding: 20px 22px; background: rgba(255,255,255,.045);
  border: 1px solid rgba(255,255,255,.12);
}
.finding-brief__panel--analysis {
  background: linear-gradient(145deg, rgba(201,162,75,.12), rgba(255,255,255,.035));
  border-color: rgba(201,162,75,.22);
}
.finding-brief__label {
  color: var(--accent); font-size: 12px; font-weight: 800; text-transform: uppercase;
  letter-spacing: .13em; margin-bottom: 12px;
}
.finding-brief__points { list-style: none; padding: 0; margin: 0; display: grid; gap: 12px; }
.finding-brief__points li { display: grid; grid-template-columns: 34px minmax(0,1fr); gap: 12px; align-items: start; }
.finding-brief__points span {
  color: var(--accent); font: 800 12px/1.2 ui-monospace, 'SF Mono', Consolas, monospace;
  padding-top: 3px;
}
.finding-brief__points p,
.finding-brief__panel--analysis p {
  margin: 0; color: var(--text-muted); font-size: 16.5px; line-height: 1.4;
}
.finding-brief__caveat {
  color: var(--text-muted); font-size: 13px; line-height: 1.4; opacity: .76;
  border-left: 2px solid rgba(201,162,75,.36); padding-left: 13px;
}

/* ACADEMIC: MISOL (example) */
.misol__takeaway { display: flex; gap: 12px; font-size: 16px; color: var(--text); padding-top: 18px; border-top: 1px solid var(--border); }
.misol__takeaway span:first-child { color: var(--accent); flex-shrink: 0; }
.misol__icon {
  width: 190px; height: 190px; border-radius: var(--radius-lg); flex-shrink: 0;
  display: grid; place-items: center;
  background: var(--surface); border: 1px solid var(--border); color: var(--accent);
}

/* DARK: MISOL case-study board */
.content-block--case-study { gap: 26px; }
.case-study {
  position: relative; display: grid; grid-template-columns: minmax(0,1fr) 250px; gap: 24px;
  min-height: 330px; align-items: stretch;
}
.case-study::before {
  content: ""; position: absolute; inset: 22px 210px 18px 92px; border-radius: 30px;
  background: radial-gradient(circle at 28% 18%, rgba(201,162,75,.16), transparent 36%),
              linear-gradient(145deg, rgba(255,255,255,.06), rgba(255,255,255,.02));
  border: 1px solid rgba(255,255,255,.09); transform: rotate(-1deg);
}
.case-study__main {
  position: relative; z-index: 1; display: grid; grid-template-columns: 72px minmax(0,1fr);
  gap: 22px; padding: 26px 30px 26px 24px; border-radius: 26px;
  background: rgba(255,255,255,.052); border: 1px solid rgba(255,255,255,.13);
  box-shadow: 0 24px 60px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.08);
}
.case-study__marker {
  align-self: stretch; border-radius: 18px; display: flex; flex-direction: column;
  justify-content: space-between; align-items: center; padding: 18px 10px;
  background: linear-gradient(180deg, rgba(201,162,75,.18), rgba(201,162,75,.045));
  border: 1px solid rgba(201,162,75,.28); color: var(--accent);
}
.case-study__marker span {
  writing-mode: vertical-rl; transform: rotate(180deg); font-size: 11px; font-weight: 800;
  letter-spacing: .18em;
}
.case-study__marker strong { font-family: var(--font-display); font-size: 27px; line-height: 1; }
.case-study__copy { min-width: 0; align-self: center; }
.case-study__label {
  font: 800 12px/1.2 ui-monospace, 'SF Mono', Consolas, monospace; letter-spacing: .14em;
  text-transform: uppercase; color: var(--accent); margin-bottom: 13px;
}
.case-study__copy p {
  margin: 0; color: var(--text); font-size: 18.5px; line-height: 1.36;
}
.case-study__takeaway {
  margin-top: 16px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,.13);
  display: grid; gap: 6px;
}
.case-study__takeaway span {
  color: var(--accent); font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .13em;
}
.case-study__takeaway strong { color: var(--text); font-size: 15.5px; line-height: 1.3; }
.case-study__side {
  position: relative; z-index: 1; display: grid; place-items: center; padding: 20px;
  border-radius: 26px; background: rgba(255,255,255,.035); border: 1px solid rgba(255,255,255,.11);
  overflow: hidden;
}
.case-study__side-line {
  position: absolute; inset: 20px; border-radius: 22px;
  border: 1px dashed rgba(201,162,75,.25); pointer-events: none;
}
.case-study__glyph {
  width: 148px; height: 148px; border-radius: 30px; display: grid; place-items: center;
  color: var(--accent); background: radial-gradient(circle at 35% 25%, rgba(201,162,75,.22), rgba(255,255,255,.04));
  border: 1px solid rgba(201,162,75,.28); box-shadow: inset 0 1px 0 rgba(255,255,255,.1);
  font-family: var(--font-display); font-size: 42px; font-weight: 800;
}
.case-study__visual { width: 100%; height: 238px; }

/* Wikimedia imagery occupies a dedicated column instead of covering text. */
.content-block--visual { gap: 24px; }
.content-block--visual .content-block__head { max-width: 1040px; }
.wm-split { display: grid; grid-template-columns: minmax(0,1.12fr) minmax(340px,.88fr); gap: 34px; align-items: stretch; }
.wm-copy { min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 18px; }
.wm-points { gap: 10px; }
.wm-points .points__item { padding: 12px 0; }
.wm-visual-content,.wm-visual-example { height: 310px; align-self: center; }

/* ============================================================
   COMPARISON
   ============================================================ */
.compare { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.compare__col {
  padding: 22px 24px;
  border-radius: var(--radius-lg);
  display: flex; flex-direction: column; gap: 12px;
}
.compare__col--now  { background: var(--surface); border: 1px solid var(--border); color: var(--text-muted); }
.compare__col--next { background: var(--accent);  color: var(--bg); }
.compare__list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.compare__list li { display: flex; gap: 10px; font-size: 17px; line-height: 1.42; }
.compare__winner { color: inherit; margin-left: 8px; font-size: 17px; }

/* Head-to-head metrics — compact HORIZONTAL strip (bounded height
   regardless of count, so it never pushes the columns past 720px). */
.compare-metrics {
  display: grid; gap: 20px;
  border-top: 1px solid var(--border); padding-top: 16px;
}
.compare-metrics__cell { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.compare-metrics__label { font-size: 14px; line-height: 1.3; color: var(--text-muted); }
.compare-metrics__nums {
  display: flex; align-items: baseline; gap: 8px;
  font-family: var(--font-display);
}
.compare-metrics__before { font-size: 16px; color: var(--text-muted); text-decoration: line-through; opacity: 0.65; }
.compare-metrics__arrow  { font-size: 14px; color: var(--text-muted); }
.compare-metrics__after  { font-size: 24px; font-weight: 700; color: var(--accent); }

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
.content-block__body { align-self: start; }
/* Prose mode (single flowing paragraph, no bullets/cards to fill the row):
   top-anchoring leaves a large dead zone below short-but-valid paragraphs
   (even nearly-max-length ones only run a handful of lines). Centering the
   body within the leftover 1fr space reads as intentional instead of sparse.
   Additive modifier — does not touch the default (list/card) behavior above. */
.content-block--prose .content-block__body { align-self: center; }

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
    radial-gradient(900px 600px at 78% -10%, rgba(201,162,75,0.10), transparent 60%),
    radial-gradient(700px 500px at 8% 110%,  rgba(134,165,196,0.08), transparent 55%),
    var(--bg);
}
.style-dark .h1 { font-size: 74px; font-weight: 700; letter-spacing: -0.02em; }
.style-dark .h2 { font-weight: 700; letter-spacing: -0.015em; }
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
  background: linear-gradient(135deg, rgba(201,162,75,0.08), transparent 45%);
}
.style-dark .step {
  background: var(--surface);
  position: relative; overflow: hidden;
}
.style-dark .step__node {
  background: var(--bg);
  border: 2px solid var(--accent);
  color: var(--text);
  box-shadow: 0 0 16px rgba(201,162,75,0.35);
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
/* The pill styling above assumes a standalone kicker sitting on the slide's
   own background. Inside a COMPARISON column it inherits that column's own
   color (compare__col--next is white-on-accent) — the white pill would then
   show white-on-white text. Strip the pill there so it reads as a plain
   inherited-color label, matching every other theme's compare__col kicker. */
.style-pastel .compare__col .kicker {
  background: transparent;
  box-shadow: none;
  padding: 0;
  color: inherit;
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

/* ACADEMIC (Rasmiy) ------------------------------------------
   Official university/thesis-defense aesthetic: blueprint navy bg,
   sealing-wax accent, low-radius formal geometry, faint document grid
   + inner frame + a corner seal watermark (only on TITLE/CLOSING —
   see sealWatermark() in layouts.ts, not injected on every slide). No
   blur/backdrop-filter is used here, so no print fallback is needed. */
.style-academic .slide {
  background:
    radial-gradient(ellipse 900px 600px at 12% -10%, rgba(92,122,153,0.16), transparent 60%),
    radial-gradient(ellipse 700px 500px at 105% 110%, rgba(176,57,46,0.10), transparent 55%),
    var(--bg);
}
.style-academic .slide::before {
  content: '';
  position: absolute; inset: 0;
  background-image:
    repeating-linear-gradient(0deg, rgba(237,234,226,0.035) 0px, rgba(237,234,226,0.035) 1px, transparent 1px, transparent 96px),
    repeating-linear-gradient(90deg, rgba(237,234,226,0.035) 0px, rgba(237,234,226,0.035) 1px, transparent 1px, transparent 96px);
  pointer-events: none;
}
.style-academic .slide::after {
  content: '';
  position: absolute; inset: 24px;
  border: 1px solid rgba(237,234,226,0.16);
  pointer-events: none;
}
.style-academic .h1, .style-academic .h2 { font-weight: 700; letter-spacing: -0.01em; }
.style-academic .kicker { display: inline-flex; align-items: center; gap: 10px; color: var(--accent-soft); }
.style-academic .kicker::before { content: ''; width: 22px; height: 1px; background: var(--accent); }
.style-academic .card,
.style-academic .step {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}
.style-academic .step__node { background: var(--accent); color: var(--text); border-radius: var(--radius-sm); }
.style-academic .btn--primary { background: var(--accent); color: var(--text); border-radius: var(--radius-sm); }
.style-academic .tag { border-radius: var(--radius-sm); border-color: var(--border); }
.style-academic .compare__col--next { background: var(--accent); color: var(--text); border-radius: var(--radius-md); }
.style-academic .compare__col--now  { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text-muted); }
.style-academic .prose-body strong { color: var(--accent-soft); }
.seal-watermark {
  position: absolute; right: 40px; bottom: 30px;
  width: 220px; height: 220px;
  color: var(--text);
  opacity: 0.07;
  pointer-events: none;
}

/* ============================================================
   DARK_PREMIUM — 5 YANGI KONSEPSIYA (2026 research)
   Semantik token ishlatgani uchun texnik jihatdan boshqa temalarda
   ham ishlaydi, lekin vizual niyat faqat dark_premium uchun —
   d.layout orqali tanlab chaqiriladi (bot/AI hozircha buni
   tanlamaydi, faqat qo'lda o'rnatilganda ishlaydi).
   ============================================================ */

/* ---------- 1) DEFINITION glass_hero ---------- */
.gh-orb1 { position:absolute; top:-15%; left:10%; width:34%; aspect-ratio:1; border-radius:50%;
  background: radial-gradient(circle, rgba(201,162,75,0.5), transparent 70%); filter: blur(40px); z-index:0; }
.gh-orb2 { position:absolute; bottom:-20%; right:8%; width:30%; aspect-ratio:1; border-radius:50%;
  background: radial-gradient(circle, rgba(134,165,196,0.4), transparent 70%); filter: blur(40px); z-index:0; }
.gh-panel {
  position: relative; z-index: 1; backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14);
  border-radius: 28px; padding: 44px 48px; max-width: 780px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.15), 0 20px 60px rgba(0,0,0,0.35);
}
.gh-term { font-family: var(--font-display); font-size: 46px; font-weight: 700; color: var(--text); }
.gh-def { font-size: 18px; line-height: 1.55; color: var(--text-muted); margin-top: 16px; }

@media print {
  .gh-panel { backdrop-filter: none; -webkit-backdrop-filter: none; background: rgba(255,255,255,0.09); }
}

/* ---------- 2) FINDING z_stack ---------- */
.zs-wrap { position: relative; height: 100%; display: flex; align-items: center; }
.zs-card { position: absolute; width: 380px; padding: 30px 32px; border-radius: 22px;
  background: rgba(255,255,255,0.045); border: 1px solid rgba(255,255,255,0.10);
  backdrop-filter: blur(10px); }
.zs-card--back1 { left: 40px; top: 50%; transform: translateY(-50%) rotate(-6deg) scale(0.92); opacity: 0.55; z-index: 1; }
.zs-card--back2 { left: 90px; top: 50%; transform: translateY(-50%) rotate(-2deg) scale(0.96); opacity: 0.78; z-index: 2; }
.zs-card--front { left: 150px; top: 50%; transform: translateY(-50%); z-index: 3;
  box-shadow: 0 24px 60px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,162,75,0.25);
  border-color: rgba(201,162,75,0.3); }
.zs-num { font-family: var(--font-display); font-weight: 700; font-size: 15px; color: var(--accent); margin-bottom: 10px; }
.zs-title { font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
.zs-text { font-size: 13.5px; color: var(--text-muted); line-height: 1.5; }

@media print {
  .zs-card { backdrop-filter: none; -webkit-backdrop-filter: none; }
}

/* ---------- 3) STATS gradient_cards ---------- */
.gm-row { gap: 22px; }
.gm-card { border-radius: 24px; padding: 28px 24px; position: relative; overflow: hidden; min-height: 180px; }
.gm-card--a { background: linear-gradient(160deg, rgba(201,162,75,0.22), rgba(201,162,75,0.03)); border: 1px solid rgba(201,162,75,0.25); }
.gm-card--b { background: linear-gradient(160deg, rgba(134,165,196,0.20), rgba(134,165,196,0.03)); border: 1px solid rgba(134,165,196,0.22); }
.gm-card--c { background: rgba(255,255,255,0.045); border: 1px solid rgba(255,255,255,0.10); }
.gm-num { font-family: var(--font-display); font-weight: 700; font-size: 48px; line-height: 1; color: var(--text); }
.gm-lbl { font-size: 13px; color: var(--text); margin-top: 10px; font-weight: 700; }
.gm-desc { font-size: 11.5px; color: var(--text-muted); line-height: 1.35; margin-top: 8px; }
.gm-orb { position: absolute; bottom: -30%; right: -20%; width: 70%; aspect-ratio: 1; border-radius: 50%;
  background: radial-gradient(circle, rgba(201,162,75,0.25), transparent 70%); filter: blur(20px); }

/* ---------- 4) TURLAR squircle_bento ---------- */
.sq-map { position: relative; min-height: 360px; display: grid; align-items: center; padding: 24px 0 12px; overflow: hidden; }
.sq-map__axis { position: absolute; left: 9%; right: 9%; top: 76%; height: 1px; background: linear-gradient(90deg, transparent, rgba(201,162,75,.28), transparent); z-index: 0; }
.sq-map__halo { position: absolute; border-radius: 50%; border: 1px solid rgba(201,162,75,.18); pointer-events: none; }
.sq-map__halo--a { width: 300px; height: 300px; right: 8%; bottom: -58px; }
.sq-map__halo--b { width: 190px; height: 190px; left: 8%; top: 20px; border-color: rgba(134,165,196,.16); }
.sq-map__core {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%);
  width: 86px; height: 86px; border-radius: 50%; display: grid; place-items: center;
  background: rgba(201,162,75,.13); border: 1px solid rgba(201,162,75,.36);
  color: var(--accent); font-size: 10px; font-weight: 800; letter-spacing: .16em;
  z-index: 0; opacity: .42;
}
.sq-grid { gap: 18px; position: relative; z-index: 2; }
.sq-grid.grid-4 { grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); gap: 14px; }
.sq-card {
  border-radius: 32px; padding: 26px 22px; background: rgba(255,255,255,0.045);
  border: 1px solid rgba(255,255,255,0.10); position: relative; overflow: hidden;
  backdrop-filter: blur(6px);
}
.sq-grid.grid-4 .sq-card { padding: 18px 18px; border-radius: 24px; }
.sq-grid.grid-4 .sq-icon { width: 34px; height: 34px; margin-bottom: 9px; }
.sq-grid.grid-4 .sq-title { font-size: 16px; line-height: 1.16; }
.sq-grid.grid-4 .sq-text { font-size: 14px; line-height: 1.3; }
.sq-card::before { content: ""; position: absolute; top: 0; left: 15%; right: 15%; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent); }
.sq-icon { width: 40px; height: 40px; border-radius: 14px; display: grid; place-items: center;
  background: linear-gradient(135deg, var(--accent), rgba(201,162,75,0.5)); color: var(--bg);
  font-weight: 700; font-size: 15px; margin-bottom: 14px; }
.sq-title { font-size: 15.5px; font-weight: 700; color: var(--text); }
.sq-text { font-size: 12px; color: var(--text-muted); line-height: 1.4; margin-top: 6px; }

/* ---------- Dark dossier system: content-heavy academic pages ---------- */
.content-block--dossier { gap: 26px; }
.content-block--dossier .content-block__body { align-self: center; width: 100%; }
.ds-frame {
  position: relative; min-height: 310px; border-radius: 18px; overflow: hidden;
  background: linear-gradient(145deg, rgba(255,255,255,.074), rgba(255,255,255,.032));
  border: 1px solid rgba(255,255,255,.14);
  box-shadow: 0 26px 60px rgba(0,0,0,.24), inset 0 1px 0 rgba(255,255,255,.08);
  padding: 30px;
}
.ds-frame--split { display: grid; grid-template-columns: minmax(0,1fr) 285px; gap: 26px; }
.ds-frame--single { display: flex; align-items: center; }
.ds-frame__grid {
  position: absolute; inset: 0; opacity: .32; pointer-events: none;
  background-image:
    linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px);
  background-size: 34px 34px;
  mask-image: radial-gradient(circle at 75% 20%, black, transparent 74%);
}
.ds-frame__tag {
  position: absolute; top: 18px; right: 22px;
  color: var(--accent); font: 800 10px/1 ui-monospace, 'SF Mono', Consolas, monospace;
  letter-spacing: .18em; text-transform: uppercase; opacity: .82;
}
.ds-frame__main { position: relative; z-index: 1; min-width: 0; align-self: center; }
.ds-prose {
  margin: 0; color: var(--text); font-size: 22px; line-height: 1.52;
  max-width: 760px; text-align: justify; text-justify: inter-word;
}
.ds-prose--wide { max-width: 920px; font-size: 23px; line-height: 1.5; }
.ds-prose strong, .ds-prose .hl { color: var(--accent); font-weight: 700; }
.ds-term {
  font-family: var(--font-display); color: var(--text); font-size: 58px;
  font-weight: 700; line-height: 1; letter-spacing: -.02em; margin-bottom: 24px;
}
.ds-lines { display: flex; flex-direction: column; gap: 13px; }
.ds-line {
  display: grid; grid-template-columns: 42px 1fr; gap: 15px; align-items: start;
  padding: 13px 0; border-bottom: 1px solid rgba(255,255,255,.09);
}
.ds-line:last-child { border-bottom: none; }
.ds-line__num {
  color: var(--accent); font: 800 14px/1 ui-monospace, 'SF Mono', Consolas, monospace;
  padding-top: 5px;
}
.ds-line__body { color: var(--text-muted); font-size: 19px; line-height: 1.4; }
.ds-line__body b { color: var(--text); font-weight: 800; }
.ds-rail {
  position: relative; z-index: 1; min-width: 0; align-self: stretch;
  border-left: 1px solid rgba(201,162,75,.25); padding-left: 22px;
  display: flex; flex-direction: column; justify-content: center; gap: 12px;
}
.ds-rail__label {
  color: var(--accent); font-size: 11px; font-weight: 800;
  letter-spacing: .16em; text-transform: uppercase; margin-bottom: 2px;
}
.ds-note {
  display: grid; grid-template-columns: 34px 1fr; gap: 10px; align-items: start;
  padding: 13px 14px; border-radius: 12px;
  background: rgba(255,255,255,.055); border: 1px solid rgba(255,255,255,.09);
  color: var(--text-muted); font-size: 14.5px; line-height: 1.32;
}
.ds-note__num {
  color: var(--accent-soft); font: 800 12px/1.2 ui-monospace, 'SF Mono', Consolas, monospace;
}
.ds-rail--dense { gap: 8px; }
.ds-rail--dense .ds-note {
  padding: 9px 11px; font-size: 13px; line-height: 1.25;
  grid-template-columns: 30px 1fr;
}
.ds-rail--dense .ds-note__num { font-size: 11px; }
.ds-source { margin-top: 18px; }
.ds-closing {
  margin: 20px 0 0; padding-top: 18px; border-top: 1px solid rgba(255,255,255,.11);
  color: var(--accent-soft); font-size: 18px; line-height: 1.4; font-style: italic;
}
.ds-stat {
  position: relative; z-index: 1; align-self: center;
  min-height: 230px; border-left: 1px solid rgba(201,162,75,.25); padding-left: 26px;
  display: flex; flex-direction: column; justify-content: center;
}
.ds-stat__num {
  font-family: var(--font-display); color: var(--accent); font-size: 64px;
  font-weight: 800; line-height: .95; letter-spacing: -.03em;
}
.ds-stat__label { color: var(--text); font-size: 18px; line-height: 1.35; margin-top: 12px; }
.ds-stat__src {
  color: var(--text-muted); font-size: 11px; line-height: 1.35;
  letter-spacing: .08em; text-transform: uppercase; margin-top: 14px; opacity: .75;
}
.ds-refs { margin: 0; padding: 0; list-style: none; columns: 2; column-gap: 34px; }
.ds-refs li {
  display: grid; grid-template-columns: 36px 1fr; gap: 12px; break-inside: avoid;
  margin: 0 0 13px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,.08);
}
.ds-refs li span { color: var(--accent); font: 800 12px/1.4 ui-monospace, 'SF Mono', Consolas, monospace; }
.ds-refs li p { margin: 0; color: var(--text-muted); font-size: 14.5px; line-height: 1.38; }
.ds-analysis {
  margin: 18px 0 0; color: var(--text-muted); font-size: 17px; line-height: 1.45;
  padding-top: 15px; border-top: 1px solid rgba(255,255,255,.10);
}
.ds-analysis strong { color: var(--accent); }
.ds-limitation { margin: 12px 0 0; color: var(--text-muted); opacity: .78; font-size: 13.5px; line-height: 1.4; font-style: italic; }

/* ---------- 5) TIMELINE rim_light ----------
   Zigzag layout: the axis line runs through the vertical middle of the
   available body space, and cards alternate above/below it (1st & 3rd
   above, 2nd & 4th below) via a 3-row grid (card-row / node-row / card-row)
   instead of the old single row of cards all sitting under the line —
   that left roughly half the slide as dead empty space below the cards. */
.rl-track { position: relative; padding: 70px 20px; }
.rl-axis { position: absolute; top: 50%; left: 20px; right: 20px; height: 2px; transform: translateY(-50%);
  background: linear-gradient(90deg, transparent, var(--accent) 20%, var(--accent) 80%, transparent); }
.rl-row { position: relative; display: grid; grid-template-rows: auto auto auto; align-items: center; column-gap: 18px; }
.rl-node { grid-row: 2; justify-self: center; width: 44px; height: 44px; border-radius: 50%; background: rgba(201,162,75,0.15);
  border: 1.5px solid var(--accent); box-shadow: 0 0 0 1px rgba(201,162,75,0.15), 0 0 20px -2px var(--accent);
  display: grid; place-items: center; font-family: var(--font-display); font-weight: 700; font-size: 16px; color: var(--accent); }
.rl-card { text-align: center; background: rgba(255,255,255,0.045); border: 1px solid rgba(255,255,255,0.10);
  border-radius: 16px; padding: 18px 16px; backdrop-filter: blur(8px); }
.rl-card--up { grid-row: 1; align-self: end; margin-bottom: 18px; }
.rl-card--down { grid-row: 3; align-self: start; margin-top: 18px; }
.rl-date { font-size: 15px; font-weight: 700; color: var(--accent); }
.rl-title-sm { font-size: 17px; font-weight: 600; margin-top: 6px; }
.rl-body { font-size: 14.5px; color: var(--text-muted); line-height: 1.4; margin-top: 8px; }

@media print {
  .rl-card { backdrop-filter: none; -webkit-backdrop-filter: none; }
}

/* ============================================================
   DARK_PREMIUM — 6 YANGI LAYOUT (developer-tool chrome estetikasi)
   Barcha monospace elementlar tizim shriftlaridan foydalanadi — yangi
   Google Fonts import shart emas.
   ============================================================ */

/* ---------- 1) CONTENT changelog_lines ---------- */
.cl-list { display: flex; flex-direction: column; }
.cl-row { display: flex; align-items: baseline; gap: 18px; padding: 14px 0; border-bottom: 1px solid var(--border); }
.cl-row:last-child { border-bottom: none; }
.cl-linenum {
  font-family: ui-monospace, 'SF Mono', Consolas, monospace;
  font-size: 12px; color: var(--text-muted); opacity: 0.55; width: 24px; flex-shrink: 0;
}
.cl-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
.cl-text { font-size: 16px; color: var(--text); line-height: 1.5; }
.cl-text b { color: var(--accent); font-weight: 600; }

/* ---------- 2) BATAFSIL marginalia ---------- */
.mg-body { font-size: 18px; line-height: 1.75; color: var(--text); }
.mg-margin { display: flex; flex-direction: column; gap: 20px; padding-top: 6px; border-left: 1px solid var(--border); padding-left: 22px; }
.mg-note { position: relative; padding-left: 16px; }
.mg-note__tick { position: absolute; left: 0; top: 7px; width: 8px; height: 2px; background: var(--accent); }
.mg-note__text { font-size: 14px; color: var(--accent-soft); line-height: 1.4; font-style: italic; }

/* ---------- 3) MISOL signal_ping ---------- */
.sp-radar { position: relative; width: 200px; height: 200px; flex-shrink: 0; }
.sp-ring { position: absolute; border-radius: 50%; border: 1px solid var(--accent); }
.sp-ring--1 { inset: 60px; opacity: 0.55; }
.sp-ring--2 { inset: 30px; opacity: 0.3; }
.sp-ring--3 { inset: 0; opacity: 0.14; }
.sp-crosshair { position: absolute; background: var(--border); }
.sp-crosshair--v { left: 50%; top: -6px; bottom: -6px; width: 1px; transform: translateX(-50%); }
.sp-crosshair--h { top: 50%; left: -6px; right: -6px; height: 1px; transform: translateY(-50%); }
.sp-core {
  position: absolute; inset: 92px; border-radius: 50%; background: var(--accent);
  box-shadow: 0 0 0 6px rgba(201,162,75,0.15), 0 0 24px 2px rgba(201,162,75,0.5);
}
.sp-data { flex: 1; display: flex; flex-direction: column; gap: 16px; }
.sp-label {
  font-size: 12px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--accent); font-family: ui-monospace, 'SF Mono', Consolas, monospace;
}
.sp-body { font-size: 19px; line-height: 1.55; color: var(--text); max-width: 640px; }
.sp-readout {
  display: inline-block; font-family: ui-monospace, 'SF Mono', Consolas, monospace;
  font-size: 14px; color: var(--accent-soft); border: 1px solid var(--border);
  border-radius: 8px; padding: 10px 16px; background: rgba(255,255,255,0.03); align-self: flex-start;
}

/* ---------- 4) COMPARISON toggle_spectrum ---------- */
.ts-track { display: flex; align-items: center; gap: 20px; }
.ts-track__lbl { font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); flex-shrink: 0; }
.ts-track__lbl--r { color: var(--accent); }
.ts-track__bar { flex: 1; height: 6px; border-radius: 999px; background: var(--border); position: relative; }
.ts-track__knob {
  position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
  width: 22px; height: 22px; border-radius: 50%; background: var(--accent);
  box-shadow: 0 0 0 4px rgba(201,162,75,0.18);
}

/* ---------- 5) PROCESS kbd_chain ---------- */
.kc-chain { display: flex; align-items: stretch; gap: 12px; }
.kc-key {
  flex: 1; border-radius: 10px; padding: 20px 16px; text-align: center;
  background: linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03));
  border: 1px solid var(--border); border-top-color: rgba(255,255,255,0.18);
  box-shadow: 0 2px 0 rgba(0,0,0,0.3);
}
.kc-key__n { font-family: var(--font-display); font-weight: 700; font-size: 20px; color: var(--accent); }
.kc-key__title { font-size: 14px; font-weight: 700; color: var(--text); margin-top: 8px; }
.kc-key__body { font-size: 13.5px; color: var(--text-muted); margin-top: 6px; line-height: 1.42; }
.kc-plus { display: flex; align-items: center; font-size: 20px; color: var(--text-muted); opacity: 0.5; }

/* ---------- 5b) PROCESS switchback_path ----------
   Dark-premium process layout: a vertical route with alternating wide stages,
   so process slides do not collapse into one narrow horizontal row. */
.content-block--process-path { gap: 22px; }
.process-path {
  position: relative; min-height: 405px; display: grid; gap: 9px; align-content: center;
}
.process-path__spine {
  position: absolute; left: 50%; top: 10px; bottom: 10px; width: 1px;
  background: linear-gradient(180deg, transparent, rgba(201,162,75,.54), rgba(134,165,196,.20), transparent);
  transform: translateX(-50%);
}
.process-path__step {
  position: relative; display: grid; grid-template-columns: minmax(0,1fr) 72px minmax(0,1fr);
  gap: 18px; align-items: center;
}
.process-path__node {
  position: relative; z-index: 2; grid-column: 2; width: 54px; height: 54px; border-radius: 18px;
  display: grid; place-items: center; justify-self: center;
  background: linear-gradient(145deg, var(--accent), rgba(201,162,75,.62));
  color: var(--bg); font: 900 14px/1 ui-monospace, 'SF Mono', Consolas, monospace;
  box-shadow: 0 0 0 7px rgba(201,162,75,.12), 0 16px 34px rgba(0,0,0,.24);
}
.process-path__card {
  position: relative; min-height: 76px; border-radius: 21px; padding: 16px 19px;
  background: linear-gradient(145deg, rgba(255,255,255,.065), rgba(255,255,255,.026));
  border: 1px solid rgba(255,255,255,.13);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.08);
}
.process-path__card::after {
  content: ""; position: absolute; top: 50%; width: 18px; height: 1px;
  background: rgba(201,162,75,.38);
}
.process-path__step--left .process-path__card { grid-column: 1; }
.process-path__step--left .process-path__card::after { right: -19px; }
.process-path__step--right .process-path__card { grid-column: 3; }
.process-path__step--right .process-path__card::after { left: -19px; }
.process-path__label {
  color: var(--accent); font-size: 10.5px; font-weight: 850; letter-spacing: .14em;
  text-transform: uppercase; margin-bottom: 5px;
}
.process-path__card h3 {
  margin: 0; color: var(--text); font-size: 18px; line-height: 1.18; font-weight: 800;
}
.process-path__card p {
  margin: 7px 0 0; color: var(--text-muted); font-size: 15.4px; line-height: 1.32;
}
.process-path.pp-count-2,
.process-path.pp-count-3 { gap: 16px; }
.process-path.pp-count-2 .process-path__card,
.process-path.pp-count-3 .process-path__card { min-height: 98px; padding: 20px 22px; }
.process-path.pp-count-2 .process-path__card h3,
.process-path.pp-count-3 .process-path__card h3 { font-size: 21px; }
.process-path.pp-count-2 .process-path__card p,
.process-path.pp-count-3 .process-path__card p { font-size: 17px; line-height: 1.38; }

/* ---------- 6) PROBLEMS_SOLUTIONS diff_view ----------
   #E56259/#61C454 are INTENTIONALLY raw hex (git-diff red/green convention),
   not semantic tokens — see comment in layouts.ts problemsSolutionsDiffView. */
.df-block { border-radius: 12px; overflow: hidden; border: 1px solid var(--border); font-family: ui-monospace, 'SF Mono', Consolas, monospace; }
.df-line { display: flex; align-items: flex-start; gap: 14px; padding: 14px 20px; font-size: 14.5px; line-height: 1.5; }
.df-line--rm { background: rgba(229,98,89,0.08); color: var(--text-muted); text-decoration: line-through; text-decoration-color: rgba(229,98,89,0.4); }
.df-line--add { background: rgba(97,196,84,0.08); color: var(--text); border-bottom: 1px solid var(--border); }
.df-marker { font-weight: 700; width: 16px; flex-shrink: 0; }
.df-line--rm .df-marker { color: #E56259; }
.df-line--add .df-marker { color: #61C454; }

/* DARK: PROBLEMS_SOLUTIONS diagnosis-to-action matrix */
.content-block--ps-matrix { gap: 22px; }
.ps-matrix {
  min-height: 410px; display: grid; grid-template-rows: auto 1fr; gap: 16px;
  position: relative;
}
.ps-matrix::before {
  content: ""; position: absolute; left: 34px; top: 68px; bottom: 26px; width: 1px;
  background: linear-gradient(180deg, rgba(201,162,75,.48), rgba(201,162,75,.08));
}
.ps-matrix__context {
  margin: 0 0 2px 74px; max-width: 900px; color: var(--text-muted); font-size: 18px;
  line-height: 1.38;
}
.ps-matrix__rows { display: grid; gap: 13px; align-content: center; }
.ps-matrix__row {
  position: relative; display: grid; grid-template-columns: 54px minmax(0,1fr) 42px minmax(0,1fr);
  gap: 14px; align-items: stretch;
}
.ps-matrix__num {
  position: relative; z-index: 1; width: 54px; height: 54px; border-radius: 50%;
  display: grid; place-items: center; align-self: center;
  background: var(--accent); color: var(--bg); font: 900 15px/1 ui-monospace, 'SF Mono', Consolas, monospace;
  box-shadow: 0 0 0 7px rgba(201,162,75,.14);
}
.ps-matrix__cell {
  min-height: 88px; border-radius: 20px; padding: 18px 20px;
  border: 1px solid rgba(255,255,255,.12); display: flex; flex-direction: column; justify-content: center;
}
.ps-matrix__cell span {
  color: var(--accent); font-size: 11px; font-weight: 850; letter-spacing: .14em;
  text-transform: uppercase; margin-bottom: 8px;
}
.ps-matrix__cell p { margin: 0; color: var(--text); font-size: 17.5px; line-height: 1.34; }
.ps-matrix__cell--problem {
  background: linear-gradient(145deg, rgba(255,255,255,.06), rgba(255,255,255,.026));
}
.ps-matrix__cell--solution {
  background: linear-gradient(145deg, rgba(201,162,75,.16), rgba(255,255,255,.035));
  border-color: rgba(201,162,75,.25);
}
.ps-matrix__arrow {
  align-self: center; justify-self: center; width: 34px; height: 34px; border-radius: 50%;
  display: grid; place-items: center; color: var(--accent); background: rgba(201,162,75,.10);
  border: 1px solid rgba(201,162,75,.22); font-size: 20px; line-height: 1;
}

/* DARK_PREMIUM READABILITY ----------------------------------
   Keep the dark-academia look, but make it presentation-first: larger body
   text, brighter secondary copy, tighter canvas padding, and bigger text in
   the dark-only decorative concepts. Scoped to .style-dark so the other
   active engines/themes are untouched. */
.style-dark.slide {
  --pad-x: 82px;
  --pad-y: 60px;
}
.style-dark .content-block { gap: 30px; }
.style-dark .content-block__head { max-width: 1040px; }
.style-dark .h2 { font-size: 48px; line-height: 1.06; }
.style-dark .lead { font-size: 25px; line-height: 1.42; color: var(--text-muted); }
.style-dark .text { font-size: 20px; line-height: 1.45; }
.style-dark .text--sm { font-size: 18px; line-height: 1.45; }
.style-dark .card .text--sm { font-size: 19px; line-height: 1.42; }
.style-dark .muted,
.style-dark .points__body,
.style-dark .step__body,
.style-dark .metric__lbl,
.style-dark .problem-stat__lbl,
.style-dark .batafsil__points li,
.style-dark .finding__interpretation,
.style-dark .finding__limitation {
  color: var(--text-muted);
}
.style-dark .points { gap: 16px; }
.style-dark .points__item { gap: 17px; }
.style-dark .points__body { font-size: 20px; line-height: 1.46; }
.style-dark .points__heading { color: var(--text); }
.style-dark .points__icon {
  width: 42px; height: 42px;
  border-color: rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.06);
}
.style-dark .points__dot { width: 11px; height: 11px; margin-top: 9px; }
.style-dark .prose-body { font-size: 21px; line-height: 1.55; max-width: 72ch; }
.style-dark .prose-body--roomy { font-size: 25px; line-height: 1.5; }
.style-dark .prose-body--compact { font-size: 19px; line-height: 1.52; }
.style-dark .card {
  padding: 28px;
  background: rgba(255,255,255,0.065);
  border-color: rgba(255,255,255,0.14);
}
.style-dark .card .h3,
.style-dark .card h3 { font-size: 27px; line-height: 1.14; }
.style-dark .card__icon { width: 46px; height: 46px; }
.style-dark .step { padding: 20px; gap: 11px; }
.style-dark .step__title { font-size: 20px; line-height: 1.2; }
.style-dark .step__body { font-size: 17px; line-height: 1.42; }
.style-dark .grid-4 .step,
.style-dark .grid-5 .step { padding: 15px; gap: 9px; }
.style-dark .grid-4 .step__title,
.style-dark .grid-5 .step__title { font-size: 17.5px; }
.style-dark .grid-4 .step__body,
.style-dark .grid-5 .step__body { font-size: 15.5px; line-height: 1.38; }
.style-dark .agenda__label { font-size: 21px; line-height: 1.28; }
.style-dark .agenda__num { font-size: 24px; }
.style-dark .metric__lbl { font-size: 17px; }
.style-dark .source-note { font-size: 13px; color: var(--text-muted); }
.style-dark .compare__list li { font-size: 18.5px; line-height: 1.38; }
.style-dark .compare-metrics__label { font-size: 15px; }
.style-dark .compare-metrics__before { font-size: 17px; }
.style-dark .compare-metrics__after { font-size: 26px; }
.style-dark .wm-split { grid-template-columns: minmax(0,1.08fr) minmax(360px,.92fr); gap: 30px; }
.style-dark .wm-points .points__item { padding: 8px 0; }
.style-dark .wm-visual-content,
.style-dark .wm-visual-example { height: 322px; }
.style-dark .gh-panel { padding: 40px 44px; max-width: 860px; }
.style-dark .gh-term { font-size: 52px; }
.style-dark .gh-def { font-size: 21px; line-height: 1.45; color: var(--text-muted); }
.style-dark .zs-card { width: 420px; padding: 30px 34px; }
.style-dark .zs-title { font-size: 21px; }
.style-dark .zs-text { font-size: 16px; line-height: 1.42; color: var(--text-muted); }
.style-dark .gm-card { min-height: 190px; padding: 28px 26px; }
.style-dark .gm-lbl { font-size: 15px; }
.style-dark .gm-desc { font-size: 14.5px; line-height: 1.35; color: var(--text-muted); }
.style-dark .sq-card { padding: 25px 24px; }
.style-dark .sq-title { font-size: 18px; line-height: 1.2; }
.style-dark .sq-text { font-size: 16px; line-height: 1.38; color: var(--text-muted); }
.style-dark .sq-map { min-height: 458px; padding-top: 2px; align-items: center; }
.style-dark .sq-count-3 .sq-grid { grid-template-columns: repeat(3, 1fr); align-items: stretch; }
.style-dark .sq-count-3 .sq-card { min-height: 200px; display: flex; flex-direction: column; justify-content: center; }
.style-dark .sq-count-3 .sq-map__core { display: none; }
.style-dark .sq-count-4 .sq-grid { grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); max-width: 1040px; margin: 0 auto; gap: 18px; }
.style-dark .turlar-grid.grid-4 .card { padding: 18px; }
.style-dark .turlar-grid.grid-4 .card__icon { width: 36px; height: 36px; margin-bottom: 8px; }
.style-dark .turlar-grid.grid-4 .h3 { font-size: 20px; line-height: 1.12; }
.style-dark .turlar-grid.grid-4 .text--sm { font-size: 15.5px; line-height: 1.3; }
.style-dark .sq-grid.grid-4 .sq-card { padding: 22px 24px; min-height: 134px; display: flex; flex-direction: column; justify-content: center; }
.style-dark .sq-grid.grid-4 .sq-icon { width: 38px; height: 38px; margin-bottom: 10px; }
.style-dark .sq-grid.grid-4 .sq-title { font-size: 20px; line-height: 1.16; }
.style-dark .sq-grid.grid-4 .sq-text { font-size: 17px; line-height: 1.34; }
.style-dark .content-block--dossier .h2 { font-size: 48px; line-height: 1.06; }
.style-dark .content-block--dossier .content-block__head { max-width: 1080px; }
.style-dark .content-block--dossier .content-block__body { align-self: center; }
.style-dark .ds-prose { color: var(--text); }
.style-dark .ds-note,
.style-dark .ds-line__body { color: var(--text-muted); }
.style-dark .rl-track { padding: 56px 18px; }
.style-dark .rl-card { padding: 18px 18px; }
.style-dark .rl-title-sm { font-size: 19px; }
.style-dark .rl-body { font-size: 16px; line-height: 1.36; color: var(--text-muted); }
.style-dark .cl-row { gap: 16px; padding: 16px 0; }
.style-dark .cl-linenum { font-size: 13px; color: var(--text-muted); opacity: .74; }
.style-dark .cl-dot { width: 8px; height: 8px; }
.style-dark .cl-text { font-size: 19px; line-height: 1.42; }
.style-dark .mg-body { font-size: 21px; line-height: 1.55; }
.style-dark .mg-margin { gap: 16px; }
.style-dark .mg-note__text { font-size: 16px; line-height: 1.35; }
.style-dark .sp-radar { width: 180px; height: 180px; }
.style-dark .sp-ring--1 { inset: 54px; }
.style-dark .sp-ring--2 { inset: 27px; }
.style-dark .sp-core { inset: 82px; }
.style-dark .sp-body { font-size: 22px; line-height: 1.45; max-width: 700px; }
.style-dark .sp-readout { font-size: 16px; line-height: 1.35; }
.style-dark .ts-track__lbl { font-size: 15px; }
.style-dark .kc-chain { gap: 10px; }
.style-dark .kc-key { padding: 18px 14px; }
.style-dark .kc-key__title { font-size: 16px; line-height: 1.2; }
.style-dark .kc-key__body { font-size: 15.5px; line-height: 1.34; color: var(--text-muted); }
.style-dark .kc-plus { font-size: 18px; }
.style-dark .df-line { font-size: 16.5px; line-height: 1.38; padding: 15px 20px; }
`;
}
