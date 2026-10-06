/** PPTX-resolved palette (solid hex, no '#', rgba flattened) per theme. */
export interface PptxTheme {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;     // brand accent (fills)
  accentSoft: string;
  border: string;
  numColor: string;   // accent used as TEXT (readable on bg)
  onAccent: string;   // text color on an accent fill
  display: string;    // heading font
  body: string;
  radius: number;     // card corner radius (inches)
  isDark: boolean;
}

// Academic palettes. Fonts are PowerPoint-SAFE (Georgia serif / Calibri sans)
// so the exported .pptx never substitutes to an ugly fallback on the user's PC.
export const PPTX_THEMES: Record<string, PptxTheme> = {
  editorial_minimal: {
    bg: 'FBFAF6', surface: 'FFFFFF', text: '1B2A3A', muted: '6C7580',
    accent: '1F4E79', accentSoft: '4A6B8A', border: 'E4E1D9',
    numColor: '1F4E79', onAccent: 'FFFFFF',
    display: 'Georgia', body: 'Calibri', radius: 0.06, isDark: false,
  },
  dark_premium: {
    bg: '15181F', surface: '222732', text: 'ECE7DC', muted: '9AA0AC',
    accent: 'C9A24B', accentSoft: '86A5C4', border: '333844',
    numColor: 'C9A24B', onAccent: '15181F',
    display: 'Georgia', body: 'Calibri', radius: 0.12, isDark: true,
  },
  bold_editorial: {
    bg: 'FFFFFF', surface: 'FAF7F1', text: '17130E', muted: '57524B',
    accent: '8B2635', accentSoft: '17130E', border: 'E7E2D9',
    numColor: '8B2635', onAccent: 'FFFFFF',
    display: 'Georgia', body: 'Calibri', radius: 0, isDark: false,
  },
  soft_pastel: {
    bg: 'FAF4EB', surface: 'FFFFFF', text: '3A342B', muted: '857B6E',
    accent: 'A65A3C', accentSoft: '6E7F5B', border: 'E5DED2',
    numColor: 'A65A3C', onAccent: 'FFFFFF',
    display: 'Georgia', body: 'Calibri', radius: 0.18, isDark: false,
  },
  bento_modern: {
    bg: 'F4F5F3', surface: 'FFFFFF', text: '14181A', muted: '626A6C',
    accent: '0F6E63', accentSoft: '2E7D8A', border: 'E1E4E0',
    numColor: '0F6E63', onAccent: 'FFFFFF',
    display: 'Calibri', body: 'Calibri', radius: 0.12, isDark: false,
  },
  modern_academic: {
    bg: 'FFFFFF', surface: 'F8FAFC', text: '0F172A', muted: '94A3B8',
    accent: '10B981', accentSoft: '059669', border: 'E2E8F0',
    numColor: '059669', onAccent: 'FFFFFF',
    display: 'Calibri', body: 'Calibri', radius: 0.12, isDark: false,
  },
  // Rasmiy (academic_formal): blueprint navy + sealing-wax red, matching
  // theme.ts's HTML tokens (rgba surface/border flattened to solid hex —
  // PPTX has no reliable alpha-over-bg compositing across all viewers).
  academic_formal: {
    bg: '0F1620', surface: '1A222E', text: 'EDEAE2', muted: '98A1AE',
    accent: 'B0392E', accentSoft: '5C7A99', border: '2E3846',
    numColor: 'B0392E', onAccent: 'EDEAE2',
    display: 'Georgia', body: 'Calibri', radius: 0.04, isDark: true,
  },
  // Nafis (premium_academic): cream paper + navy/gold — rendered by its own
  // HTML engine (src/modules/render/premium_academic), but PPTX still uses
  // the shared legacy/editable pptx renderers with this color palette, same
  // pattern as modern_academic/academic_formal above.
  premium_academic: {
    bg: 'F7F4EE', surface: 'FBFAF7', text: '17191D', muted: '6F7682',
    accent: '173B67', accentSoft: '35436F', border: 'D9D6CE',
    numColor: '173B67', onAccent: 'FFFFFF',
    display: 'Georgia', body: 'Calibri', radius: 0.16, isDark: false,
  },
  soft_curves_research: {
    bg: 'FBFAFF', surface: 'FFFFFF', text: '1D1930', muted: '6F6983',
    accent: '6F4CC3', accentSoft: '168C84', border: 'E4DEEE',
    numColor: '6F4CC3', onAccent: 'FFFFFF',
    display: 'Calibri', body: 'Calibri', radius: 0.18, isDark: false,
  },
};

export function getPptxTheme(id: string): PptxTheme {
  return PPTX_THEMES[id] ?? PPTX_THEMES.dark_premium;
}

/** Spacing scale for the editable-mode layout system (inches) — additive,
 *  does not change PptxTheme/PPTX_THEMES/getPptxTheme above. Named the same
 *  way as the render/academic token scale for consistency across renderers. */
export const PPTX_SPACING = {
  xs: 0.08,
  sm: 0.14,
  md: 0.24,
  lg: 0.36,
  xl: 0.52,
} as const;

/** PowerPoint-safe font stack. `body`/`display` per-theme values in
 *  PPTX_THEMES above already resolve to Georgia/Calibri — this is the
 *  fallback used by the new layout-plan draw helpers when a theme doesn't
 *  specify one explicitly. */
export const PPTX_FONT_FALLBACK = 'Calibri';
