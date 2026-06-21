// visuals.ts
// Returns inline SVG strings for theme-appropriate decorations.
// Drop into <div class="slide__visual">{html}</div> on any slide
// for personality without changing the layout.

import { getTheme, ThemeColors } from './theme';

export type VisualVariant = 'hero' | 'corner' | 'background';

/**
 * Returns an SVG string for the given theme and variant.
 * `instanceId` is appended to internal SVG IDs (gradients, patterns)
 * to prevent collisions when multiple visuals are placed in the
 * same HTML document. Pass a per-slide identifier (e.g. slide index).
 */
export function getThemeVisual(
  themeId: string,
  variant: VisualVariant,
  instanceId: string = '0',
): string {
  const t = getTheme(themeId);
  switch (t.style) {
    case 'minimal':   return minimalVisual(variant, t.colors, instanceId);
    case 'dark':      return darkVisual(variant, t.colors, instanceId);
    case 'editorial': return editorialVisual(variant, t.colors, instanceId);
    case 'pastel':    return pastelVisual(variant, t.colors, instanceId);
    case 'bento':     return bentoVisual(variant, t.colors, instanceId);
  }
}

const uid = (prefix: string, instance: string) => `${prefix}-${instance}`;

// ============================================================
// MINIMAL — thin geometric lines
// ============================================================
function minimalVisual(v: VisualVariant, c: ThemeColors, i: string): string {
  switch (v) {
    case 'hero':
      return `<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg"
                   style="width:100%;height:100%">
        <g stroke="${c.accent}" stroke-width="1" fill="none">
          <line x1="40"  y1="60"  x2="560" y2="60"/>
          <line x1="40"  y1="60"  x2="40"  y2="340"/>
          <circle cx="300" cy="200" r="120"/>
          <circle cx="300" cy="200" r="80"/>
          <line x1="180" y1="200" x2="420" y2="200"/>
          <line x1="300" y1="80"  x2="300" y2="320"/>
        </g>
      </svg>`;

    case 'corner':
      return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"
                   style="width:100%;height:100%">
        <g stroke="${c.accent}" stroke-width="1" fill="none" opacity="0.4">
          <path d="M 0 100 L 200 100"/>
          <path d="M 100 0 L 100 200"/>
          <circle cx="100" cy="100" r="60"/>
        </g>
      </svg>`;

    case 'background': {
      const id = uid('grid', i);
      return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg"
                   preserveAspectRatio="none" style="width:100%;height:100%">
        <defs>
          <pattern id="${id}" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 L 0 80" fill="none"
                  stroke="${c.border}" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="1280" height="720" fill="url(#${id})" opacity="0.4"/>
      </svg>`;
    }
  }
}

// ============================================================
// DARK — glowing orbs, gradient meshes
// ============================================================
function darkVisual(v: VisualVariant, c: ThemeColors, i: string): string {
  switch (v) {
    case 'hero': {
      const a = uid('orb-a', i), b = uid('orb-b', i);
      return `<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg"
                   style="width:100%;height:100%">
        <defs>
          <radialGradient id="${a}" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stop-color="${c.accent}" stop-opacity="0.9"/>
            <stop offset="50%"  stop-color="${c.accent}" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="${c.accent}" stop-opacity="0"/>
          </radialGradient>
          <radialGradient id="${b}" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stop-color="${c.accentSoft}" stop-opacity="0.85"/>
            <stop offset="50%"  stop-color="${c.accentSoft}" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="${c.accentSoft}" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <circle cx="200" cy="180" r="180" fill="url(#${a})"/>
        <circle cx="420" cy="250" r="150" fill="url(#${b})"/>
      </svg>`;
    }

    case 'corner': {
      const id = uid('cnr', i);
      return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"
                   style="width:100%;height:100%">
        <defs>
          <radialGradient id="${id}" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stop-color="${c.accent}" stop-opacity="0.6"/>
            <stop offset="100%" stop-color="${c.accent}" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="100" fill="url(#${id})"/>
      </svg>`;
    }

    case 'background': {
      const m1 = uid('mesh-a', i), m2 = uid('mesh-b', i);
      return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg"
                   preserveAspectRatio="none" style="width:100%;height:100%">
        <defs>
          <radialGradient id="${m1}" cx="78%" cy="-10%" r="60%">
            <stop offset="0%"   stop-color="${c.accent}" stop-opacity="0.22"/>
            <stop offset="100%" stop-color="${c.accent}" stop-opacity="0"/>
          </radialGradient>
          <radialGradient id="${m2}" cx="8%" cy="110%" r="55%">
            <stop offset="0%"   stop-color="${c.accentSoft}" stop-opacity="0.14"/>
            <stop offset="100%" stop-color="${c.accentSoft}" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="1280" height="720" fill="url(#${m1})"/>
        <rect width="1280" height="720" fill="url(#${m2})"/>
      </svg>`;
    }
  }
}

