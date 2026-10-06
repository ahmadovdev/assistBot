import { Theme, getTheme, THEMES } from './theme';
import { getDocumentCss } from './document';
import {
  renderTitle, renderStats, renderComparison,
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

function renderOne(theme: Theme, slide: DeckSlide, pageNo: number): string {
  const fn = RENDERERS[slide.type];
  if (!fn) throw new Error(`No renderer registered for slide type: ${slide.type}`);
  const data = { ...((slide.content ?? {}) as Record<string, unknown>), pageNo: String(pageNo).padStart(2, '0') };
  return fn(data, theme);
}

export function buildDeck(themeId: string, slides: DeckSlide[]): string {
  if (!(THEMES as Record<string, Theme>)[themeId]) {
    throw new Error(`Unknown theme: ${themeId}`);
  }
  const theme = getTheme(themeId);
  const css = getDocumentCss(themeId);
  const body = slides.map((s, i) => renderOne(theme, s, i + 1)).join('\n');
  return `<!doctype html>
<html lang="uz"><head><meta charset="utf-8"><style>${css}</style></head>
<body><div class="deck">${body}</div></body></html>`;
}
