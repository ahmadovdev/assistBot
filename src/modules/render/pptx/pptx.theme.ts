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

export const PPTX_THEMES: Record<string, PptxTheme> = {
  editorial_minimal: {
    bg: 'FAFAF7', surface: 'FFFFFF', text: '0A2540', muted: '8A8A80',
    accent: '0A2540', accentSoft: '44566C', border: 'D8D8CF',
    numColor: '0A2540', onAccent: 'FFFFFF',
    display: 'IBM Plex Sans', body: 'Inter', radius: 0.04, isDark: false,
  },
  dark_premium: {
    bg: '0A0A0F', surface: '16161C', text: 'EDEDF2', muted: '9A9AB0',
    accent: '7C5CFF', accentSoft: '00D4FF', border: '26262E',
    numColor: '00D4FF', onAccent: 'FFFFFF',
    display: 'Inter', body: 'Inter', radius: 0.16, isDark: true,
  },
  bold_editorial: {
    bg: 'FFFDF5', surface: 'FFFFFF', text: '1A1A1A', muted: '454540',
    accent: 'FFD93D', accentSoft: '1A1A1A', border: '1A1A1A',
    numColor: '1A1A1A', onAccent: '1A1A1A',
    display: 'Space Grotesk', body: 'Inter', radius: 0, isDark: false,
  },
  soft_pastel: {
    bg: 'FFF8F1', surface: 'FFFFFF', text: '4A463F', muted: '7C776E',
    accent: 'F4A88B', accentSoft: 'A8C09A', border: 'EAE3DA',
    numColor: 'D98568', onAccent: 'FFFFFF',
    display: 'DM Serif Display', body: 'Inter', radius: 0.22, isDark: false,
  },
  bento_modern: {
    bg: 'F2F2F0', surface: 'FFFFFF', text: '111111', muted: '6B6B68',
    accent: 'FF6B35', accentSoft: '2D6BFF', border: 'E4E4E0',
    numColor: 'FF6B35', onAccent: 'FFFFFF',
    display: 'Inter', body: 'Inter', radius: 0.12, isDark: false,
  },
};

export function getPptxTheme(id: string): PptxTheme {
  return PPTX_THEMES[id] ?? PPTX_THEMES.dark_premium;
}
