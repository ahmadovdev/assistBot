import { SlideVisual } from '../../visuals/visual.types';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Historical name kept so the existing render engines do not need a wider
 * refactor. It no longer renders Wikimedia/image content: every visual slot is
 * now a deterministic geometric decoration, including older saved slides that
 * still carry a `visual.url`.
 */
export function renderWikimediaVisual(visual: SlideVisual | undefined, className = ''): string {
  if (!visual) return '';
  const seed = hash(`${visual.query}:${visual.alt}:${visual.provider}`);
  const variant = seed % 3;
  const rot = (seed % 26) - 13;
  const skew = ((seed >> 4) % 18) - 9;
  const scale = 86 + ((seed >> 8) % 22);
  const cls = `${className ? ` ${className}` : ''} wm-geometry wm-geometry--${variant}`;

  return `
    <figure class="wm-figure${cls}" aria-label="${escapeHtml(visual.alt || 'Geometric decoration')}"
      style="--wm-rot:${rot}deg;--wm-skew:${skew}deg;--wm-scale:${scale}%"></figure>`;
}

export const WIKIMEDIA_VISUAL_CSS = `
.wm-figure {
  margin:0; min-width:0; min-height:260px; position:relative; overflow:hidden;
  border-radius:14px; background:#f3f0ea; border:1px solid rgba(80,72,102,.14);
  box-shadow:0 16px 34px rgba(35,28,58,.12);
  isolation:isolate; box-sizing:border-box;
}
.wm-figure * { box-sizing:border-box; }
.wm-geometry {
  --wm-bg:#f5f1e8; --wm-ink:#173b67; --wm-accent:#b59a5b; --wm-soft:#86a5c4;
  background:
    linear-gradient(calc(90deg + var(--wm-rot)), transparent 0 39%, color-mix(in srgb, var(--wm-accent) 62%, transparent) 39% 39.6%, transparent 39.6%),
    linear-gradient(calc(20deg - var(--wm-rot)), transparent 0 47%, color-mix(in srgb, var(--wm-soft) 44%, transparent) 47% 47.7%, transparent 47.7%),
    radial-gradient(circle at 25% 48%, var(--wm-accent) 0 8px, color-mix(in srgb, var(--wm-accent) 18%, transparent) 9px 18px, transparent 19px),
    radial-gradient(circle at 76% 31%, var(--wm-soft) 0 9px, color-mix(in srgb, var(--wm-soft) 22%, transparent) 10px 22px, transparent 23px),
    radial-gradient(circle at 76% 31%, transparent 0 64px, color-mix(in srgb, var(--wm-accent) 50%, transparent) 65px 67px, transparent 68px 116px, color-mix(in srgb, var(--wm-soft) 34%, transparent) 117px 119px, transparent 120px),
    linear-gradient(calc(135deg + var(--wm-skew)), color-mix(in srgb, white 38%, transparent) 0 21%, transparent 21% 35%, color-mix(in srgb, var(--wm-ink) 8%, transparent) 35% 47%, transparent 47%),
    radial-gradient(circle at 74% 28%, color-mix(in srgb, var(--wm-accent) 36%, transparent), transparent 34%),
    linear-gradient(135deg, color-mix(in srgb, var(--wm-bg) 96%, white), color-mix(in srgb, var(--wm-soft) 18%, var(--wm-bg)));
  background-size:auto, auto, auto, auto, auto, auto, auto, auto;
}
.wm-geometry::before,
.wm-geometry::after {
  content:""; position:absolute; pointer-events:none;
}
.wm-geometry::before {
  inset:13% 11% 16% 12%;
  border:1px solid color-mix(in srgb, var(--wm-ink) 20%, transparent);
  border-radius:10px;
  transform:rotate(calc(var(--wm-rot) * -.55)) skew(var(--wm-skew));
  background:linear-gradient(135deg, color-mix(in srgb, white 25%, transparent), transparent 58%);
}
.wm-geometry::after {
  width:var(--wm-scale); max-width:220px; aspect-ratio:1; right:9%; bottom:6%;
  background:var(--wm-ink); opacity:.12; clip-path:polygon(50% 0, 100% 100%, 0 100%);
  transform:rotate(calc(var(--wm-rot) * 1.7));
}
.wm-geometry--1 { --wm-ink:#0f6e63; --wm-accent:#b0392e; --wm-soft:#d6b35a; }
.wm-geometry--2 { --wm-ink:#2c2355; --wm-accent:#9e7bff; --wm-soft:#4fc8bc; }

.style-dark .wm-geometry {
  --wm-bg:#171b23; --wm-ink:#ece7dc; --wm-accent:#c9a24b; --wm-soft:#86a5c4;
  background:
    linear-gradient(calc(90deg + var(--wm-rot)), transparent 0 39%, color-mix(in srgb, var(--wm-accent) 56%, transparent) 39% 39.6%, transparent 39.6%),
    linear-gradient(calc(20deg - var(--wm-rot)), transparent 0 47%, color-mix(in srgb, var(--wm-soft) 40%, transparent) 47% 47.7%, transparent 47.7%),
    radial-gradient(circle at 25% 48%, var(--wm-accent) 0 8px, color-mix(in srgb, var(--wm-accent) 18%, transparent) 9px 18px, transparent 19px),
    radial-gradient(circle at 76% 31%, var(--wm-soft) 0 9px, color-mix(in srgb, var(--wm-soft) 22%, transparent) 10px 22px, transparent 23px),
    radial-gradient(circle at 76% 31%, transparent 0 64px, color-mix(in srgb, var(--wm-accent) 50%, transparent) 65px 67px, transparent 68px 116px, color-mix(in srgb, var(--wm-soft) 34%, transparent) 117px 119px, transparent 120px),
    linear-gradient(calc(135deg + var(--wm-skew)), rgba(255,255,255,.07) 0 21%, transparent 21% 35%, rgba(255,255,255,.035) 35% 47%, transparent 47%),
    radial-gradient(circle at 76% 26%, color-mix(in srgb, var(--wm-accent) 32%, transparent), transparent 36%),
    linear-gradient(135deg, #20242c, #11151c);
  border-color:rgba(255,255,255,.13);
  box-shadow:0 18px 44px rgba(0,0,0,.30);
}
.style-dark .wm-geometry--1 { --wm-accent:#68d3c1; --wm-soft:#d6b35a; }
.style-dark .wm-geometry--2 { --wm-accent:#9e7bff; --wm-soft:#4fc8bc; }

.pa-wm-visual.wm-geometry {
  --wm-bg:#f7f4ee; --wm-ink:#173b67; --wm-accent:#b59a5b; --wm-soft:#8faabd;
  border-radius:var(--radius-lg); box-shadow:var(--shadow-card);
}
`;
