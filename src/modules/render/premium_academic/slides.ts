// premium_academic/slides.ts
// The render functions consume the REAL project data
// interfaces from templates/layouts.ts (no schema/prompt changes needed).
// Where the source design's example content was demo-specific (fake case
// rows, fake labeled comparison rows, a fake headline stat number), the
// layout was simplified to fit the actual AI-generated data shape rather
// than inventing fields the schemas don't produce.

import {
  TitleData, AgendaData, RelevanceData, AimTasksData, ObjectSubjectData,
  DefinitionData, ContentData, BatafsilData, MisolData, TurlarData,
  ComparisonData, ProcessData, TimelineData, StatsData, FindingData,
  ProblemsSolutionsData, ConclusionData, ReferencesData, ClosingData,
} from '../templates/layouts';
import { safe, frame } from './components';
import { renderWikimediaVisual } from '../templates/wikimedia-visual';

export const BLOCK_LABELS: Record<string, string> = {
  AGENDA: 'REJA',
  CONTENT: 'MAZMUNIY QISM',
  DEFINITION: "TA'RIF",
  BATAFSIL: 'BATAFSIL BAYON',
  MISOL: 'AMALIY MISOL',
  TURLAR: 'TURLARI VA TASNIFI',
  COMPARISON: 'QIYOSIY TAHLIL',
  PROCESS: 'JARAYON BOSQICHLARI',
  TIMELINE: 'XRONOLOGIYA',
  STATS: "ASOSIY KO'RSATKICHLAR",
  CONCLUSION: 'XULOSA',
  REFERENCES: 'FOYDALANILGAN ADABIYOTLAR',
  RELEVANCE: 'MAVZUNING DOLZARBLIGI',
  AIM_TASKS: 'MAQSAD VA VAZIFALAR',
  OBJECT_SUBJECT: "TADQIQOT OB'YEKTI VA PREDMETI",
  FINDING: 'TADQIQOT NATIJALARI',
  PROBLEMS_SOLUTIONS: 'MUAMMOLAR VA YECHIMLAR',
};

function gridClass(n: number): string {
  return n >= 4 ? 'pa-grid-4' : n === 3 ? 'pa-grid-3' : 'pa-grid-2';
}

const LETTERS = 'ABCDEFGH';

/** Auto-shrink for the biggest headline element, by word count. */
function heroSize(text: string, big: number, mid: number, small: number): number {
  const w = text.trim().split(/\s+/).filter(Boolean).length;
  return w <= 7 ? big : w <= 12 ? mid : small;
}

/** Auto-shrink for body-length text (a sentence up to a short paragraph) in a
 *  fixed-height box — `tiers` are `[maxWords, px]` pairs, ascending, checked
 *  in order; the last tier's size is the floor for anything longer. Needed
 *  because AI "paragraph" prose mode can be 5-10x longer than the short
 *  headline text these slides were originally designed around. */
function fitSize(text: string, tiers: [number, number][]): number {
  const w = text.trim().split(/\s+/).filter(Boolean).length;
  for (const [maxWords, px] of tiers) if (w <= maxWords) return px;
  return tiers[tiers.length - 1][1];
}

// ============================================================
// 01 TITLE
// ============================================================
export function renderTitle(d: TitleData & { pageNo?: string | number }): string {
  // Narrower column (~half the 1280px canvas) than the classic engine's
  // full-width title — smaller ceiling than the source design's 82px, which
  // wrapped Uzbek's longer compound words to 4 lines and crowded the meta rows.
  const fs = heroSize(d.title, 50, 42, 36);
  const metaRows = [
    d.student ? `<div>${safe(d.student)}${d.group ? ` · ${safe(d.group)}` : ''}</div>` : '',
    d.advisor ? `<div>Ilmiy rahbar: ${safe(d.advisor)}</div>` : '',
    d.direction ? `<div>${safe(d.direction)}</div>` : '',
  ].filter(Boolean).join('');

  return `
  <section class="pa-slide pa-title-slide">
    <div class="pa-inner">
      <div class="pa-cover-grid">
        <div>
          <div class="pa-kicker">${safe(d.ministry ?? d.faculty ?? 'Akademik taqdimot')}</div>
          <h1 class="pa-title-serif pa-cover-title" style="font-size:${fs}px">${safe(d.title)}</h1>
          <div class="pa-cover-meta">
            ${d.university ? `<div>${safe(d.university)}</div>` : ''}
            ${d.department ? `<div>${safe(d.department)}</div>` : ''}
            ${metaRows}
          </div>
        </div>
        <div class="pa-research-panel">
          <div class="pa-axis"></div>
          <div class="pa-doc-lines"><span></span><span></span><span></span><span></span><span></span></div>
          <div class="pa-cover-stamp">${safe(d.workType ?? d.city ?? 'Ilmiy ish')}${d.year ? ` · ${safe(d.year)}` : ''}</div>
        </div>
      </div>
      <div></div>
      <div class="pa-footer-note"><span></span><span>01 / TITLE</span></div>
    </div>
  </section>`;
}

// ============================================================
// 02 AGENDA
// ============================================================
export function renderAgenda(d: AgendaData & { pageNo?: string | number }): string {
  const items = d.items.slice(0, 6);
  const compact = items.length > 4;
  const body = `
    <h2 class="pa-title-main">${safe(d.title)}</h2>
    <div class="pa-agenda-list${compact ? ' pa-agenda-list--compact' : ''}">
      ${items.map((it, i) => `
        <div class="pa-agenda-item">
          <div class="pa-agenda-num">${String(i + 1).padStart(2, '0')}</div>
          <div><h3>${safe(it.text)}</h3></div>
        </div>
      `).join('')}
    </div>`;
  return frame(body, { kicker: d.kicker ?? 'Reja', pageNo: d.pageNo, footerRight: `${BLOCK_LABELS.AGENDA}` });
}

