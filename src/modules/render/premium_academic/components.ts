// premium_academic/components.ts
// Shared building blocks reused across most of the 21 slide types:
//   frame        — the universal `.pa-inner` karkas (kicker-row / body / footer-note)
//   kickerRow    — top-left kicker + top-right page number
//   footerNote   — bottom-left block label + bottom-right "NN / TYPE"
// Same pure-string-template style as templates/layouts.ts / academic/components.ts.

export const safe = (s: unknown): string => (s == null ? '' : String(s));

export interface FrameOptions {
  kicker?: string;
  pageNo?: string | number;
  /** Right-hand short label shown in the footer, e.g. "REJA" or "07 / DEFINITION". */
  footerRight?: string;
  /** Extra class on the outer .pa-slide (e.g. a per-type modifier). */
  className?: string;
}

function kickerRow(kicker: string | undefined, pageNo: string | number | undefined): string {
  if (!kicker && pageNo == null) return '<div></div>';
  return `
    <div class="pa-kicker-row">
      <div class="pa-kicker">${safe(kicker)}</div>
      ${pageNo != null ? `<div class="pa-slide-no">${safe(pageNo)}</div>` : ''}
    </div>`;
}

function footerNote(left: string | undefined, right: string | undefined): string {
  if (!left && !right) return '<div></div>';
  return `
    <div class="pa-footer-note">
      <span>${safe(left ?? '')}</span>
      <span>${safe(right ?? '')}</span>
    </div>`;
}

/** Universal karkas: `.pa-slide > .pa-inner` (kicker-row / body / footer-note),
 *  matching the source design's per-slide `<div class="inner">` structure.
 *  `body` is wrapped in ONE `.pa-body` div so it occupies exactly the middle
 *  `1fr` grid row — `.pa-inner`'s `grid-template-rows: auto 1fr auto` only
 *  defines 3 explicit rows, so passing multiple top-level siblings straight
 *  through (e.g. an `<h2>` plus a list div) would overflow into
 *  grid-auto-generated implicit rows instead of stacking inside the 1fr row,
 *  leaving a large blank gap where the 1fr space went to just the first
 *  sibling. */
export function frame(body: string, opts: FrameOptions = {}): string {
  const cls = opts.className ? ` ${opts.className}` : '';
  return `
  <section class="pa-slide${cls}">
    <div class="pa-inner">
      ${kickerRow(opts.kicker, opts.pageNo)}
      <div class="pa-body">${body}</div>
      ${footerNote(undefined, opts.footerRight)}
    </div>
  </section>`;
}
