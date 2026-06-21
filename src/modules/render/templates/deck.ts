import { Theme, getTheme, THEMES } from './theme';
import { getDocumentCss } from './document';
import {
  renderTitle, renderStats, renderProblem, renderInsight, renderComparison,
  renderProcess, renderTimeline, renderSolution, renderOpportunity,
  renderCaseStudy, renderQuote, renderRoadmap, renderCta,
} from './layouts';

export interface DeckSlide {
  type: string;
  content: unknown;
}

type Renderer = (data: any, theme: Theme) => string;

const RENDERERS: Record<string, Renderer> = {
  TITLE: renderTitle,
  STATS: renderStats,
  PROBLEM: renderProblem,
  INSIGHT: renderInsight,
  COMPARISON: renderComparison,
  PROCESS: renderProcess,
  TIMELINE: renderTimeline,
  SOLUTION: renderSolution,
  OPPORTUNITY: renderOpportunity,
  CASE_STUDY: renderCaseStudy,
  QUOTE: renderQuote,
  ROADMAP: renderRoadmap,
  CTA: renderCta,
};

const DEFAULT_THEME_ID = 'dark_premium';

function safeThemeId(themeId: string): string {
  return (THEMES as Record<string, Theme>)[themeId] ? themeId : DEFAULT_THEME_ID;
}

function renderOne(theme: Theme, slide: DeckSlide, pageNo: number): string {
  const fn = RENDERERS[slide.type] ?? renderInsight;
  const data = { ...((slide.content ?? {}) as Record<string, unknown>), pageNo: String(pageNo).padStart(2, '0') };
  try {
    return fn(data, theme);
  } catch {
    // never let one malformed slide break the whole deck
    return renderInsight({ statement: (data as any).title ?? '\u2026' } as any, theme);
  }
}

export function buildDeck(themeId: string, slides: DeckSlide[]): string {
  const id = safeThemeId(themeId);
  const theme = getTheme(id);
  const css = getDocumentCss(id);
  const body = slides.map((s, i) => renderOne(theme, s, i + 1)).join('\n');
  return `<!doctype html>
<html lang="uz"><head><meta charset="utf-8"><style>${css}</style></head>
<body><div class="deck">${body}</div></body></html>`;
}