// ============================================================
// 04 RELEVANCE
// ============================================================
export function renderRelevance(d: RelevanceData & { pageNo?: string | number }): string {
  if (d.paragraph !== undefined) {
    const body = `
      <h2 class="pa-title-main">${safe(d.title)}</h2>
      <div class="pa-prose-block">${safe(d.paragraph)}</div>
      ${d.source ? `<div class="pa-source pa-source--relevance">${safe(d.source)}</div>` : ''}`;
    return frame(body, { kicker: d.kicker ?? 'Dolzarblik', pageNo: d.pageNo, footerRight: BLOCK_LABELS.RELEVANCE });
  }
  const points = (d.points ?? []).slice(0, 3);
  const body = `
    <h2 class="pa-title-main">${safe(d.title)}</h2>
    ${d.lead ? `<p class="pa-subtitle" style="margin-top:14px">${safe(d.lead)}</p>` : ''}
    <div>
      <div class="pa-grid-3">
        ${points.map((p, i) => `
          <div class="pa-card">
            <div class="pa-label">Sabab ${String(i + 1).padStart(2, '0')}</div>
            <h3>${safe(p.text)}</h3>
          </div>
        `).join('')}
      </div>
      ${d.stat || d.source ? `
        <div class="pa-relevance-stat">
          <div class="pa-callout"><strong>${d.stat ? `${safe(d.stat.approx ? '~' : '')}${safe(d.stat.value)}${safe(d.stat.unit ?? '')} — ${safe(d.stat.label)}` : "Xulosa uchun ma'lumot"}</strong></div>
          ${d.source ? `<div class="pa-source">${safe(d.source)}</div>` : ''}
        </div>` : ''}
    </div>`;
  return frame(body, { kicker: d.kicker ?? 'Dolzarblik', pageNo: d.pageNo, footerRight: BLOCK_LABELS.RELEVANCE });
}

// ============================================================
// 05 AIM_TASKS
// ============================================================
export function renderAimTasks(d: AimTasksData & { pageNo?: string | number }): string {
  const aimText = d.paragraph ?? d.aim;
  // `paragraph` prose mode can be a full sentence-length paragraph (~80+
  // words), far longer than the short `aim` this card was designed for —
  // shrink to fit so real content doesn't get clipped by the card's fixed
  // height (the slide itself stays a fixed, print-safe size — see tokens.ts).
  const aimFs = fitSize(aimText, [[15, 32], [30, 26], [50, 22], [999, 19]]);
  const tasks = d.tasks.slice(0, 5);
  const body = `
    <h2 class="pa-title-main">${safe(d.title)}</h2>
    <div class="pa-aim-layout">
      <div class="pa-card emphasis">
        <div class="pa-label">Maqsad</div>
        <h3 style="font-size:${aimFs}px; line-height:1.3;">${safe(aimText)}</h3>
      </div>
      <div class="pa-task-list">
        ${tasks.map((t, i) => `
          <div class="pa-task"><div class="pa-marker">${i + 1}</div><div><h3>${safe(t)}</h3></div></div>
        `).join('')}
      </div>
    </div>`;
  return frame(body, { kicker: d.kicker ?? 'Maqsad va vazifalar', pageNo: d.pageNo, footerRight: BLOCK_LABELS.AIM_TASKS });
}

// ============================================================
// 06 OBJECT_SUBJECT
// ============================================================
export function renderObjectSubject(d: ObjectSubjectData & { pageNo?: string | number }): string {
  if (d.paragraph !== undefined) {
    const body = `
      <h2 class="pa-title-main">${safe(d.title)}</h2>
      <div class="pa-prose-block">${safe(d.paragraph)}</div>`;
    return frame(body, { kicker: d.kicker ?? "Ob'ekt va predmet", pageNo: d.pageNo, footerRight: BLOCK_LABELS.OBJECT_SUBJECT });
  }
  const body = `
    <h2 class="pa-title-main">${safe(d.title)}</h2>
    <div class="pa-object-subject">
      <div class="pa-panel">
        <div class="pa-kicker">Ob'ekt</div>
        <h3>${safe(d.object.label)}</h3>
        <p class="pa-text">${safe(d.object.text)}</p>
      </div>
      <div class="pa-panel">
        <div class="pa-kicker">Predmet</div>
        <h3>${safe(d.subject.label)}</h3>
        <p class="pa-text">${safe(d.subject.text)}</p>
      </div>
    </div>`;
  return frame(body, { kicker: d.kicker ?? "Ob'ekt va predmet", pageNo: d.pageNo, footerRight: BLOCK_LABELS.OBJECT_SUBJECT });
}

// ============================================================
// 07 DEFINITION
// ============================================================
export function renderDefinition(d: DefinitionData & { pageNo?: string | number }): string {
  const termFs = heroSize(d.term, 56, 46, 38);
  const aspects = (d.aspects ?? []).slice(0, 3);
  const body = `
    <h2 class="pa-title-main">${safe(d.kicker ?? 'Taʼrif')}</h2>
    <div class="pa-definition-layout">
      <div class="pa-term-card">
        <div>
          <div class="pa-label" style="color:rgba(255,255,255,.82)">Termin</div>
          <div class="pa-term" style="font-size:${termFs}px">${safe(d.term)}</div>
        </div>
      </div>
      <div>
        <p class="pa-definition-copy">${safe(d.paragraph ?? d.definition)}</p>
        ${aspects.length ? `
          <div class="pa-aspect-grid">
            ${aspects.map((a) => `<div class="pa-card flat"><div class="pa-label">${safe(a.label)}</div><p class="pa-small">${safe(a.text)}</p></div>`).join('')}
          </div>` : ''}
      </div>
    </div>`;
  return frame(body, { kicker: d.kicker ?? "Ta'rif", pageNo: d.pageNo, footerRight: BLOCK_LABELS.DEFINITION });
}

