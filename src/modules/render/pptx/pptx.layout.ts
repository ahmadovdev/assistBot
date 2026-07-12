// pptx.layout.ts
// Types for the editable-mode pipeline:
//   content -> buildPptxSlidePlan() -> validate -> renderSlidePlan()
// A "plan" is a flat, declarative list of boxes (text/image/shape) with
// final inch coordinates — computed ONCE per slide, then handed to
// pptx.draw.ts's dumb drawing functions. This is what lets pptx.text-fit.ts
// shrink a font size or truncate text BEFORE anything is drawn, instead of
// discovering overflow only after PowerPoint has already rendered it.

export type PptxBoxKind = 'text' | 'shape' | 'image';

export interface PptxLayoutBox {
  id: string;
  kind: PptxBoxKind;
  x: number;
  y: number;
  w: number;
  h: number;
  z?: number;
}

export type PptxTextRole = 'kicker' | 'title' | 'lead' | 'body' | 'side' | 'footer' | 'source';

export interface PptxTextBox extends PptxLayoutBox {
  kind: 'text';
  /** Plain string, or pptxgenjs rich-text runs (for inline bold from
   *  <strong> — see pptx.builder.ts's existing `parseStrong`/`rich`). */
  text: string | { text: string; options?: Record<string, unknown> }[];
  role: PptxTextRole;
  fontFace: string;
  fontSize: number;
  color: string;
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
  valign?: 'top' | 'middle' | 'bottom';
  lineSpacingMultiple?: number;
  charSpacing?: number;
  /** Fully transparent text (used by hybrid mode's "phantom edit" overlay —
   *  see pptx.hybrid.ts). 0-100, pptxgenjs `transparency` option. */
  transparency?: number;
  margin?: number;
  /** How pptx.text-fit.ts should react if this box's text doesn't fit at
   *  `fontSize`: shrink the font once toward a minimum, truncate with an
   *  ellipsis, or leave it fixed (caller has already sized the box safely). */
  fitPolicy?: 'fixed' | 'shrink-once' | 'truncate';
  /** Floor for 'shrink-once' — ignored otherwise. */
  minFontSize?: number;
}

export interface PptxImageBox extends PptxLayoutBox {
  kind: 'image';
  /** Base64 data URI (screenshot-based modes) or a filesystem path. */
  data?: string;
  path?: string;
  sizing?: 'cover' | 'contain' | 'stretch';
  altText?: string;
}

export interface PptxShapeBox extends PptxLayoutBox {
  kind: 'shape';
  shape: 'rect' | 'roundRect' | 'line' | 'ellipse';
  fill?: string;
  line?: string;
  radius?: number;
}

export type PptxAnyBox = PptxTextBox | PptxImageBox | PptxShapeBox;

export interface PptxSlidePlan {
  type: string;
  variant?: string;
  mode: 'pixelPerfect' | 'editable' | 'hybrid';
  boxes: PptxAnyBox[];
  /** Filled in by pptx.text-fit.ts / buildPptxSlidePlan() when a box had to
   *  be shrunk or truncated to fit — surfaced via RenderPptxOptions.debug. */
  warnings: string[];
}

/** Validates a plan against the canvas — flags any box that still extends
 *  past the slide edges after text-fit has run (should be rare; a safety
 *  net, not the primary overflow defense). */
export function validateSlidePlan(plan: PptxSlidePlan, canvasW: number, canvasH: number): string[] {
  const issues: string[] = [];
  for (const box of plan.boxes) {
    if (box.x < 0 || box.y < 0 || box.x + box.w > canvasW + 0.01 || box.y + box.h > canvasH + 0.01) {
      issues.push(`${plan.type}/${box.id}: box out of bounds (x=${box.x.toFixed(2)} y=${box.y.toFixed(2)} w=${box.w.toFixed(2)} h=${box.h.toFixed(2)})`);
    }
  }
  return issues;
}
