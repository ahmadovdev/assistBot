export type ThemeStyle = 'aurora' | 'editorial' | 'bento' | 'softglass' | 'earthy';

export interface ThemeConfig {
  key: string;
  name: string;
  style: ThemeStyle;
  bg: string;
  surface: string;
  surface2: string;
  accent: string;
  accent2: string;
  text: string;
  muted: string;
  fontHeading: string;
  fontBody: string;
}

export const THEMES: Record<string, ThemeConfig> = {
  aurora: {
    key: 'aurora', name: '\u{1F303} Midnight Aurora', style: 'aurora',
    bg: '#161a26', surface: '#20243a', surface2: '#2a3047',
    accent: '#ec4899', accent2: '#8b5cf6', text: '#e8eaf0', muted: '#9aa1b2',
    fontHeading: 'Playfair Display', fontBody: 'Inter',
  },
  editorial: {
    key: 'editorial', name: '\u{1F4F0} Bold Editorial', style: 'editorial',
    bg: '#f7f3ec', surface: '#efe9df', surface2: '#e6dfd2',
    accent: '#ff3b1f', accent2: '#15120d', text: '#15120d', muted: '#7c756a',
    fontHeading: 'Archivo', fontBody: 'Inter',
  },
  bento: {
    key: 'bento', name: '\u{1F9E9} Bento', style: 'bento',
    bg: '#0e1014', surface: '#181b22', surface2: '#1f2330',
    accent: '#34d399', accent2: '#22d3ee', text: '#f2f4f5', muted: '#8b93a1',
    fontHeading: 'Space Grotesk', fontBody: 'Inter',
  },
  softglass: {
    key: 'softglass', name: '\u{1F388} Soft Glass', style: 'softglass',
    bg: '#ece9ff', surface: '#ffffff', surface2: '#f3f0ff',
    accent: '#7c6cf0', accent2: '#ff8fab', text: '#2b2740', muted: '#6f6a86',
    fontHeading: 'Fraunces', fontBody: 'Inter',
  },
  earthy: {
    key: 'earthy', name: '\u{1F342} Earthy Warm', style: 'earthy',
    bg: '#f3ece1', surface: '#e8ddcb', surface2: '#ded2bd',
    accent: '#c4622d', accent2: '#3c6e57', text: '#2e2a22', muted: '#7a7264',
    fontHeading: 'Spectral', fontBody: 'Inter',
  },
};

export const DEFAULT_THEME = THEMES.aurora;

export function resolveTheme(config: unknown): ThemeConfig {
  const c = (config ?? {}) as Partial<ThemeConfig>;
  if (c.key && THEMES[c.key]) return { ...THEMES[c.key], ...c } as ThemeConfig;
  if (c.style) return { ...DEFAULT_THEME, ...c } as ThemeConfig;
  return DEFAULT_THEME;
}

export function themeCssVars(t: ThemeConfig): string {
  return [
    `--bg:${t.bg}`, `--surface:${t.surface}`, `--surface2:${t.surface2}`,
    `--accent:${t.accent}`, `--accent2:${t.accent2}`,
    `--text:${t.text}`, `--muted:${t.muted}`,
    `--font-heading:'${t.fontHeading}',Georgia,serif`,
    `--font-body:'${t.fontBody}',-apple-system,Segoe UI,Roboto,sans-serif`,
  ].join(';');
}

export function googleFontsUrl(t: ThemeConfig): string {
  const fam = (name: string, weights: string) =>
    `family=${encodeURIComponent(name).replace(/%20/g, '+')}:wght@${weights}`;
  return (
    'https://fonts.googleapis.com/css2?' +
    fam(t.fontHeading, '600;700;800') + '&' +
    fam(t.fontBody, '400;600;700') + '&display=swap'
  );
}