// ============================================================
// 08 CONTENT
// ============================================================
export function renderContent(d: ContentData & { pageNo?: string | number }): string {
  if (d.visual) {
    const points = (d.points ?? []).slice(0, 4);
    const titleFs = heroSize(d.title, 50, 43, 37);
    const paragraphText = d.paragraph ?? '';
    const paragraphFs = fitSize(paragraphText, [[38, 22], [62, 20], [86, 18], [999, 16]]);
    const copy = d.paragraph !== undefined
      ? `<div class="pa-prose-block pa-prose-block--visual" style="font-size:${paragraphFs}px">${safe(d.paragraph)}</div>`
      : `<div class="pa-visual-points">${points.map((point, index) => `
          <div class="pa-card flat pa-visual-point">
            <div class="pa-label">${String(index + 1).padStart(2, '0')}</div>
            ${point.heading ? `<h3>${safe(point.heading)}</h3>` : ''}<p class="pa-small">${safe(point.text)}</p>
          </div>`).join('')}</div>`;
    const body = `<h2 class="pa-title-main" style="font-size:${titleFs}px">${safe(d.title)}</h2>
      <div class="pa-media-layout"><div class="pa-media-copy">${copy}${d.lead ? `<p class="pa-content-lead">${safe(d.lead)}</p>` : ''}</div>${renderWikimediaVisual(d.visual, 'pa-wm-visual')}</div>`;
    return frame(body, { kicker: d.kicker ?? 'Mazmun', pageNo: d.pageNo, footerRight: BLOCK_LABELS.CONTENT, className: 'pa-has-visual' });
  }
  if (d.paragraph !== undefined) {
    const body = `
      <h2 class="pa-title-main">${safe(d.title)}</h2>
      <div class="pa-prose-block">${safe(d.paragraph)}</div>`;
    return frame(body, { kicker: d.kicker ?? 'Mazmun', pageNo: d.pageNo, footerRight: BLOCK_LABELS.CONTENT });
  }
  // No more silently dropping `text` when `heading` is absent (previously: a
  // 40-char slice of `text` stood in as a fake heading and the rest of
  // `text` was never shown at all).
  const points = d.points.slice(0, 4);
  const titleFs = heroSize(d.title, 50, 43, 37);
  const pointWords = points.reduce((sum, p) => sum + `${p.heading ?? ''} ${p.text}`.trim().split(/\s+/).filter(Boolean).length, 0);
  const pointFs = pointWords <= 34 ? 17 : pointWords <= 46 ? 16 : 15;
  const headingFs = points.length >= 4 ? 22 : 24;
  const body = `
    <h2 class="pa-title-main" style="font-size:${titleFs}px">${safe(d.title)}</h2>
    <div class="pa-evidence-layout pa-evidence-layout--${points.length}${d.lead ? ' pa-evidence-layout--with-lead' : ''}">
      <div class="pa-grid-2 pa-content-card-grid">
        ${points.map((p, i) => `
          <div class="pa-card pa-content-card">
            <div class="pa-label">${String(i + 1).padStart(2, '0')}</div>
            ${p.heading ? `<h3 style="font-size:${headingFs}px">${safe(p.heading)}</h3>` : ''}
            <p class="pa-small" style="font-size:${pointFs}px">${safe(p.text)}</p>
          </div>
        `).join('')}
      </div>
      ${d.lead ? `<p class="pa-content-lead">${safe(d.lead)}</p>` : ''}
    </div>`;
  return frame(body, { kicker: d.kicker ?? 'Mazmun', pageNo: d.pageNo, footerRight: BLOCK_LABELS.CONTENT });
}

// ============================================================
// 09 BATAFSIL
// ============================================================
export function renderBatafsil(d: BatafsilData & { pageNo?: string | number }): string {
  const points = (d.points ?? []).slice(0, 3);
  const mainText = d.paragraph ?? d.body;
  const titleFs = heroSize(d.title, 50, 43, 37);
  const bodyFs = fitSize(mainText, [[42, 21], [62, 19], [999, 17]]);
  const noteWords = points.reduce((sum, p) => sum + p.text.trim().split(/\s+/).filter(Boolean).length, 0);
  const noteFs = noteWords <= 24 ? 18 : noteWords <= 34 ? 16.5 : 15;
  // `paragraph` prose mode routinely arrives without `points` (they're
  // independent optional fields) — without this, the 2-column grid kept a
  // fixed 300px side column for nothing, leaving the right half of the slide
  // blank. Collapse to full width when there's nothing to put there.
  const body = `
    <h2 class="pa-title-main" style="font-size:${titleFs}px">${safe(d.title)}</h2>
    <div class="pa-deep-dive pa-deep-dive--${points.length}" style="${points.length ? '' : 'grid-template-columns:1fr'}">
      <div class="pa-deep-paragraph" style="font-size:${bodyFs}px">${safe(mainText)}</div>
      ${points.length ? `
        <div class="pa-side-notes">
          ${points.map((p, i) => `<div class="pa-card flat pa-side-note"><div class="pa-label">Eslatma ${i + 1}</div><h3 style="font-size:${noteFs}px">${safe(p.text)}</h3></div>`).join('')}
        </div>` : ''}
    </div>`;
  return frame(body, { kicker: d.kicker ?? 'Batafsil bayon', pageNo: d.pageNo, footerRight: BLOCK_LABELS.BATAFSIL, className: 'pa-batafsil-slide' });
}

// ============================================================
// 10 MISOL
// ============================================================
export function renderMisol(d: MisolData & { pageNo?: string | number }): string {
  const exampleText = d.paragraph ?? d.body;
  const exampleFs = fitSize(exampleText, [[45, 22], [70, 20], [95, 18], [999, 16]]);
  const takeawayFs = fitSize(d.takeaway ?? '', [[12, 28], [22, 24], [999, 20]]);
  const titleFs = heroSize(d.title, 50, 43, 37);
  if (d.visual) {
    const body = `<h2 class="pa-title-main" style="font-size:${titleFs}px">${safe(d.title)}</h2>
      <div class="pa-case-note-layout">
        <div class="pa-case-note">
          <div class="pa-case-note__rail">CASE</div>
          <div>
            <div class="pa-label">Amaliy misol</div>
            <p class="pa-text" style="font-size:${exampleFs}px">${safe(exampleText)}</p>
            ${d.takeaway ? `<div class="pa-visual-takeaway">${safe(d.takeaway)}</div>` : ''}
          </div>
        </div>
        ${renderWikimediaVisual(d.visual, 'pa-wm-visual')}
      </div>`;
    return frame(body, { kicker: d.kicker ?? 'Amaliy misol', pageNo: d.pageNo, footerRight: BLOCK_LABELS.MISOL, className: 'pa-has-visual' });
  }
  const hasTakeaway = !!d.takeaway;
  const body = `
    <h2 class="pa-title-main" style="font-size:${titleFs}px">${safe(d.title)}</h2>
    <div class="pa-example-layout pa-example-layout--note" style="${hasTakeaway ? '' : 'grid-template-columns:1fr'}">
      <div class="pa-case-note">
        <div class="pa-case-note__rail">CASE</div>
        <div>
          <div class="pa-label">Amaliy misol</div>
          <p class="pa-text" style="font-size:${exampleFs}px">${safe(exampleText)}</p>
        </div>
      </div>
      ${hasTakeaway ? `
        <div class="pa-card emphasis">
          <div class="pa-label">Xulosa</div>
          <h3 style="font-size:${takeawayFs}px">${safe(d.takeaway)}</h3>
        </div>` : ''}
    </div>`;
  return frame(body, { kicker: d.kicker ?? 'Amaliy misol', pageNo: d.pageNo, footerRight: BLOCK_LABELS.MISOL });
}

