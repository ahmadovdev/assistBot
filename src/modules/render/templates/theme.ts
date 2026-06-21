// theme.ts
// Design tokens for all 5 presentation themes.
// Pure data — no rendering logic here.

export type ThemeStyle = 'minimal' | 'dark' | 'editorial' | 'pastel' | 'bento';

export interface ThemeColors {
  bg: string;
  surface: string;
  text: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  border: string;
}

export interface ThemeFonts {
  display: string; // Google Fonts family name, e.g. "IBM Plex Sans"
  body: string;
}

export interface ThemeRadius {
  sm: string;
  md: string;
  lg: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
  radius: ThemeRadius;
  style: ThemeStyle;
}

export const THEMES = {
  editorial_minimal: {
    id: 'editorial_minimal',
    name: 'Editorial Minimal',
    colors: {
      bg:         '#FAFAF7',
      surface:    '#FFFFFF',
      text:       '#0A2540',
      textMuted:  '#8A8A80',
      accent:     '#0A2540',
      accentSoft: '#44566C',
      border:     '#D8D8CF',
    },
    fonts:  { display: 'IBM Plex Sans', body: 'Inter' },
    radius: { sm: '2px', md: '4px', lg: '8px' },
    style:  'minimal' as ThemeStyle,
  },

  dark_premium: {
    id: 'dark_premium',
    name: 'Dark Premium',
    colors: {
      bg:         '#0A0A0F',
      surface:    'rgba(255,255,255,0.04)',
      text:       '#EDEDF2',
      textMuted:  '#9A9AB0',
      accent:     '#7C5CFF',
      accentSoft: '#00D4FF',
      border:     'rgba(255,255,255,0.09)',
    },
    fonts:  { display: 'Inter', body: 'Inter' },
    radius: { sm: '8px', md: '16px', lg: '20px' },
    style:  'dark' as ThemeStyle,
  },

  bold_editorial: {
    id: 'bold_editorial',
    name: 'Bold Editorial',
    colors: {
      bg:         '#FFFDF5',
      surface:    '#FFFFFF',
      text:       '#1A1A1A',
      textMuted:  '#454540',
      accent:     '#FFD93D',
      accentSoft: '#1A1A1A',
      border:     '#1A1A1A',
    },
    fonts:  { display: 'Space Grotesk', body: 'Inter' },
    radius: { sm: '0px', md: '0px', lg: '0px' },
    style:  'editorial' as ThemeStyle,
  },

  soft_pastel: {
    id: 'soft_pastel',
    name: 'Soft Pastel',
    colors: {
      bg:         '#FFF8F1',
      surface:    '#FFFFFF',
      text:       '#4A463F',
      textMuted:  '#7C776E',
      accent:     '#F4A88B',
      accentSoft: '#A8C09A',
      border:     'rgba(0,0,0,0.08)',
    },
    fonts:  { display: 'DM Serif Display', body: 'Inter' },
    radius: { sm: '14px', md: '20px', lg: '28px' },
    style:  'pastel' as ThemeStyle,
  },

  bento_modern: {
    id: 'bento_modern',
    name: 'Bento Modern',
    colors: {
      bg:         '#F2F2F0',
      surface:    '#FFFFFF',
      text:       '#111111',
      textMuted:  '#6B6B68',
      accent:     '#FF6B35',
      accentSoft: '#2D6BFF',
      border:     '#E4E4E0',
    },
    fonts:  { display: 'Inter', body: 'Inter' },
    radius: { sm: '8px', md: '12px', lg: '16px' },
    style:  'bento' as ThemeStyle,
  },
} as const satisfies Record<string, Theme>;

export type ThemeId = keyof typeof THEMES;

export function getTheme(id: string): Theme {
  const theme = (THEMES as Record<string, Theme>)[id];
  if (!theme) throw new Error(`Unknown theme: ${id}`);
  return theme;
}

export function listThemes(): Theme[] {
  return Object.values(THEMES);
}
