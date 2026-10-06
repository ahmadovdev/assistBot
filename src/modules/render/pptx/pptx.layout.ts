// pptx.layout.ts
// Types for the direct hybrid PPTX pipeline:
//   content -> build plan -> renderSlidePlan()
// A "plan" is a flat, declarative list of boxes (text/image/shape) with
// final inch coordinates — computed ONCE per slide, then handed to
// pptx.draw.ts's drawing functions.

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
  /** Plain string, or pptxgenjs rich-text runs. */
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
  mode: 'pixelPerfect' | 'hybrid';
  boxes: PptxAnyBox[];
  warnings: string[];
}