// ============================================================
// 11 TURLAR
// ============================================================
export function renderTurlar(d: TurlarData & { pageNo?: string | number }): string {
  const items = d.items.slice(0, 4);
  const body = `
    <h2 class="pa-title-main">${safe(d.title)}</h2>
    <div class="pa-turlar-grid ${gridClass(items.length)}">
      ${items.map((it, i) => `
        <div class="pa-card pa-type-card">
          <div class="pa-type-top"><div class="pa-academic-icon"></div><div class="pa-marker">${LETTERS[i] ?? i + 1}</div></div>
          <div><h3>${safe(it.label)}</h3><p class="pa-small">${safe(it.text)}</p></div>
        </div>
      `).join('')}
    </div>`;
  return frame(body, { kicker: d.kicker ?? 'Turlari', pageNo: d.pageNo, footerRight: BLOCK_LABELS.TURLAR });
}

// ============================================================
// 12 COMPARISON
// ============================================================
export function renderComparison(d: ComparisonData & { pageNo?: string | number }): string {
  const col = (side: ComparisonData['left']) => `
    <div class="pa-compare-col">
      <div class="pa-compare-head"><div class="pa-label">${safe(side.label)}</div>${side.title ? `<h3>${safe(side.title)}</h3>` : ''}</div>
      <div class="pa-compare-body">
        ${side.items.slice(0, 5).map((it) => `<div class="pa-compare-row"><span class="pa-text">${safe(it)}</span></div>`).join('')}
      </div>
    </div>`;
  const body = `
    <h2 class="pa-title-main">${safe(d.title)}</h2>
    ${d.subtitle ? `<p class="pa-subtitle" style="margin-top:10px">${safe(d.subtitle)}</p>` : ''}
    <div class="pa-comparison">${col(d.left)}${col(d.right)}</div>`;
  return frame(body, { kicker: d.kicker ?? 'Qiyosiy tahlil', pageNo: d.pageNo, footerRight: BLOCK_LABELS.COMPARISON });
}

// ============================================================
// 13 PROCESS
// ============================================================
export function renderProcess(d: ProcessData & { pageNo?: string | number }): string {
  const steps = d.steps.slice(0, 5);
  const titleFs = heroSize(d.title, 50, 43, 37);
  const body = `
    <h2 class="pa-title-main" style="font-size:${titleFs}px">${safe(d.title)}</h2>
    ${d.subtitle ? `<p class="pa-subtitle" style="margin-top:10px">${safe(d.subtitle)}</p>` : ''}
    <div class="pa-process-flow pa-process-flow--${steps.length}">
      <div class="pa-process-spine"></div>
      ${steps.map((s, i) => `
        <article class="pa-process-note ${i % 2 ? 'pa-process-note--right' : 'pa-process-note--left'}">
          <div class="pa-process-index">${String(i + 1).padStart(2, '0')}</div>
          <div class="pa-process-paper">
            ${s.label ? `<div class="pa-label">${safe(s.label)}</div>` : ''}
            <h3>${safe(s.title)}</h3>
            <p>${safe(s.body)}</p>
          </div>
        </article>
      `).join('')}
    </div>`;
  return frame(body, { kicker: d.kicker ?? 'Jarayon', pageNo: d.pageNo, footerRight: BLOCK_LABELS.PROCESS });
}

// ============================================================
// 14 TIMELINE
// ============================================================
export function renderTimeline(d: TimelineData & { pageNo?: string | number }): string {
  const steps = d.steps.slice(0, 5);
  const body = `
    <h2 class="pa-title-main">${safe(d.title)}</h2>
    ${d.subtitle ? `<p class="pa-subtitle" style="margin-top:10px">${safe(d.subtitle)}</p>` : ''}
    <div class="pa-timeline" style="grid-template-columns:repeat(${steps.length},1fr)">
      ${steps.map((s) => `
        <div class="pa-event"><div class="pa-date">${safe(s.date)}</div><h3>${safe(s.title)}</h3><p class="pa-small">${safe(s.body)}</p></div>
      `).join('')}
    </div>`;
  return frame(body, { kicker: d.kicker ?? 'Xronologiya', pageNo: d.pageNo, footerRight: BLOCK_LABELS.TIMELINE });
}

// ============================================================
// 15 STATS
// ============================================================
export function renderStats(d: StatsData & { pageNo?: string | number }): string {
  const stats = d.stats.slice(0, 4);
  const body = `
    <h2 class="pa-title-main">${safe(d.title)}</h2>
    ${d.subtitle ? `<p class="pa-subtitle" style="margin-top:10px">${safe(d.subtitle)}</p>` : ''}
    <div class="${gridClass(stats.length)} pa-stats-grid">
      ${stats.map((s) => `
        <div class="pa-card pa-stat-card">
          <div>
            <div class="pa-label">${safe(s.label)}</div>
            <div><span class="pa-value">${s.approx ? '~' : ''}${safe(s.value)}</span>${s.unit ? `<span class="pa-unit">${safe(s.unit)}</span>` : ''}</div>
          </div>
          ${s.description ? `<p class="pa-small">${safe(s.description)}</p>` : ''}
        </div>
      `).join('')}
    </div>
    ${d.insight ? `<p class="pa-subtitle" style="margin-top:14px">${safe(d.insight)}</p>` : ''}
    ${d.source ? `<div class="pa-source" style="margin-top:14px">${safe(d.source)}</div>` : ''}`;
  return frame(body, { kicker: d.kicker ?? 'Statistika', pageNo: d.pageNo, footerRight: BLOCK_LABELS.STATS });
}

