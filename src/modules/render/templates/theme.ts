export interface ThemeConfig {
  bg: string;
  surface: string;
  accent: string;
  text: string;
  muted: string;
  fontHeading: string;
  fontBody: string;
}

export const DEFAULT_THEME: ThemeConfig = {
  bg: '#1a1d29',
  surface: '#262b3b',
  accent: '#ec4899',
  text: '#e8eaf0',
  muted: '#9aa1b2',
  fontHeading: 'Playfair Display',
  fontBody: 'Inter',
};

export function resolveTheme(config: unknown): ThemeConfig {
  const c = (config ?? {}) as Partial<ThemeConfig>;
  return { ...DEFAULT_THEME, ...c };
}

export function themeCssVars(t: ThemeConfig): string {
  return [
    `--bg:${t.bg}`,
    `--surface:${t.surface}`,
    `--accent:${t.accent}`,
    `--text:${t.text}`,
    `--muted:${t.muted}`,
    `--font-heading:'${t.fontHeading}',Georgia,serif`,
    `--font-body:'${t.fontBody}',-apple-system,Segoe UI,Roboto,sans-serif`,
  ].join(';');
}

export function googleFontsUrl(t: ThemeConfig): string {
  const fam = (name: string, weights: string) =>
    `family=${encodeURIComponent(name).replace(/%20/g, '+')}:wght@${weights}`;
  return (
    'https://fonts.googleapis.com/css2?' +
    fam(t.fontHeading, '600;700') +
    '&' +
    fam(t.fontBody, '400;600;700') +
    '&display=swap'
  );
}
