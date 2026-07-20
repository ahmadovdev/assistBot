import { DeckSlide } from '../templates/deck';
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
    const renderer = RENDERERS[slide.type];
    if (!renderer) throw new Error(`No soft-curves renderer registered for slide type: ${slide.type}`);
    return renderer(data);
  }).join('\n');

  return `<!doctype html>
<html lang="uz"><head><meta charset="utf-8"><style>${SOFT_CURVES_CSS}</style></head>
<body><main class="sc-deck">${body}</main></body></html>`;
}
