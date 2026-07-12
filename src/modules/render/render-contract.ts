import { DeckSlide } from './templates/deck';

export interface RenderContractIssue {
  slideIndex: number;
  slideType: string;
  path: string;
  text: string;
}

const IGNORED_KEYS = new Set([
  'layout',
  'icon',
  'pageNo',
  'total',
  'pageTotal',
  'query',
  'url',
  'sourceUrl',
  'provider',
  'author',
  'license',
  'licenseUrl',
  'alt',
]);

function stripInlineHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function normalize(value: string): string {
  return stripInlineHtml(value)
    .replace(/[ʼ‘’`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function collectVisibleStrings(
  value: unknown,
  path: string[] = [],
  out: { path: string; text: string }[] = [],
): { path: string; text: string }[] {
  if (typeof value === 'string') {
    const text = normalize(value);
    if (text.length >= 10) out.push({ path: path.join('.'), text });
    return out;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => collectVisibleStrings(item, [...path, String(index)], out));
    return out;
  }

  if (value && typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([key, child]) => {
      if (IGNORED_KEYS.has(key)) return;
      collectVisibleStrings(child, [...path, key], out);
    });
  }

  return out;
}

function containsText(renderedHtml: string, text: string): boolean {
  const rendered = normalize(renderedHtml);
  if (rendered.includes(text)) return true;

  // Some renderers split values and units into separate spans. The full
  // normalised phrase should be found in most cases; for long text, a stable
  // prefix is enough to catch genuine visibility while avoiding false fails
  // from minor whitespace/layout differences.
  if (text.length > 80 && rendered.includes(text.slice(0, 80))) return true;
  return false;
}

export function checkRenderContract(slides: DeckSlide[], renderedHtml: string): RenderContractIssue[] {
  const issues: RenderContractIssue[] = [];

  slides.forEach((slide, index) => {
    const content = (slide.content ?? {}) as Record<string, unknown>;
    const strings = collectVisibleStrings(content);
    strings.forEach((entry) => {
      if (!containsText(renderedHtml, entry.text)) {
        issues.push({
          slideIndex: index + 1,
          slideType: slide.type,
          path: entry.path,
          text: entry.text,
        });
      }
    });
  });

  return issues;
}

export function formatRenderContractIssues(issues: RenderContractIssue[]): string[] {
  return issues.map((issue) =>
    `slide ${issue.slideIndex} ${issue.slideType} ${issue.path}: ${issue.text.slice(0, 120)}`,
  );
}
