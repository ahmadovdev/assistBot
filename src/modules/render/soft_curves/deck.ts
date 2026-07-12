import { DeckSlide } from '../templates/deck';
import { WIKIMEDIA_VISUAL_CSS } from '../templates/wikimedia-visual';
import {
  SOFT_CURVES_CSS,
  renderAgenda,
  renderAimTasks,
  renderBatafsil,
  renderClosing,
  renderComparison,
  renderConclusion,
  renderContent,
  renderDefinition,
  renderFinding,
  renderMisol,
  renderObjectSubject,
  renderProblemsSolutions,
  renderProcess,
  renderReferences,
  renderRelevance,
  renderStats,
  renderTimeline,
  renderTitle,
  renderTurlar,
  renderFallback,
} from './slides';

type Renderer = (data: any) => string;

const RENDERERS: Record<string, Renderer> = {
  TITLE: renderTitle,
  AGENDA: renderAgenda,
  RELEVANCE: renderRelevance,
  AIM_TASKS: renderAimTasks,
  OBJECT_SUBJECT: renderObjectSubject,
  DEFINITION: renderDefinition,
  CONTENT: renderContent,
  BATAFSIL: renderBatafsil,
  MISOL: renderMisol,
  TURLAR: renderTurlar,
  COMPARISON: renderComparison,
  PROCESS: renderProcess,
  TIMELINE: renderTimeline,
  STATS: renderStats,
  FINDING: renderFinding,
  PROBLEMS_SOLUTIONS: renderProblemsSolutions,
  CONCLUSION: renderConclusion,
  REFERENCES: renderReferences,
  CLOSING: renderClosing,
};

export function buildSoftCurvesDeck(_themeId: string, slides: DeckSlide[]): string {
  const total = slides.length;
  const body = slides.map((slide, index) => {
    const data = {
      ...((slide.content ?? {}) as Record<string, unknown>),
      pageNo: String(index + 1).padStart(2, '0'),
      total,
    };
    try {
      return (RENDERERS[slide.type] ?? renderFallback)(data);
    } catch {
      return renderFallback(data);
    }
  }).join('\n');

  return `<!doctype html>
<html lang="uz"><head><meta charset="utf-8"><style>${SOFT_CURVES_CSS}\n${WIKIMEDIA_VISUAL_CSS}</style></head>
<body><main class="sc-deck">${body}</main></body></html>`;
}
