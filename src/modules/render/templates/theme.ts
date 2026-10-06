// theme.ts
// Design tokens for all 5 presentation themes.
// Pure data — no rendering logic here.

export type ThemeStyle =
  | 'minimal'
  | 'dark'
  | 'editorial'
  | 'pastel'
  | 'bento'
  | 'academic';

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

// Academic palettes for university students. Restrained, scholarly colours
// (navy, gold, crimson, terracotta, teal) + serif display fonts for a credible
// academic feel. Ids + style keys are kept so DB/PPTX/preview references and
// the .style-{name} CSS overrides stay valid.
export const THEMES = {
  // Klassik — warm paper, deep navy, serif. The flagship scholarly look.
  editorial_minimal: {
    id: 'editorial_minimal',
    name: 'Klassik',
    colors: {
      bg:         '#FBFAF6',
      surface:    '#FFFFFF',
      text:       '#1B2A3A',
      textMuted:  '#6C7580',
      accent:     '#1F4E79',
      accentSoft: '#4A6B8A',
      border:     '#E4E1D9',
    },
    fonts:  { display: 'Source Serif 4', body: 'Inter' },
    radius: { sm: '3px', md: '6px', lg: '10px' },
    style:  'minimal' as ThemeStyle,
  },

  // Tungi — dark-academia: deep ink slate, muted gold, serif.
  dark_premium: {
    id: 'dark_premium',
    name: 'Tungi',
    colors: {
      bg:         '#15181F',
      surface:    'rgba(255,255,255,0.05)',
      text:       '#ECE7DC',
      textMuted:  '#B8BEC8',
      accent:     '#C9A24B',
      accentSoft: '#86A5C4',
      border:     'rgba(255,255,255,0.10)',
    },
    fonts:  { display: 'Lora', body: 'Inter' },
    radius: { sm: '6px', md: '10px', lg: '14px' },
    style:  'dark' as ThemeStyle,
  },

  // Jurnal — editorial white, academic crimson, high-contrast serif.
  bold_editorial: {
    id: 'bold_editorial',
    name: 'Jurnal',
    colors: {
      bg:         '#FFFFFF',
      surface:    '#FAF7F1',
      text:       '#17130E',
      textMuted:  '#57524B',
      accent:     '#8B2635',
      accentSoft: '#17130E',
      border:     '#E7E2D9',
    },
    fonts:  { display: 'Playfair Display', body: 'Source Sans 3' },
    radius: { sm: '0px', md: '0px', lg: '0px' },
    style:  'editorial' as ThemeStyle,
  },

  // Ilmiy — humanities: warm cream, terracotta, sage, Baskerville serif.
  soft_pastel: {
    id: 'soft_pastel',
    name: 'Ilmiy',
    colors: {
      bg:         '#FAF4EB',
      surface:    '#FFFFFF',
      text:       '#3A342B',
      textMuted:  '#857B6E',
      accent:     '#A65A3C',
      accentSoft: '#6E7F5B',
      border:     'rgba(58,52,43,0.12)',
    },
    fonts:  { display: 'Lora', body: 'Inter' },
    radius: { sm: '10px', md: '16px', lg: '22px' },
    style:  'pastel' as ThemeStyle,
  },

  // Zamonaviy — clean modern for sciences/tech: cool grey, deep teal, sans.
  bento_modern: {
    id: 'bento_modern',
    name: 'Zamonaviy',
    colors: {
      bg:         '#F4F5F3',
      surface:    '#FFFFFF',
      text:       '#14181A',
      textMuted:  '#626A6C',
      accent:     '#0F6E63',
      accentSoft: '#2E7D8A',
      border:     '#E1E4E0',
    },
    fonts:  { display: 'Inter', body: 'Inter' },
    radius: { sm: '8px', md: '12px', lg: '16px' },
    style:  'bento' as ThemeStyle,
  },

  // Rasmiy — academic_formal: official university/thesis-defense aesthetic
  // (blueprint navy, sealing-wax red, low-radius formal geometry). Distinct
  // from `modern_academic` below, which is rendered by a separate HTML engine
  // entirely — this one lives in the classic theme.ts/document.ts/layouts.ts
  // system alongside the other 5.
  academic_formal: {
    id: 'academic_formal',
    name: 'Rasmiy',
    colors: {
      bg:         '#0F1620',
      surface:    'rgba(237,234,226,0.052)',
      text:       '#EDEAE2',
      textMuted:  '#98A1AE',
      accent:     '#B0392E',
      accentSoft: '#5C7A99',
      border:     'rgba(237,234,226,0.14)',
    },
    fonts:  { display: 'Libre Baskerville', body: 'IBM Plex Sans' },
    radius: { sm: '2px', md: '4px', lg: '6px' },
    style:  'academic' as ThemeStyle,
  },

  // Akademik — modern_academic: rendered by the SEPARATE academic engine
  // (src/modules/render/academic), not the legacy layouts. Kept here so
  // getTheme()/PPTX/preview code that iterates themes never throws on the key.
  modern_academic: {
    id: 'modern_academic',
    name: 'Akademik',
    colors: {
      bg:         '#FFFFFF',
      surface:    '#F8FAFC',
      text:       '#0F172A',
      textMuted:  '#94A3B8',
      accent:     '#10B981',
      accentSoft: '#059669',
      border:     '#E2E8F0',
    },
    fonts:  { display: 'Inter', body: 'Inter' },
    radius: { sm: '8px', md: '12px', lg: '20px' },
    style:  'bento' as ThemeStyle,
  },

  // Nafis — premium_academic: cream-paper, serif-title thesis-defense look
  // (grid-line watermark, navy/gold accents). Rendered by its OWN separate
  // engine (src/modules/render/premium_academic), same pattern as
  // modern_academic above — kept here only so getTheme()/PPTX/preview code
  // that iterates themes never throws on the key.
  premium_academic: {
    id: 'premium_academic',
    name: 'Nafis',
    colors: {
      bg:         '#F7F4EE',
      surface:    '#FBFAF7',
      text:       '#17191D',
      textMuted:  '#6F7682',
      accent:     '#173B67',
      accentSoft: '#35436F',
      border:     '#D9D6CE',
    },
    fonts:  { display: 'Georgia', body: 'Inter' },
    radius: { sm: '6px', md: '16px', lg: '24px' },
    style:  'bento' as ThemeStyle,
  },

  // Soft Curves Research: lilac/teal glass cards and organic academic forms.
  // Rendered by its own fixed-canvas engine in src/modules/render/soft_curves.
  soft_curves_research: {
    id: 'soft_curves_research',
    name: 'Soft Curves',
    colors: {
      bg:         '#FBFAFF',
      surface:    '#FFFFFF',
      text:       '#1D1930',
      textMuted:  '#6F6983',
      accent:     '#6F4CC3',
      accentSoft: '#168C84',
      border:     'rgba(51,39,89,0.12)',
    },
    fonts:  { display: 'Manrope', body: 'DM Sans' },
    radius: { sm: '10px', md: '14px', lg: '20px' },
    style:  'pastel' as ThemeStyle,
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