// ============================================================
// 16 FINDING
// ============================================================
export function renderFinding(d: FindingData & { pageNo?: string | number }): string {
  const points = (d.points ?? []).slice(0, 2);
  const evidenceFs = fitSize(d.evidence, [[35, 21], [58, 19], [85, 17], [999, 15.5]]);
  const interpretationFs = fitSize(d.interpretation ?? '', [[22, 20], [45, 18], [999, 16]]);
  const titleFs = heroSize(d.title, 46, 40, 34);
  const body = `
    <h2 class="pa-title-main" style="font-size:${titleFs}px">${safe(d.title)}</h2>
    <div class="pa-finding-layout">
      <div class="pa-result-card">
        <div class="pa-label" style="color:rgba(255,255,255,.82)">Asosiy natija</div>
        <p class="pa-text" style="color:#fff;font-size:${evidenceFs}px">${safe(d.evidence)}</p>
        ${d.source ? `<div class="pa-source" style="color:rgba(255,255,255,.6);margin-top:16px">${safe(d.source)}</div>` : ''}
      </div>
      <div class="pa-evidence-stack">
        ${points.map((p, i) => `<div class="pa-card"><div class="pa-label">Dalil ${i + 1}</div><h3 style="font-size:19px">${safe(p.text)}</h3></div>`).join('')}
        ${d.interpretation ? `<div class="pa-interpretation"><div class="pa-kicker">Tahlil</div><p class="pa-text" style="font-size:${interpretationFs}px">${safe(d.interpretation)}</p></div>` : ''}
        ${d.limitation ? `<p class="pa-micro" style="font-style:italic">${safe(d.limitation)}</p>` : ''}
      </div>
    </div>`;
  return frame(body, { kicker: d.kicker ?? 'Natija', pageNo: d.pageNo, footerRight: BLOCK_LABELS.FINDING });
}

// ============================================================
// 17 PROBLEMS_SOLUTIONS
// ============================================================
export function renderProblemsSolutions(d: ProblemsSolutionsData & { pageNo?: string | number }): string {
  const pairs = d.pairs.slice(0, 3);
  const titleFs = heroSize(d.title, 50, 43, 37);
  const body = `
    <h2 class="pa-title-main" style="font-size:${titleFs}px">${safe(d.title)}</h2>
    ${d.subtitle ? `<p class="pa-subtitle" style="margin-top:10px">${safe(d.subtitle)}</p>` : ''}
    <div class="pa-policy-ledger">
      ${pairs.map((p, i) => `
        <article class="pa-ledger-row">
          <div class="pa-ledger-num">${String(i + 1).padStart(2, '0')}</div>
          <div class="pa-ledger-cell pa-ledger-cell--problem">
            <span>Muammo</span>
            <p>${safe(p.problem)}</p>
          </div>
          <div class="pa-ledger-rule"></div>
          <div class="pa-ledger-cell pa-ledger-cell--solution">
            <span>Yechim</span>
            <p>${safe(p.solution)}</p>
          </div>
        </article>
      `).join('')}
    </div>`;
  return frame(body, { kicker: d.kicker ?? 'Muammolar va yechimlar', pageNo: d.pageNo, footerRight: BLOCK_LABELS.PROBLEMS_SOLUTIONS });
}

// ============================================================
// 19 CONCLUSION
// ============================================================
export function renderConclusion(d: ConclusionData & { pageNo?: string | number }): string {
  if (d.paragraph !== undefined) {
    const body = `
      <h2 class="pa-title-main">${safe(d.title)}</h2>
      <div class="pa-prose-block">${safe(d.paragraph)}</div>
      ${d.closing ? `<div class="pa-closing-statement">${safe(d.closing)}</div>` : ''}`;
    return frame(body, { kicker: d.kicker ?? 'Xulosa', pageNo: d.pageNo, footerRight: BLOCK_LABELS.CONCLUSION });
  }
  const points = d.points.slice(0, 4);
  const body = `
    <h2 class="pa-title-main">${safe(d.title)}</h2>
    <div>
      <div class="${gridClass(points.length)} pa-takeaway-grid">
        ${points.map((p, i) => `<div class="pa-card pa-takeaway"><div class="pa-label">Xulosa ${i + 1}</div><h3 style="font-size:19px">${safe(p)}</h3></div>`).join('')}
      </div>
      ${d.closing ? `<div class="pa-closing-statement">${safe(d.closing)}</div>` : ''}
    </div>`;
  return frame(body, { kicker: d.kicker ?? 'Xulosa', pageNo: d.pageNo, footerRight: BLOCK_LABELS.CONCLUSION });
}

// ============================================================
// 20 REFERENCES
// ============================================================
const REF_TYPE_LABELS: Record<string, string> = {
  law: 'Qonun hujjatlari', book: 'Kitoblar', article: 'Maqolalar', web: 'Internet manbalari',
};

export function renderReferences(d: ReferencesData & { pageNo?: string | number }): string {
  const groups = new Map<string, string[]>();
  for (const it of d.items) {
    const key = it.type ? (REF_TYPE_LABELS[it.type] ?? it.type) : "Manbalar";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(it.text);
  }
  const body = `
    <h2 class="pa-title-main">${safe(d.title)}</h2>
    <div class="pa-ref-layout">
      <div class="pa-card flat">
        <div class="pa-label">Jami</div>
        <p class="pa-small">${d.items.length} ta manba</p>
      </div>
      <div>
        ${[...groups.entries()].map(([label, items]) => `
          <div class="pa-ref-group">
            <h3>${safe(label)}</h3>
            <div class="pa-ref-list">${items.map((t) => `<div>${safe(t)}</div>`).join('')}</div>
          </div>
        `).join('')}
      </div>
    </div>`;
  return frame(body, { kicker: 'Manbalar', pageNo: d.pageNo, footerRight: BLOCK_LABELS.REFERENCES });
}

// ============================================================
// 21 CLOSING
// ============================================================
// Only the thank-you line — no subtitle/contact/questions clutter.
export function renderClosing(d: ClosingData & { pageNo?: string | number }): string {
  const body = `
    <div class="pa-final-layout">
      <div class="pa-kicker">Yakun</div>
      <h2 class="pa-title-serif pa-thanks">${safe(d.title)}</h2>
    </div>`;
  return `
  <section class="pa-slide">
    <div class="pa-inner">
      <div></div>
      ${body}
      <div class="pa-footer-note"><span></span><span>${safe(d.pageNo ?? '')} / CLOSING</span></div>
    </div>
  </section>`;
}

