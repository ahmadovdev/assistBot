// pptx.grid.ts
// Stable layout grid (inches) for the editable-mode layout-plan system.
// Values are deliberately close to what pptx.builder.ts's hand-tuned
// functions already use (M=0.7 margin, kicker at ~0.55-0.6, title at
// ~0.6-1.0, content starting ~2.0-2.4, footer/source near the bottom edge)
// so migrated slide types don't look jarringly different from the
// not-yet-migrated ones sharing the same deck.

import { PPTX_CANVAS } from './pptx.constants';

const { width: W, height: H } = PPTX_CANVAS;

export const PPTX_GRID = {
  marginX: 0.7,
  marginTop: 0.55,
  marginBottom: 0.5,

  contentX: 0.7,
  contentW: W - 2 * 0.7, // 11.933

  // Two-column "side panel" zone (comparison/relevance-style layouts).
  sideX: 9.35,
  sideW: W - 9.35 - 0.7,

  kickerY: 0.55,
  kickerH: 0.35,

  titleY: 0.95,
  titleH: 0.9,

  // Used when a kicker is present and pushes the title down (matches the
  // existing `d.kicker ? 1.0 : 0.7` pattern throughout pptx.builder.ts).
  titleYNoKicker: 0.7,

  leadY: 1.95,
  leadH: 0.7,

  bodyY: 2.3,
  bodyH: H - 2.3 - 0.6, // ~4.6, leaves room for a footer/source line

  footerY: H - 0.55,
  footerH: 0.3,
} as const;