// ============================================================
// EDITORIAL — solid color blocks, dots pattern
// ============================================================
function editorialVisual(v: VisualVariant, c: ThemeColors, i: string): string {
  switch (v) {
    case 'hero':
      return `<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg"
                   style="width:100%;height:100%">
        <rect x="40"  y="40"  width="180" height="180" fill="${c.accent}"/>
        <rect x="240" y="120" width="280" height="80"  fill="${c.text}"/>
        <rect x="40"  y="240" width="280" height="120" fill="${c.text}"/>
        <rect x="340" y="240" width="180" height="120" fill="${c.accent}"/>
      </svg>`;

    case 'corner':
      return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"
                   style="width:100%;height:100%">
        <rect x="0"  y="0"  width="120" height="120" fill="${c.accent}"/>
        <rect x="80" y="80" width="120" height="120" fill="${c.text}"/>
      </svg>`;

    case 'background': {
      const id = uid('dots-ed', i);
      return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg"
                   preserveAspectRatio="none" style="width:100%;height:100%">
        <defs>
          <pattern id="${id}" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="2" fill="${c.text}" opacity="0.08"/>
          </pattern>
        </defs>
        <rect width="1280" height="720" fill="url(#${id})"/>
      </svg>`;
    }
  }
}

// ============================================================
// PASTEL — organic blob shapes
// ============================================================
function pastelVisual(v: VisualVariant, c: ThemeColors, _i: string): string {
  switch (v) {
    case 'hero':
      return `<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg"
                   style="width:100%;height:100%">
        <path d="M 120 80 C 180 40 260 60 320 100 C 380 140 420 220 380 280
                 C 340 340 240 360 180 320 C 120 280 80 200 100 140
                 C 110 110 110 95 120 80 Z"
              fill="${c.accent}" opacity="0.55"/>
        <path d="M 320 160 C 380 140 440 180 460 240 C 480 300 440 360 380 360
                 C 320 360 280 320 280 260 C 280 220 290 180 320 160 Z"
              fill="${c.accentSoft}" opacity="0.5"/>
        <path d="M 80 240 C 110 220 150 240 160 280 C 170 320 140 360 100 350
                 C 60 340 50 290 70 260 C 73 254 76 248 80 240 Z"
              fill="${c.accent}" opacity="0.35"/>
      </svg>`;

    case 'corner':
      return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"
                   style="width:100%;height:100%">
        <path d="M 100 20 C 150 20 180 70 170 120 C 160 170 100 190 60 170
                 C 20 150 20 90 50 50 C 65 30 80 22 100 20 Z"
              fill="${c.accent}" opacity="0.5"/>
      </svg>`;

    case 'background':
      return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg"
                   preserveAspectRatio="none" style="width:100%;height:100%">
        <path d="M 1100 -80 C 1240 -40 1340 120 1280 240
                 C 1220 360 1060 320 980 220 C 900 120 960 -120 1100 -80 Z"
              fill="${c.accent}" opacity="0.35"/>
        <path d="M -60 600 C 80 540 220 620 220 720 L -60 720 Z"
              fill="${c.accentSoft}" opacity="0.35"/>
      </svg>`;
  }
}

// ============================================================
// BENTO — rounded cards, dotted background
// ============================================================
function bentoVisual(v: VisualVariant, c: ThemeColors, i: string): string {
  switch (v) {
    case 'hero':
      return `<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg"
                   style="width:100%;height:100%">
        <rect x="40"  y="40"  width="260" height="160" rx="16" fill="${c.text}"/>
        <rect x="320" y="40"  width="240" height="160" rx="16" fill="${c.accent}"/>
        <rect x="40"  y="220" width="160" height="140" rx="16" fill="${c.accentSoft}"/>
        <rect x="220" y="220" width="160" height="140" rx="16"
              fill="${c.surface}" stroke="${c.border}" stroke-width="1"/>
        <rect x="400" y="220" width="160" height="140" rx="16"
              fill="${c.surface}" stroke="${c.border}" stroke-width="1"/>
      </svg>`;

    case 'corner':
      return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"
                   style="width:100%;height:100%">
        <rect x="20"  y="20"  width="80" height="80" rx="12" fill="${c.accent}"/>
        <rect x="110" y="20"  width="70" height="70" rx="12" fill="${c.accentSoft}"/>
        <rect x="20"  y="110" width="70" height="70" rx="12" fill="${c.text}"/>
        <rect x="100" y="100" width="80" height="80" rx="12"
              fill="${c.surface}" stroke="${c.border}" stroke-width="1"/>
      </svg>`;

    case 'background': {
      const id = uid('bento-dots', i);
      return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg"
                   preserveAspectRatio="none" style="width:100%;height:100%">
        <defs>
          <pattern id="${id}" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="${c.text}" opacity="0.08"/>
          </pattern>
        </defs>
        <rect width="1280" height="720" fill="url(#${id})"/>
      </svg>`;
    }
  }
}
