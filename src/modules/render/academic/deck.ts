// academic/deck.ts
// Assembles the full modern_academic HTML deck. Mirrors templates/deck.ts:
// a `type -> renderer` map, per-slide try/catch, one <html> with the theme CSS
// inlined. Additionally injects the header/footer META (section number, block
// label, position dots, page number, university abbreviation) that the spec's
// header pattern requires — derived automatically from the deck, so the AI data
// (card.prompt.ts) does not need to change.

import { DeckSlide } from '../templates/deck';
import { getAcademicBaseCss } from './tokens';
import { COMPONENTS_CSS } from './components';
import {
  SLIDES_CSS, BLOCK_LABELS, AcademicMeta,
  renderTitle, renderAgenda, renderContent, renderDefinition, renderConclusion,
  renderRelevance, renderAimTasks, renderStats, renderReferences,
  renderBatafsil, renderMisol, renderTurlar, renderProcess, renderComparison,
  renderTimeline, renderFinding, renderProblemsSolutions,
  renderObjectSubject, renderClosing,
} from './slides';

type Renderer = (d: any) => string;

const RENDERERS: Record<string, Renderer> = {
  TITLE: renderTitle,
  AGENDA: renderAgenda,
  CONTENT: renderContent,
  DEFINITION: renderDefinition,
  CONCLUSION: renderConclusion,
  RELEVANCE: renderRelevance,
  AIM_TASKS: renderAimTasks,
  STATS: renderStats,
  REFERENCES: renderReferences,
  BATAFSIL: renderBatafsil,
  MISOL: renderMisol,
  TURLAR: renderTurlar,
  PROCESS: renderProcess,
  COMPARISON: renderComparison,
  TIMELINE: renderTimeline,
  FINDING: renderFinding,
  PROBLEMS_SOLUTIONS: renderProblemsSolutions,
  OBJECT_SUBJECT: renderObjectSubject,
  CLOSING: renderClosing,
};

/** Slides that carry no header/footer (edge-to-edge cover pages). */
const COVER_TYPES = new Set(['TITLE', 'CLOSING']);

/** Abbreviates a university name to its initials, e.g.
 *  "Toshkent Davlat Yuridik Universiteti" -> "TDYU". */
function abbreviate(name?: string): string | undefined {
  if (!name) return undefined;
  const stop = new Set(['va', 'the', 'of', 'nomidagi']);
  const letters = name
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stop.has(w.toLowerCase()))
    .map((w) => w[0].toUpperCase())
    .join('');
  return letters ? letters.slice(0, 6) : undefined;
}

function findTitle(slides: DeckSlide[]): Record<string, any> {
  const t = slides.find((s) => s.type === 'TITLE');
  return (t?.content ?? {}) as Record<string, any>;
}

/** Build the full academic deck HTML (modern_academic theme only). */
export function buildAcademicDeck(_themeId: string, slides: DeckSlide[]): string {
  const total = slides.length;
  const titleData = findTitle(slides);
  const univ = abbreviate(titleData.university);
  const year = titleData.year ? String(titleData.year) : undefined;

  const sectionTotal = slides.filter((s) => !COVER_TYPES.has(s.type)).length;
  let sectionCounter = 0;

  const body = slides
    .map((s, i) => {
      const type = s.type;
      const meta: AcademicMeta = {};
      if (!COVER_TYPES.has(type)) {
        sectionCounter++;
        meta.section = String(sectionCounter).padStart(2, '0');
        meta.label = BLOCK_LABELS[type];
        meta.dots = { total: sectionTotal, active: sectionCounter };
        meta.pageNo = String(i + 1).padStart(2, '0');
        meta.pageTotal = String(total).padStart(2, '0');
        meta.univ = univ;
      } else if (type === 'CLOSING') {
        meta.univ = univ;
        meta.year = year;
      }

      const data = { ...((s.content ?? {}) as Record<string, unknown>), ...meta };
      const fn = RENDERERS[type];
      if (!fn) throw new Error(`No academic renderer registered for slide type: ${type}`);
      return fn(data);
    })
    .join('\n');

  const css = `${getAcademicBaseCss()}\n${COMPONENTS_CSS}\n${SLIDES_CSS}`;
  return `<!doctype html>
<html lang="uz"><head><meta charset="utf-8"><style>${css}</style></head>
<body><div class="a-deck">${body}</div></body></html>`;
}
