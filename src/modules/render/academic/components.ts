// academic/components.ts
// The 5 shared building blocks for the modern_academic renderer
// (STITCH_PROMPT_KIT.md PART 1 "Header pattern" + shared elements):
//   frame           — universal slide karkas (safe area + header/body/footer zones)
//   slideHeader     — section № + block label + position dots
//   slideFooter     — optional univ abbrev + page number
//   citationPill    — [n] source, inline / pill / block variants
//   placeholderChip — dashed "student fills this in" chip (P0 anti-hallucination)
//
// Same string-template style as templates/layouts.ts: pure fns returning HTML.
// Components colocate their CSS in COMPONENTS_CSS (concatenated by the deck).
// Only semantic var(--*) tokens are used — no raw hex.

/** Inline-content pass-through (mirrors templates/layouts.ts `safe`). */
export const safe = (s: unknown): string => (s == null ? '' : String(s));

export interface HeaderData {
  /** Two-digit section number, e.g. "05". */
  section?: string;
  /** Block label, uppercased in CSS, e.g. "MAVZUNING DOLZARBLIGI". */
  label?: string;
  /** Position dots: total count + 1-based active index. */
  dots?: { total: number; active: number };
}

export interface FooterData {
  /** Page number "NN" (padded) — printed as "NN / TT" when total given. */
  page?: string | number;
  total?: string | number;
  /** Optional university abbreviation shown bottom-left. */
  univ?: string;
}

/** Position dots row (spec: active filled accent, rest hollow border-strong). */
function positionDots(dots?: { total: number; active: number }): string {
  if (!dots || dots.total <= 0) return '';
  const cells: string[] = [];
  for (let i = 1; i <= dots.total; i++) {
    cells.push(`<span class="a-dot${i === dots.active ? ' is-active' : ''}"></span>`);
  }
  return `<div class="a-dots">${cells.join('')}</div>`;
}

/** SlideHeader — top zone of every content slide (not TITLE/CLOSING). */
export function slideHeader(h: HeaderData): string {
  if (!h.section && !h.label && !h.dots) return '';
  return `
  <header class="a-head">
    <div class="a-head__id">
      ${h.section ? `<span class="a-head__num">${safe(h.section)}</span>` : ''}
      ${h.label ? `<span class="a-head__label">${safe(h.label)}</span>` : ''}
    </div>
    ${positionDots(h.dots)}
  </header>`;
}

/** SlideFooter — bottom zone: optional univ abbrev (left) + page number (right). */
export function slideFooter(f: FooterData): string {
  const hasPage = f.page != null;
  if (!hasPage && !f.univ) return '';
  const pageStr = hasPage
    ? f.total != null
      ? `${safe(f.page)} / ${safe(f.total)}`
      : `${safe(f.page)}`
    : '';
  return `
  <footer class="a-foot">
    <span class="a-foot__univ">${f.univ ? safe(f.univ) : ''}</span>
    ${hasPage ? `<span class="a-foot__page">${pageStr}</span>` : ''}
  </footer>`;
}

export interface FrameOptions {
  header?: HeaderData;
  footer?: FooterData;
  /** Extra class on the slide (e.g. layout modifier or "is-cover"). */
  className?: string;
  /** Full-bleed: skip the 96px safe-area wrapper (TITLE / CLOSING panels
   *  manage their own padding and touch the slide edges). */
  bleed?: boolean;
}

/**
 * SlideFrame — the universal karkas. Wraps `body` in a 1920x1080 slide with a
 * 96px safe area split into header / content / footer zones. TITLE and CLOSING
 * pass `bleed: true` for edge-to-edge panels instead.
 */
export function frame(body: string, opts: FrameOptions = {}): string {
  const cls = opts.className ? ` ${opts.className}` : '';
  if (opts.bleed) {
    return `
  <section class="a-slide${cls}">${body}</section>`;
  }
  const header = opts.header ? slideHeader(opts.header) : '';
  const footer = opts.footer ? slideFooter(opts.footer) : '';
  return `
  <section class="a-slide${cls}">
    <div class="a-safe">
      ${header}
      <div class="a-body">${body}</div>
      ${footer}
    </div>
  </section>`;
}

export type CitationVariant = 'inline' | 'pill' | 'block';

/** CitationPill — a source reference. `inline` is bare text, `pill`/`block`
 *  are bordered chips (spec: rounded 20px pill vs 8px block). */
export function citationPill(text: string, variant: CitationVariant = 'pill'): string {
  if (!text) return '';
  if (variant === 'inline') return `<span class="a-cite-inline">${safe(text)}</span>`;
  return `<span class="a-cite a-cite--${variant}">${safe(text)}</span>`;
}

/** PlaceholderChip — dashed chip the student must fill in. Keeps the AI from
 *  inventing facts (references, exact figures) it cannot know. */
export function placeholderChip(label: string): string {
  return `<span class="a-placeholder">${safe(label || 'to‘ldiring')}</span>`;
}

// ============================================================
// COMPONENT CSS  (consumed by the academic deck after base CSS)
// ============================================================

export const COMPONENTS_CSS = `
/* ---- Safe-area zone layout ---- */
.a-body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

/* ---- SlideHeader ---- */
.a-head {
  flex: none;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}
.a-head__id { display: flex; flex-direction: column; gap: 4px; }
.a-head__num,
.a-head__label {
  font-size: var(--type-label);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: var(--ls-label);
  color: var(--text-muted);
  line-height: 1.2;
}
.a-head__label { font-weight: 600; }

.a-dots { display: flex; align-items: center; gap: 6px; padding-top: 6px; }
.a-dot {
  width: 8px; height: 8px;
  border-radius: var(--radius-full);
  background: transparent;
  border: var(--stroke-1) solid var(--border-strong);
}
.a-dot.is-active { background: var(--accent); border-color: var(--accent); }

/* ---- SlideFooter ---- */
.a-foot {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}
.a-foot__univ,
.a-foot__page {
  font-size: var(--type-label);
  color: var(--text-muted);
  letter-spacing: 0.04em;
}
.a-foot__univ { text-transform: uppercase; letter-spacing: var(--ls-label); }

/* ---- CitationPill ---- */
.a-cite-inline {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.4;
}
.a-cite {
  display: inline-block;
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--surface-raised);
  border: var(--stroke-1) solid var(--border);
  padding: 8px 16px;
}
.a-cite--pill  { border-radius: var(--radius-lg); }
.a-cite--block { border-radius: var(--radius-sm); }

/* ---- PlaceholderChip ---- */
.a-placeholder {
  display: inline-block;
  font-size: var(--type-label);
  font-weight: 500;
  color: var(--text-muted);
  background: transparent;
  border: var(--stroke-1) dashed var(--border-strong);
  border-radius: var(--radius-sm);
  padding: 6px 14px;
}

/* ---- Shared inline icon sizing (reuses templates/icons.ts <svg class="ico">) ---- */
.ico { flex: none; }
`;
