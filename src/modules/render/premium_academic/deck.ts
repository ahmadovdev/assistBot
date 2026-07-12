// premium_academic/deck.ts
// Assembles the full premium_academic HTML deck. Mirrors templates/deck.ts
// and academic/deck.ts: a `type -> renderer` map, per-slide try/catch, one
// <html> with the theme CSS inlined. Page numbers are injected automatically
// so the AI data (card.prompt.ts) never needs to change.

import { DeckSlide } from '../templates/deck';
import { WIKIMEDIA_VISUAL_CSS } from '../templates/wikimedia-visual';
import { getPremiumAcademicBaseCss } from './tokens';
import {
  SLIDES_CSS,
  renderTitle, renderAgenda, renderRelevance, renderAimTasks,
  renderObjectSubject, renderDefinition, renderContent, renderBatafsil, renderMisol,
  renderTurlar, renderComparison, renderProcess, renderTimeline, renderStats,
  renderFinding, renderProblemsSolutions, renderConclusion,
  renderReferences, renderClosing,
} from './slides';
import { safe } from './components';

type Renderer = (d: any) => string;

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

/** Minimal fallback — never breaks the deck on an unknown/malformed slide. */
function renderFallback(d: any): string {
  return `
  <section class="pa-slide">
    <div class="pa-inner">
      <div></div>
      <h1 class="pa-title-main">${safe(d.title ?? d.statement ?? '…')}</h1>
      <div></div>
    </div>
  </section>`;
}

/** Build the full premium_academic deck HTML. */
export function buildPremiumAcademicDeck(_themeId: string, slides: DeckSlide[]): string {
  const total = slides.length;
  const body = slides
    .map((s, i) => {
      const data = { ...((s.content ?? {}) as Record<string, unknown>), pageNo: String(i + 1).padStart(2, '0'), total };
      const fn = RENDERERS[s.type] ?? renderFallback;
      try {
        return fn(data);
      } catch {
        return renderFallback(data);
      }
    })
    .join('\n');

  const css = `${getPremiumAcademicBaseCss()}\n${SLIDES_CSS}\n${WIKIMEDIA_VISUAL_CSS}`;
  return `<!doctype html>
<html lang="uz"><head><meta charset="utf-8"><style>${css}</style></head>
<body><div class="pa-deck">${body}</div></body></html>`;
}