// ============================================================
// PER-TYPE CSS (layout-specific — base tokens/primitives live in tokens.ts)
// ============================================================
export const SLIDES_CSS = `
/* 01 TITLE */
.pa-title-slide .pa-inner { grid-template-rows: 1fr auto; }
.pa-cover-grid { display: grid; grid-template-columns: 1.05fr .95fr; gap: 54px; align-items: center; }
.pa-cover-title { max-width: 560px; margin-top: 18px; }
.pa-cover-meta { display: grid; gap: 12px; margin-top: 32px; color: var(--muted); font-size: 16px; }
.pa-research-panel {
  height: 420px; border: 1px solid rgba(23,25,29,0.11); border-radius: var(--radius-lg);
  background: rgba(255,255,255,0.45); padding: 34px; position: relative; overflow: hidden;
}
.pa-doc-lines { position: absolute; left: 34px; right: 34px; bottom: 38px; display: grid; gap: 17px; }
.pa-doc-lines span { height: 1px; background: rgba(23,25,29,.13); }
.pa-doc-lines span:nth-child(2) { width: 84%; }
.pa-doc-lines span:nth-child(3) { width: 67%; }
.pa-doc-lines span:nth-child(5) { width: 78%; }
.pa-cover-stamp {
  position: absolute; right: 30px; bottom: 30px; border: 1px solid rgba(181,154,91,.42);
  color: var(--gold); border-radius: 999px; padding: 9px 13px; font-size: 12px;
  letter-spacing: .08em; text-transform: uppercase; max-width: 70%; text-align: right;
}
.pa-axis {
  position: absolute; width: 260px; height: 160px; right: 40px; top: 40px;
  border-left: 1.5px solid rgba(23,59,103,.36); border-bottom: 1.5px solid rgba(23,59,103,.36); opacity: .5;
}

/* 02 AGENDA — one line per item (number + title only, no explanatory subtext). */
.pa-agenda-list { display: grid; gap: 12px; margin-top: 24px; }
.pa-agenda-item {
  display: grid; grid-template-columns: 56px 1fr; gap: 18px; align-items: center;
  padding: 16px 0; border-bottom: 1px solid var(--rule);
}
.pa-agenda-num { font-family: var(--font-title); font-size: 30px; color: var(--blue); }
.pa-agenda-item h3 { font-size: 21px; letter-spacing: -0.02em; }
/* 5+ item outlines: denser rows so it's still readable. */
.pa-agenda-list--compact { gap: 6px; margin-top: 16px; }
.pa-agenda-list--compact .pa-agenda-item { padding: 8px 0; }
.pa-agenda-list--compact .pa-agenda-num { font-size: 22px; }
.pa-agenda-list--compact .pa-agenda-item h3 { font-size: 16px; }

/* 04 RELEVANCE */
.pa-relevance-stat { display: grid; grid-template-columns: 1fr auto; gap: 18px; align-items: end; padding-top: 18px; border-top: 1px solid var(--rule); margin-top: 18px; }
.pa-source--relevance { margin-top: 12px; padding-left: 14px; border-left: 2px solid rgba(181,154,91,.48); }

/* 05 AIM_TASKS */
.pa-aim-layout { display: grid; grid-template-columns: 1.08fr .92fr; gap: var(--gap-lg); align-items: stretch; margin-top: 20px; }
.pa-task-list { display: grid; gap: 12px; align-content: start; }
.pa-task { display: grid; grid-template-columns: 34px 1fr; gap: 12px; align-items: start; padding: 14px; border: 1px solid var(--rule); border-radius: var(--radius-sm); background: rgba(255,255,255,.42); }
.pa-task h3 { font-size: 16px; font-weight: 600; }

/* 06 OBJECT_SUBJECT */
.pa-object-subject { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid var(--rule-strong); border-radius: var(--radius-lg); overflow: hidden; margin-top: 20px; min-height: 320px; }
.pa-panel { padding: 32px; background: rgba(255,255,255,.36); }
.pa-panel + .pa-panel { border-left: 1px solid var(--rule-strong); background: rgba(23,59,103,.045); }
.pa-panel h3 { font-size: 28px; font-family: var(--font-title); font-weight: 500; margin: 10px 0 14px; }

/* 07 DEFINITION */
.pa-definition-layout { display: grid; grid-template-columns: 380px 1fr; gap: 32px; align-items: stretch; margin-top: 20px; }
.pa-term-card { background: var(--blue); color: #fff; border-radius: var(--radius-lg); padding: 30px; display: flex; flex-direction: column; justify-content: center; }
.pa-term { font-family: var(--font-title); line-height: 1; letter-spacing: -0.03em; }
.pa-definition-copy { font-size: 24px; line-height: 1.4; color: var(--ink-soft); }
.pa-aspect-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 22px; }

/* 08 CONTENT */
.pa-evidence-layout { display: grid; gap: var(--gap-lg); margin-top: 20px; }
.pa-evidence-layout--with-lead { gap: 14px; margin-top: 16px; }
.pa-content-card-grid { gap: 20px; }
.pa-content-card { padding: 18px 20px; min-height: 150px; overflow: hidden; }
.pa-content-card .pa-label { margin-bottom: 9px; }
.pa-content-card h3 { line-height: 1.1; margin-bottom: 7px; }
.pa-content-card .pa-small { line-height: 1.34; }
.pa-evidence-layout--4 .pa-content-card { min-height: 142px; padding: 16px 19px; }
.pa-evidence-layout--4 .pa-content-card-grid { gap: 18px 20px; }
.pa-content-lead {
  margin-top: 0; padding: 10px 14px; border-left: 3px solid var(--gold);
  color: var(--ink-soft); font-size: 16px; line-height: 1.32;
  background: rgba(255,255,255,.36); border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}
.pa-media-layout { display:grid; grid-template-columns:minmax(0,1.02fr) minmax(390px,.98fr); gap:26px; align-items:stretch; margin-top:16px; }
.pa-media-copy { min-width:0; display:flex; flex-direction:column; justify-content:center; gap:12px; }
.pa-visual-points { display:grid; grid-template-columns:1fr 1fr; gap:11px; }
.pa-visual-point { min-height:118px; padding:16px; }
.pa-visual-point h3 { margin-top:7px; font-size:19px; }
.pa-prose-block--visual { margin-top:0; padding:22px 24px; line-height:1.42; }
.pa-wm-visual { height:312px; align-self:center; }
.pa-visual-takeaway { margin-top:18px; padding-top:14px; border-top:1px solid var(--rule); color:var(--blue); font-weight:600; }
.pa-prose-block { font-size: 22px; line-height: 1.5; color: var(--ink-soft); background: rgba(255,255,255,.48); border: 1px solid var(--rule); border-radius: var(--radius-lg); padding: 30px; margin-top: 16px; max-width: 76ch; }

/* 09 BATAFSIL */
.pa-deep-dive { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 26px; margin-top: 16px; }
.pa-deep-paragraph { line-height: 1.42; color: var(--ink-soft); padding: 22px 24px; background: rgba(255,255,255,.46); border: 1px solid var(--rule); border-radius: var(--radius-lg); }
.pa-side-notes { display: grid; gap: 10px; align-content: start; }
.pa-side-note { padding: 17px 19px; overflow: hidden; }
.pa-side-note .pa-label { margin-bottom: 8px; }
.pa-side-note h3 { line-height: 1.18; margin-bottom: 0; }
.pa-deep-dive--3 { grid-template-columns: minmax(0, 1fr) 300px; gap: 24px; }
.pa-batafsil-slide .pa-title-main { line-height: 1.02; }
.pa-batafsil-slide .pa-deep-dive { margin-top: 12px; }

/* 10 MISOL */
.pa-example-layout { display: grid; grid-template-columns: 1.02fr .98fr; gap: 24px; margin-top: 20px; }
.pa-case-card { border: 1px solid var(--rule-strong); border-radius: var(--radius-lg); padding: 28px; background: rgba(255,255,255,.56); }
.pa-example-layout--note { grid-template-columns: 1.05fr .95fr; align-items: stretch; }
.pa-case-note-layout { display:grid; grid-template-columns:minmax(0,1.05fr) minmax(360px,.95fr); gap:24px; margin-top:18px; align-items:stretch; }
.pa-case-note {
  display:grid; grid-template-columns:58px minmax(0,1fr); gap:20px;
  border:1px solid var(--rule-strong); border-radius:var(--radius-lg);
  background:rgba(255,255,255,.56); padding:22px; min-height:310px; overflow:hidden;
}
.pa-case-note__rail {
  writing-mode:vertical-rl; transform:rotate(180deg); display:flex; align-items:center; justify-content:center;
  border-right:1px solid rgba(181,154,91,.46); color:var(--gold); font-size:12px; font-weight:800;
  letter-spacing:.18em; text-transform:uppercase;
}
.pa-case-note .pa-text { line-height:1.42; }
.pa-case-note .pa-visual-takeaway { margin-top:12px; padding-top:12px; font-size:16px; line-height:1.35; }

/* 11 TURLAR */
.pa-type-card { min-height: 180px; display: flex; flex-direction: column; gap: 16px; }
.pa-type-top { display: flex; justify-content: space-between; align-items: start; gap: 14px; }
/* Description text read a touch small at the default --small (15px) — bumped
   just for this card, not globally (other types reuse .pa-small as-is).
   Bumped again 17->19px: still noticeably smaller than a prose-mode slide's
   22px paragraph (.pa-prose-block), and adjacent slides in the same deck
   read as inconsistent when a card-grid slide follows a prose slide. */
.pa-type-card p.pa-small { font-size: 19px; line-height: 1.5; }
/* 4 items as a 2x2 grid instead of one cramped row — scoped to TURLAR only
   (not the shared .pa-grid-4 used by STATS/CONTENT/etc.). Two rows leaves
   roughly half the vertical budget per card that one row had, so the card
   itself is tightened (less padding/gap, smaller min-height) to reliably
   fit two rows within the fixed 720px canvas — verified against real,
   2-line-label content, not just short placeholder text. */
.pa-turlar-grid.pa-grid-4 { grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); gap: 16px; }
.pa-turlar-grid.pa-grid-4 .pa-type-card { min-height: 0; padding: 17px 18px; gap: 8px; overflow: hidden; }
.pa-turlar-grid.pa-grid-4 .pa-academic-icon { width: 34px; height: 34px; }
.pa-turlar-grid.pa-grid-4 .pa-marker { width: 24px; height: 24px; font-size: 12px; }
.pa-turlar-grid.pa-grid-4 .pa-type-card h3 { font-size: 19px; line-height: 1.16; margin-bottom: 3px; }
.pa-turlar-grid.pa-grid-4 .pa-type-card p.pa-small { font-size: 15.8px; line-height: 1.33; }

/* 12 COMPARISON */
.pa-comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
.pa-compare-col { border: 1px solid var(--rule-strong); border-radius: var(--radius-lg); overflow: hidden; background: rgba(255,255,255,.38); }
.pa-compare-head { padding: 20px 24px; border-bottom: 1px solid var(--rule-strong); background: rgba(255,255,255,.48); }
.pa-compare-head h3 { font-size: 25px; margin-top: 4px; }
.pa-compare-body { padding: 8px 24px 20px; }
.pa-compare-row { padding: 12px 0; border-bottom: 1px solid var(--rule); }
.pa-compare-row:last-child { border-bottom: 0; }

/* 13 PROCESS */
.pa-process-chain { display: grid; gap: 0; align-items: stretch; margin-top: 16px; }
.pa-step {
  position: relative; padding: 20px 18px; min-height: 220px;
  border-top: 1px solid var(--rule-strong); border-bottom: 1px solid var(--rule-strong); border-left: 1px solid var(--rule-strong);
  background: rgba(255,255,255,.38);
}
.pa-step:last-child { border-right: 1px solid var(--rule-strong); border-radius: 0 var(--radius-lg) var(--radius-lg) 0; }
.pa-step:first-child { border-radius: var(--radius-lg) 0 0 var(--radius-lg); }
.pa-step-number { font-family: var(--font-title); color: var(--blue); font-size: 34px; margin-bottom: 18px; }
.pa-step h3 { font-size: 17px; margin-bottom: 6px; }
.pa-step p.pa-small { font-size: 17px; line-height: 1.5; }
.pa-process-flow {
  position:relative; min-height:318px; margin-top:14px; display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px 18px; align-content:start;
}
.pa-process-flow::before {
  content:""; position:absolute; inset:0; border-radius:var(--radius-lg);
  background:linear-gradient(135deg, rgba(181,154,91,.08), transparent 42%);
  border:1px solid rgba(181,154,91,.14); pointer-events:none;
}
.pa-process-spine { display:none; }
.pa-process-note {
  position:relative; display:grid; grid-template-columns:50px minmax(0,1fr);
  gap:12px; align-items:stretch; z-index:1;
}
.pa-process-index {
  width:46px; height:46px; border-radius:50%; justify-self:center; align-self:center; display:grid; place-items:center;
  background:var(--paper-2); border:1px solid rgba(23,59,103,.28); color:var(--blue);
  font-family:var(--font-title); font-size:22px; box-shadow:0 0 0 7px rgba(23,59,103,.05); z-index:2;
}
.pa-process-paper {
  min-height:92px; padding:14px 16px; border:1px solid rgba(23,25,29,.11); border-radius:var(--radius-md);
  background:rgba(255,255,255,.52); box-shadow:var(--shadow-card); position:relative;
}
.pa-process-paper::after { content:""; position:absolute; left:-13px; top:50%; width:13px; height:1px; background:rgba(181,154,91,.55); }
.pa-process-note--left .pa-process-paper,
.pa-process-note--right .pa-process-paper { grid-column:auto; }
.pa-process-paper h3 { font-size:17.5px; line-height:1.15; margin-bottom:5px; }
.pa-process-paper p { color:var(--muted); font-size:15px; line-height:1.28; }
.pa-process-flow--2,
.pa-process-flow--3 { gap:16px 18px; }
.pa-process-flow--2 .pa-process-paper,
.pa-process-flow--3 .pa-process-paper { min-height:96px; padding:20px 22px; }
.pa-process-flow--2 .pa-process-paper h3,
.pa-process-flow--3 .pa-process-paper h3 { font-size:22px; }
.pa-process-flow--2 .pa-process-paper p,
.pa-process-flow--3 .pa-process-paper p { font-size:17px; line-height:1.4; }
.pa-process-flow--5 .pa-process-paper { min-height:86px; padding:12px 15px; }
.pa-process-flow--5 .pa-process-paper h3 { font-size:16.5px; }
.pa-process-flow--5 .pa-process-paper p { font-size:14.2px; line-height:1.24; }

/* 14 TIMELINE */
.pa-timeline { position: relative; display: grid; gap: 18px; padding-top: 60px; margin-top: 8px; }
.pa-timeline::before { content: ""; position: absolute; left: 0; right: 0; top: 42px; height: 2px; background: var(--rule-strong); }
.pa-event { position: relative; }
.pa-event::before {
  content: ""; position: absolute; top: -26px; left: 0; width: 14px; height: 14px;
  background: var(--blue); border-radius: 50%; box-shadow: 0 0 0 6px rgba(23,59,103,.08);
}
.pa-date { font-family: var(--font-title); font-size: 28px; color: var(--blue); margin-bottom: 8px; }
/* Event title had no explicit size (fell back to the browser's small default
   h3), and the description read small at the shared --small (15px) — both
   bumped just for this card. */
.pa-event h3 { font-size: 19px; margin-bottom: 6px; }
.pa-event p.pa-small { font-size: 17px; line-height: 1.5; }

/* 15 STATS */
.pa-stats-grid { margin-top: 20px; }
.pa-stat-card { min-height: 220px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px; }

/* 16 FINDING */
.pa-finding-layout { display: grid; grid-template-columns: .95fr 1.05fr; gap: 24px; margin-top: 14px; }
.pa-result-card { background: var(--blue); border-radius: var(--radius-lg); padding: 26px 28px; display: flex; flex-direction: column; justify-content: center; }
.pa-evidence-stack { display: grid; gap: 12px; align-content: start; }
.pa-interpretation { border-top: 1px solid var(--rule-strong); padding-top: 13px; }

/* 17 PROBLEMS_SOLUTIONS */
.pa-pair-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 22px; margin-top: 20px; }
.pa-pair { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid var(--rule-strong); border-radius: var(--radius-md); overflow: hidden; background: rgba(255,255,255,.38); }
.pa-problem, .pa-solution { padding: 18px; }
.pa-problem { border-right: 1px solid var(--rule-strong); }
.pa-problem .pa-label { color: var(--problem); }
.pa-solution .pa-label { color: var(--success); }
.pa-pair-grid--three { grid-template-columns: repeat(3, 1fr); }
.pa-pair-grid--three .pa-pair { grid-template-columns: 1fr; }
.pa-pair-grid--three .pa-problem,
.pa-pair-grid--three .pa-solution { padding: 14px 16px; }
.pa-pair-grid--three .pa-problem { border-right: 0; border-bottom: 1px solid var(--rule-strong); }
.pa-pair-grid--three .pa-text { font-size: 17px; line-height: 1.38; }
.pa-policy-ledger { display:grid; gap:13px; margin-top:18px; }
.pa-ledger-row {
  display:grid; grid-template-columns:48px minmax(0,1fr) 34px minmax(0,1fr); gap:14px; align-items:stretch;
}
.pa-ledger-num {
  width:48px; height:48px; border-radius:50%; align-self:center; display:grid; place-items:center;
  background:var(--blue); color:#fff; font-family:var(--font-title); font-size:21px;
}
.pa-ledger-cell {
  border:1px solid rgba(23,25,29,.11); border-radius:var(--radius-md); background:rgba(255,255,255,.46);
  padding:17px 19px; min-height:86px; display:flex; flex-direction:column; justify-content:center;
}
.pa-ledger-cell span {
  font-size:11px; text-transform:uppercase; letter-spacing:.13em; font-weight:800; margin-bottom:7px;
}
.pa-ledger-cell p { font-size:18px; line-height:1.32; color:var(--ink-soft); }
.pa-ledger-cell--problem { border-left:3px solid rgba(106,45,42,.55); }
.pa-ledger-cell--problem span { color:var(--problem); }
.pa-ledger-cell--solution { border-left:3px solid rgba(36,79,68,.56); background:rgba(255,255,255,.56); }
.pa-ledger-cell--solution span { color:var(--success); }
.pa-ledger-rule { align-self:center; height:1px; background:rgba(181,154,91,.6); }

/* 19 CONCLUSION */
.pa-takeaway-grid { margin-top: 20px; }
.pa-takeaway { min-height: 140px; border-top: 4px solid var(--blue); }
.pa-closing-statement {
  margin-top: 22px; padding: 20px 24px; border: 1px solid rgba(181,154,91,.42); border-radius: var(--radius-md);
  background: rgba(232,221,192,.26); font-size: 20px; color: var(--ink-soft);
}

/* 20 REFERENCES */
.pa-ref-layout { display: grid; grid-template-columns: 210px 1fr; gap: 30px; margin-top: 20px; }
.pa-ref-group { padding: 14px 0; border-bottom: 1px solid var(--rule); }
.pa-ref-group h3 { color: var(--blue); font-size: 16px; margin-bottom: 8px; }
.pa-ref-list { display: grid; gap: 9px; font-size: 15px; color: var(--ink-soft); line-height: 1.35; }

/* 21 CLOSING — just the thank-you line, vertically centered. */
.pa-final-layout { height: 100%; display: flex; flex-direction: column; justify-content: center; gap: 16px; }
.pa-thanks { font-size: 72px; letter-spacing: -0.04em; line-height: 1; max-width: 850px; }

`;
