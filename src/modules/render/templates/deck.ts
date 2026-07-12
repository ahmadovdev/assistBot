import { Theme, getTheme, THEMES } from './theme';
import { getDocumentCss } from './document';
import { WIKIMEDIA_VISUAL_CSS } from './wikimedia-visual';
import {
  renderTitle, renderStats, renderInsight, renderComparison,
  renderProcess, renderTimeline, renderAgenda,
  renderContent, renderDefinition, renderConclusion, renderReferences, renderClosing,
  renderBatafsil, renderMisol, renderTurlar,
  renderRelevance, renderAimTasks, renderObjectSubject, renderFinding,
  renderProblemsSolutions,
} from './layouts';

export interface DeckSlide {
  type: string;
  content: unknown;
}

type Renderer = (data: any, theme: Theme) => string;

const RENDERERS: Record<string, Renderer> = {
  TITLE: renderTitle,
  AGENDA: renderAgenda,
  CONTENT: renderContent,
  DEFINITION: renderDefinition,
  BATAFSIL: renderBatafsil,
  MISOL: renderMisol,
  TURLAR: renderTurlar,
  COMPARISON: renderComparison,
  PROCESS: renderProcess,
  TIMELINE: renderTimeline,
  STATS: renderStats,
  CONCLUSION: renderConclusion,
  REFERENCES: renderReferences,
  CLOSING: renderClosing,
  RELEVANCE: renderRelevance,
  AIM_TASKS: renderAimTasks,
  OBJECT_SUBJECT: renderObjectSubject,
  FINDING: renderFinding,
  PROBLEMS_SOLUTIONS: renderProblemsSolutions,
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
  const css = `${getDocumentCss(id)}\n${WIKIMEDIA_VISUAL_CSS}`;
  const body = slides.map((s, i) => renderOne(theme, s, i + 1)).join('\n');
  return `<!doctype html>
<html lang="uz"><head><meta charset="utf-8"><style>${css}</style></head>
<body><div class="deck">${body}</div></body></html>`;
}
