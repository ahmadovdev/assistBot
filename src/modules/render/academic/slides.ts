// academic/slides.ts
// Per-block renderers for the modern_academic theme. Same string-template style
// as templates/layouts.ts: pure `(data) => string` functions, class-based CSS
// (SLIDES_CSS), semantic var(--*) tokens only.
//
// Built group by group. CURRENT: Group A — TITLE, CONTENT, DEFINITION, CONCLUSION.
// Data interfaces are the SAME ones the AI already produces (imported as types
// from the legacy layouts) so these renderers are drop-in — card.prompt.ts
// is NOT changed.

import type {
  TitleData, ContentData, DefinitionData, ConclusionData,
  AgendaData, RelevanceData, AimTasksData, StatsData, ReferencesData,
  BatafsilData, MisolData, TurlarData, ProcessData, ComparisonData,
  TimelineData, FindingData, ProblemsSolutionsData,
  ObjectSubjectData, ClosingData,
} from '../templates/layouts';
import { icon } from '../templates/icons';
import { renderWikimediaVisual } from '../templates/wikimedia-visual';
import {
  frame, citationPill, placeholderChip, safe,
  HeaderData, FooterData,
} from './components';

// ---- Meta the deck injects onto every slide (position, page, source) ----
export interface AcademicMeta {
  section?: string;
  label?: string;
  dots?: { total: number; active: number };
  pageNo?: string | number;
  pageTotal?: string | number;
  univ?: string;
  year?: string;
  source?: string;
}

/** Uzbek block labels shown in the slide header (spec header pattern). */
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
  STATS: 'ASOSIY KO‘RSATKICHLAR',
  CONCLUSION: 'XULOSA',
  REFERENCES: 'FOYDALANILGAN ADABIYOTLAR',
  RELEVANCE: 'MAVZUNING DOLZARBLIGI',
  AIM_TASKS: 'MAQSAD VA VAZIFALAR',
  OBJECT_SUBJECT: "TADQIQOT OB'YEKTI VA PREDMETI",
  FINDING: 'TADQIQOT NATIJALARI',
  PROBLEMS_SOLUTIONS: 'MUAMMOLAR VA YECHIMLAR',
};

const headerFor = (d: AcademicMeta, fallbackLabel?: string): HeaderData => ({
  section: d.section,
  label: d.label ?? fallbackLabel,
  dots: d.dots,
});

const footerFor = (d: AcademicMeta): FooterData => ({
  univ: d.univ,
  page: d.pageNo,
  total: d.pageTotal,
});

/**
 * Citation zone: show the real source as a pill when present, otherwise a
 * dashed placeholder prompting the student to add it — never invent a source
 * (P0 anti-hallucination). Satisfies "citation visible" without fabricating.
 */
function citationZone(source: string | undefined, variant: 'pill' | 'block' = 'pill'): string {
  return source
    ? citationPill(source, variant)
    : placeholderChip('[manba: to‘ldiring]');
}

/** Auto font-size for a hero topic by word count (keeps it dominant, never
 *  overflows the panel). */
function heroSize(text: string, big: number, mid: number, small: number): number {
  const w = String(text).trim().split(/\s+/).filter(Boolean).length;
  return w <= 6 ? big : w <= 12 ? mid : small;
}

// ============================================================
// TITLE — editorial_split (spec Prompt 1)
// ============================================================
export function renderTitle(d: TitleData & AcademicMeta): string {
  const topicPx = heroSize(d.title ?? '', 72, 58, 46);
  const body = `
    <div class="a-title">
      <aside class="a-title__left">
        <div class="a-title__org">
          ${d.ministry ? `<p class="a-title__ministry">${safe(d.ministry)}</p>` : ''}
          ${d.university ? `<p class="a-title__univ">${safe(d.university)}</p>` : ''}
          ${d.faculty ? `<p class="a-title__sub">${safe(d.faculty)}</p>` : ''}
          ${d.department ? `<p class="a-title__sub">${safe(d.department)}</p>` : ''}
        </div>
        <div class="a-title__people">
          <span class="a-title__rule"></span>
          ${d.student ? `
            <p class="a-title__eyebrow">Bajardi</p>
            <p class="a-title__name">${safe(d.student)}</p>
            ${d.group ? `<p class="a-title__meta">${safe(d.group)}</p>` : ''}` : ''}
          ${d.advisor ? `
            <p class="a-title__eyebrow" style="margin-top:var(--space-3)">Ilmiy rahbar</p>
            <p class="a-title__name a-title__name--sm">${safe(d.advisor)}</p>` : ''}
        </div>
        <div class="a-title__foot">
          <span class="a-title__rule"></span>
          <p class="a-title__meta">${[safe(d.city), safe(d.year)].filter(Boolean).join(' — ')}</p>
        </div>
      </aside>
      <main class="a-title__right">
        ${d.workType ? `<span class="a-title__badge">${safe(d.workType)}</span>` : ''}
        <h1 class="a-title__topic" style="font-size:${topicPx}px">${safe(d.title)}</h1>
        <span class="a-title__accent"></span>
        <div class="a-title__deco"><span></span><span></span><span></span></div>
      </main>
    </div>`;
  return frame(body, { bleed: true, className: 'is-title' });
}

// ============================================================
// CONTENT — assertion + bullet rows (spec Prompt 6)
// ============================================================
export function renderContent(d: ContentData & AcademicMeta): string {
  if (d.visual) {
    const points = (d.points ?? []).slice(0, 4);
    const copy = d.paragraph !== undefined
      ? `<p class="a-media__prose">${safe(d.paragraph)}</p>`
      : `<ul class="a-media__points">${points.map((point) => `
          <li><span>${icon(point.icon || 'check', 18)}</span><p>${point.heading ? `<strong>${safe(point.heading)}</strong> ` : ''}${safe(point.text)}</p></li>`).join('')}</ul>`;
    const body = `<h1 class="a-h1">${safe(d.title)}</h1>
      ${d.lead ? `<p class="a-content__lead">${safe(d.lead)}</p>` : ''}
      <div class="a-media">${copy}${renderWikimediaVisual(d.visual, 'a-wm-visual')}</div>`;
    return frame(body, {
      header: headerFor(d, BLOCK_LABELS.CONTENT),
      footer: footerFor(d),
      className: 'is-content is-content-visual',
    });
  }
  const points = (d.points ?? []).slice(0, 6);
  const bullets = points
    .map(
      (p) => `
      <li class="a-bullet">
        <span class="a-bullet__ico">${icon(p.icon || 'check', 22)}</span>
        <span class="a-bullet__text">
          ${p.heading ? `<strong class="a-bullet__head">${safe(p.heading)}</strong> ` : ''}${safe(p.text)}
        </span>
      </li>`,
    )
    .join('');

  const body = `
    <div class="a-content">
      <div class="a-content__main">
        <h1 class="a-h1">${safe(d.title)}</h1>
        ${d.lead ? `<p class="a-content__lead">${safe(d.lead)}</p>` : ''}
        <ul class="a-bullets">${bullets}</ul>
        ${d.source ? `<div class="a-content__cite">${citationPill(d.source, 'inline')}</div>` : ''}
      </div>
      ${d.kicker ? `<span class="a-content__ghost">${safe(d.kicker)}</span>` : ''}
    </div>`;

  return frame(body, {
    header: headerFor(d, BLOCK_LABELS.CONTENT),
    footer: footerFor(d),
    className: 'is-content',
  });
}

// ============================================================
// DEFINITION — term hero + definition body (spec Prompt 7)
// ============================================================
export function renderDefinition(d: DefinitionData & AcademicMeta): string {
  const termPx = heroSize(d.term ?? '', 72, 56, 44);
  const aspects = (d.aspects ?? []).slice(0, 3);
  const aspectRows = aspects
    .map(
      (a) => `
      <div class="a-def__note">
        <span class="a-def__note-lbl">${safe(a.label)}</span>
        <span class="a-def__note-txt">${safe(a.text)}</span>
      </div>`,
    )
    .join('');

  const body = `
    <div class="a-def">
      <div class="a-def__term">
        <span class="a-eyebrow a-eyebrow--accent">Atama</span>
        <h1 class="a-def__word" style="font-size:${termPx}px">${safe(d.term)}</h1>
        <span class="a-accent-line"></span>
      </div>
      <div class="a-def__body">
        <span class="a-eyebrow">Ta'rifi</span>
        <p class="a-def__text">${safe(d.definition)}</p>
        ${aspectRows}
        <div class="a-def__cite">${citationZone(d.source, 'block')}</div>
      </div>
    </div>`;

  return frame(body, {
    header: headerFor(d, BLOCK_LABELS.DEFINITION),
    footer: footerFor(d),
    className: 'is-definition',
  });
}

// ============================================================
// CONCLUSION — centered summary + key-point cards (spec Prompt 19)
// ============================================================
export function renderConclusion(d: ConclusionData & AcademicMeta): string {
  const points = (d.points ?? []).slice(0, 3);
  const cards = points
    .map(
      (p) => `
      <div class="a-concl__card">
        <span class="a-concl__ico">${icon('check', 24)}</span>
        <p class="a-concl__ctext">${safe(p)}</p>
      </div>`,
    )
    .join('');

  const body = `
    <div class="a-concl">
      <h1 class="a-h1 a-concl__title">${safe(d.title || 'Xulosa')}</h1>
      <span class="a-accent-line a-accent-line--center"></span>
      ${d.closing ? `<p class="a-concl__summary">${safe(d.closing)}</p>` : ''}
      <div class="a-concl__cards">${cards}</div>
    </div>`;

  return frame(body, {
    header: headerFor(d, BLOCK_LABELS.CONCLUSION),
    footer: footerFor(d),
    className: 'is-conclusion',
  });
}

// ============================================================
// AGENDA — numbered plan + progress rail (spec Prompt 2)
// ============================================================
export function renderAgenda(d: AgendaData & AcademicMeta): string {
  const items = (d.items ?? []).slice(0, 8);
  const rows = items
    .map(
      (it, i) => `
      <li class="a-agenda__row">
        <span class="a-agenda__num">${String(i + 1).padStart(2, '0')}</span>
        <span class="a-agenda__text">${safe(it.text)}</span>
      </li>`,
    )
    .join('');
  const bars = items
    .map((_, i) => `<span class="a-agenda__bar${i === 0 ? ' is-active' : ''}"></span>`)
    .join('');

  const body = `
    <h1 class="a-h1 a-agenda__title">${safe(d.title || 'Reja')}</h1>
    <div class="a-agenda">
      <ol class="a-agenda__list">${rows}</ol>
      <aside class="a-agenda__side">
        <div class="a-agenda__bars">${bars}</div>
        <p class="a-agenda__count">${items.length} bo‘lim</p>
      </aside>
    </div>`;

  return frame(body, {
    header: headerFor(d, BLOCK_LABELS.AGENDA),
    footer: footerFor(d),
    className: 'is-agenda',
  });
}

// ============================================================
// RELEVANCE — lead statement + evidence cards (spec Prompt 3)
// ============================================================
export function renderRelevance(d: RelevanceData & AcademicMeta): string {
  const points = (d.points ?? []).slice(0, 2);
  const statCard = d.stat
    ? `
      <div class="a-rel__card a-rel__card--stat">
        <span class="a-rel__stat-val">${d.stat.approx ? '~' : ''}${safe(d.stat.value)}${
          d.stat.unit ? `<span class="a-rel__stat-unit">${safe(d.stat.unit)}</span>` : ''
        }</span>
        <p class="a-rel__ctext">${safe(d.stat.label)}</p>
      </div>`
    : '';
  const cards = points
    .map(
      (p, i) => `
      <div class="a-rel__card">
        <span class="a-rel__num">${String(i + 1).padStart(2, '0')}</span>
        <p class="a-rel__ctext">${safe(p.text)}</p>
      </div>`,
    )
    .join('');

  const body = `
    <h1 class="a-h1">${safe(d.title)}</h1>
    ${d.lead ? `<p class="a-rel__lead">${safe(d.lead)}</p>` : ''}
    <div class="a-rel__cards">${statCard}${cards}</div>
    <div class="a-rel__cite">${citationZone(d.source, 'pill')}</div>`;

  return frame(body, {
    header: headerFor(d, BLOCK_LABELS.RELEVANCE),
    footer: footerFor(d),
    className: 'is-relevance',
  });
}

// ============================================================
// AIM_TASKS — aim block + 2x2 task grid (spec Prompt 4)
// ============================================================
export function renderAimTasks(d: AimTasksData & AcademicMeta): string {
  const tasks = (d.tasks ?? []).slice(0, 4);
  // `paragraph` prose mode is a much longer statement (280-650 chars) than
  // the short `aim` this card was designed for at a fixed 24px — shrink to
  // fit so real content doesn't get clipped by the slide's fixed height.
  const aimText = d.paragraph ?? d.aim;
  const aimFs = d.paragraph !== undefined ? heroSize(d.paragraph, 24, 20, 17) : 24;
  const cells = tasks
    .map(
      (t, i) => `
      <div class="a-aim__cell">
        <span class="a-aim__badge">${i + 1}</span>
        <p class="a-aim__ctext">${safe(t)}</p>
      </div>`,
    )
    .join('');

  const body = `
    <h1 class="a-h1">${safe(d.title)}</h1>
    <div class="a-aim__goal">
      <span class="a-eyebrow a-eyebrow--accent">Maqsad</span>
      <p class="a-aim__aim" style="font-size:${aimFs}px">${safe(aimText)}</p>
    </div>
    <div class="a-aim__divider"><span></span></div>
    <div class="a-aim__tasks">
      <span class="a-eyebrow a-eyebrow--accent">Vazifalar</span>
      <div class="a-aim__grid">${cells}</div>
    </div>`;

  return frame(body, {
    header: headerFor(d, BLOCK_LABELS.AIM_TASKS),
    footer: footerFor(d),
    className: 'is-aimtasks',
  });
}

// ============================================================
// STATS — 3 big-number cards (spec Prompt 15)
// ============================================================
export function renderStats(d: StatsData & AcademicMeta): string {
  const stats = (d.stats ?? []).slice(0, 3);
  const cards = stats
    .map(
      (s) => `
      <div class="a-stats__card">
        <span class="a-stats__label">${safe(s.label)}</span>
        <span class="a-stats__num">${s.approx ? '~' : ''}${safe(s.value)}${
          s.unit ? `<span class="a-stats__unit">${safe(s.unit)}</span>` : ''
        }</span>
        <span class="a-stats__rule"></span>
        ${s.description ? `<p class="a-stats__ctext">${safe(s.description)}</p>` : ''}
      </div>`,
    )
    .join('');

  const body = `
    <h1 class="a-h1">${safe(d.title)}</h1>
    <div class="a-stats__grid">${cards}</div>
    ${d.insight ? `<div class="a-stats__insight">${safe(d.insight)}</div>` : ''}
    <div class="a-stats__cite">${citationZone(d.source, 'pill')}</div>`;

  return frame(body, {
    header: headerFor(d, BLOCK_LABELS.STATS),
    footer: footerFor(d),
    className: 'is-stats',
  });
}

// ============================================================
// REFERENCES — 2-column bibliography, type-coded (spec Prompt 20)
// ============================================================
function refType(t?: string): 'law' | 'book' | 'article' | 'web' {
  const k = (t ?? '').toLowerCase();
  if (/law|normativ|qonun|konstitu|kodeks/.test(k)) return 'law';
  if (/article|maqola|jurnal/.test(k)) return 'article';
  if (/web|elektron|sayt|url|resurs|internet/.test(k)) return 'web';
  return 'book';
}

export function renderReferences(d: ReferencesData & AcademicMeta): string {
  const items = (d.items ?? []).slice(0, 8);
  const li = items
    .map(
      (it, i) => `
      <li class="a-ref__item">
        <span class="a-ref__num a-ref__num--${refType(it.type)}">${i + 1}</span>
        <span class="a-ref__text">${safe(it.text)}</span>
      </li>`,
    )
    .join('');

  const legend = [
    ['law', 'Normativ'],
    ['book', 'Kitob/darslik'],
    ['article', 'Maqola'],
    ['web', 'Elektron manba'],
  ]
    .map(
      ([k, label]) =>
        `<span class="a-ref__leg"><span class="a-ref__dot a-ref__dot--${k}"></span>${label}</span>`,
    )
    .join('');

  const body = `
    <h1 class="a-h1">${safe(d.title || 'Foydalanilgan adabiyotlar')}</h1>
    <span class="a-ref__std">GOST 7.1–2003 talablariga muvofiq</span>
    <ol class="a-ref__list">${li}</ol>
    <div class="a-ref__foot">
      <div class="a-ref__legend">${legend}</div>
      ${placeholderChip('[o‘z manbalaringizni qo‘shing]')}
    </div>`;

  return frame(body, {
    header: headerFor(d, BLOCK_LABELS.REFERENCES),
    footer: footerFor(d),
    className: 'is-references',
  });
}

// ============================================================
// BATAFSIL — intro paragraph + 2x2 aspect cards (spec Prompt 8)
// ============================================================
export function renderBatafsil(d: BatafsilData & AcademicMeta): string {
  const points = (d.points ?? []).slice(0, 4);
  const cards = points
    .map(
      (p, i) => `
      <div class="a-bat__card">
        <span class="a-bat__badge">${i + 1}</span>
        <span class="a-bat__corner"></span>
        <p class="a-bat__ctext">${safe(p.text)}</p>
      </div>`,
    )
    .join('');

  const body = `
    <h1 class="a-h1">${safe(d.title)}</h1>
    ${d.body ? `<p class="a-bat__intro">${safe(d.body)}</p>` : ''}
    <div class="a-bat__grid">${cards}</div>`;

  return frame(body, {
    header: headerFor(d, BLOCK_LABELS.BATAFSIL),
    footer: footerFor(d),
    className: 'is-batafsil',
  });
}

// ============================================================
// MISOL — narrative (60%) + dark insight (40%) (spec Prompt 9)
// ============================================================
export function renderMisol(d: MisolData & AcademicMeta): string {
  if (d.visual) {
    const body = `<div class="a-misol a-misol--visual">
      <div class="a-misol__left"><span class="a-eyebrow a-eyebrow--accent">Misol</span><h2 class="a-misol__heading">${safe(d.title)}</h2><p class="a-misol__body">${safe(d.paragraph ?? d.body)}</p>${d.takeaway ? `<p class="a-misol__takeaway-inline">${safe(d.takeaway)}</p>` : ''}</div>
      ${renderWikimediaVisual(d.visual, 'a-wm-visual')}
    </div>`;
    return frame(body, {
      header: headerFor(d, BLOCK_LABELS.MISOL),
      footer: footerFor(d),
      className: 'is-misol is-misol-visual',
    });
  }
  const body = `
    <div class="a-misol">
      <div class="a-misol__left">
        <span class="a-eyebrow a-eyebrow--accent">Misol</span>
        <h2 class="a-misol__heading">${safe(d.title)}</h2>
        <p class="a-misol__body">${safe(d.body)}</p>
      </div>
      ${
        d.takeaway
          ? `
      <aside class="a-misol__insight">
        <span class="a-misol__ilabel">${icon(d.icon || 'idea', 22)}<span>Misol nimani ko‘rsatadi</span></span>
        <p class="a-misol__itext">${safe(d.takeaway)}</p>
        <span class="a-misol__iline"></span>
      </aside>`
          : ''
      }
    </div>`;

  return frame(body, {
    header: headerFor(d, BLOCK_LABELS.MISOL),
    footer: footerFor(d),
    className: 'is-misol',
  });
}

// ============================================================
// TURLAR — classification cards with icons (spec Prompt 10)
// ============================================================
export function renderTurlar(d: TurlarData & AcademicMeta): string {
  const items = (d.items ?? []).slice(0, 4);
  const cards = items
    .map(
      (it) => `
      <div class="a-turlar__card">
        <span class="a-turlar__ico">${icon(it.icon || 'layers', 28)}</span>
        <p class="a-turlar__label">${safe(it.label)}</p>
        <p class="a-turlar__text">${safe(it.text)}</p>
      </div>`,
    )
    .join('');

  const body = `
    <h1 class="a-h1">${safe(d.title)}</h1>
    ${d.kicker ? `<span class="a-turlar__crit">${safe(d.kicker)}</span>` : ''}
    <div class="a-turlar__grid a-turlar__grid--count-${items.length}" style="grid-template-columns:repeat(${items.length === 4 ? 2 : Math.max(items.length, 1)},1fr)">${cards}</div>`;

  return frame(body, {
    header: headerFor(d, BLOCK_LABELS.TURLAR),
    footer: footerFor(d),
    className: 'is-turlar',
  });
}

// ============================================================
// PROCESS — connected stage cards + progress bar (spec Prompt 12)
// ============================================================
export function renderProcess(d: ProcessData & AcademicMeta): string {
  const steps = (d.steps ?? []).slice(0, 5);
  const cards = steps
    .map(
      (s, i) => `
      <div class="a-proc__step">
        <span class="a-proc__num">${i + 1}</span>
        <p class="a-proc__name">${safe(s.title)}</p>
        <p class="a-proc__desc">${safe(s.body)}</p>
      </div>`,
    )
    .join(`<span class="a-proc__arrow">${icon('arrow', 20)}</span>`);

  const body = `
    <h1 class="a-h1">${safe(d.title)}</h1>
    <div class="a-proc__flow">${cards}</div>
    <div class="a-proc__bar"><span></span></div>`;

  return frame(body, {
    header: headerFor(d, BLOCK_LABELS.PROCESS),
    footer: footerFor(d),
    className: 'is-process',
  });
}

// ============================================================
// COMPARISON — side-by-side table (spec Prompt 13)
// ============================================================
export function renderComparison(d: ComparisonData & AcademicMeta): string {
  const L = d.left ?? { label: '', items: [] };
  const R = d.right ?? { label: '', items: [] };
  const n = Math.max(L.items?.length ?? 0, R.items?.length ?? 0);
  let rows = '';
  for (let i = 0; i < n; i++) {
    rows += `
      <div class="a-cmp__row">
        <div class="a-cmp__cell a-cmp__cell--a">${safe(L.items?.[i] ?? '')}</div>
        <div class="a-cmp__cell a-cmp__cell--b">${safe(R.items?.[i] ?? '')}</div>
      </div>`;
  }

  const body = `
    <h1 class="a-h1">${safe(d.title)}</h1>
    <div class="a-cmp">
      <div class="a-cmp__head">
        <div class="a-cmp__hcell a-cmp__hcell--a">${safe(L.label)}${L.title ? `<span>${safe(L.title)}</span>` : ''}</div>
        <div class="a-cmp__hcell a-cmp__hcell--b">${safe(R.label)}${R.title ? `<span>${safe(R.title)}</span>` : ''}</div>
      </div>
      <div class="a-cmp__rows">${rows}</div>
    </div>
    ${d.subtitle ? `<div class="a-cmp__insight">${safe(d.subtitle)}</div>` : ''}`;

  return frame(body, {
    header: headerFor(d, BLOCK_LABELS.COMPARISON),
    footer: footerFor(d),
    className: 'is-comparison',
  });
}

// ============================================================
// TIMELINE — horizontal axis, alternating events (spec Prompt 14)
// ============================================================
export function renderTimeline(d: TimelineData & AcademicMeta): string {
  const steps = (d.steps ?? []).slice(0, 4);
  const events = steps
    .map(
      (s, i) => `
      <div class="a-tl__event a-tl__event--${i % 2 === 0 ? 'up' : 'down'}">
        <div class="a-tl__card">
          <p class="a-tl__name">${safe(s.title)}</p>
          <p class="a-tl__desc">${safe(s.body)}</p>
        </div>
        <span class="a-tl__date">${safe(s.date)}</span>
        <span class="a-tl__node"></span>
      </div>`,
    )
    .join('');

  const body = `
    <h1 class="a-h1">${safe(d.title)}</h1>
    <div class="a-tl">
      <span class="a-tl__axis"></span>
      ${events}
    </div>
    ${d.subtitle ? `<p class="a-tl__caption">${safe(d.subtitle)}</p>` : ''}`;

  return frame(body, {
    header: headerFor(d, BLOCK_LABELS.TIMELINE),
    footer: footerFor(d),
    className: 'is-timeline',
  });
}

// ============================================================
// FINDING — big-number result rows (spec Prompt 16)
// ============================================================
export function renderFinding(d: FindingData & AcademicMeta): string {
  const pts = (d.points ?? []).slice(0, 3);
  const rows = pts.length ? pts : d.evidence ? [{ text: d.evidence }] : [];
  const intro =
    pts.length && d.evidence ? d.evidence : 'Ish davomida quyidagi asosiy natijalar aniqlandi:';

  const list = rows
    .map(
      (p, i) => `
      <div class="a-find__row">
        <span class="a-find__num">${String(i + 1).padStart(2, '0')}</span>
        <span class="a-find__div"></span>
        <p class="a-find__text">${safe(p.text)}</p>
      </div>`,
    )
    .join('');

  const body = `
    <h1 class="a-h1">${safe(d.title)}</h1>
    <p class="a-find__intro">${safe(intro)}</p>
    <div class="a-find__list">${list}</div>
    <div class="a-find__cite">${citationZone(d.source, 'pill')}</div>`;

  return frame(body, {
    header: headerFor(d, BLOCK_LABELS.FINDING),
    footer: footerFor(d),
    className: 'is-finding',
  });
}

// ============================================================
// PROBLEMS_SOLUTIONS — colour-coded pairs (spec Prompt 17)
// ============================================================
export function renderProblemsSolutions(d: ProblemsSolutionsData & AcademicMeta): string {
  const pairs = (d.pairs ?? []).slice(0, 3);
  const rows = pairs
    .map(
      (p) => `
      <div class="a-ps__row">
        <div class="a-ps__card a-ps__card--problem">
          <span class="a-ps__label a-ps__label--problem">Muammo</span>
          <p class="a-ps__text">${safe(p.problem)}</p>
        </div>
        <span class="a-ps__arrow">${icon('arrow', 28)}</span>
        <div class="a-ps__card a-ps__card--solution">
          <span class="a-ps__label a-ps__label--solution">Yechim</span>
          <p class="a-ps__text">${safe(p.solution)}</p>
        </div>
      </div>`,
    )
    .join('');

  const body = `
    <h1 class="a-h1">${safe(d.title)}</h1>
    <div class="a-ps">${rows}</div>`;

  return frame(body, {
    header: headerFor(d, BLOCK_LABELS.PROBLEMS_SOLUTIONS),
    footer: footerFor(d),
    className: 'is-probsol',
  });
}

// ============================================================
// OBJECT_SUBJECT — nested object → subject (spec Prompt 5)
// ============================================================
export function renderObjectSubject(d: ObjectSubjectData & AcademicMeta): string {
  const o = d.object ?? { label: 'Obyekt', text: '' };
  const s = d.subject ?? { label: 'Predmet', text: '' };
  const body = `
    <h1 class="a-h1">${safe(d.title)}</h1>
    <div class="a-os">
      <div class="a-os__card a-os__card--object">
        <span class="a-eyebrow">${safe(o.label || 'Obyekt')}</span>
        <p class="a-os__text">${safe(o.text)}</p>
        <span class="a-os__tag">keng maydon</span>
      </div>
      <span class="a-os__arrow">${icon('arrow', 32)}</span>
      <div class="a-os__card a-os__card--subject">
        <span class="a-eyebrow a-eyebrow--accent">${safe(s.label || 'Predmet')}</span>
        <p class="a-os__text">${safe(s.text)}</p>
        <span class="a-os__tag a-os__tag--accent">obyekt ichida</span>
      </div>
    </div>`;

  return frame(body, {
    header: headerFor(d, BLOCK_LABELS.OBJECT_SUBJECT),
    footer: footerFor(d),
    className: 'is-objsubj',
  });
}

// ============================================================
// CLOSING — full-bleed thank-you (spec Prompt 21)
// ============================================================
// Only the thank-you line — no subtitle/contact/Q&A panel clutter.
export function renderClosing(d: ClosingData & AcademicMeta): string {
  const body = `
    <div class="a-closing">
      <div class="a-closing__left">
        <span class="a-eyebrow a-eyebrow--accent">Taqdimot yakuni</span>
        <h1 class="a-closing__msg">${safe(d.title || 'E’tiboringiz uchun rahmat')}</h1>
        <span class="a-closing__line"></span>
      </div>
    </div>`;

  return frame(body, { bleed: true, className: 'is-closing' });
}

// ============================================================
// SLIDE CSS  (Groups A + B + C + D)
// ============================================================
export const SLIDES_CSS = `
/* ---- shared slide primitives ---- */
.a-h1 {
  font-size: var(--type-h2);
  font-weight: 600;
  line-height: var(--lh-snug);
  letter-spacing: var(--ls-tight);
  color: var(--text-primary);
}
.a-eyebrow {
  display: block;
  font-size: var(--type-micro);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: var(--ls-label);
  color: var(--text-secondary);
}
.a-eyebrow--accent { color: var(--accent); }
.a-accent-line {
  display: block;
  width: 64px;
  height: var(--stroke-2);
  background: var(--accent);
  margin-top: var(--space-3);
}
.a-accent-line--center { margin-left: auto; margin-right: auto; }

/* ============ TITLE (editorial_split) ============ */
.a-slide.is-title { background: var(--surface-base); }
.a-title { display: flex; width: 100%; height: 100%; }
.a-title__left {
  width: 40%;
  background: var(--primary-dark);
  color: var(--text-on-dark);
  padding: var(--space-10) var(--space-8);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.a-title__ministry {
  font-size: var(--type-nano);
  text-transform: uppercase;
  letter-spacing: var(--ls-label);
  line-height: 1.5;
  opacity: 0.6;
}
.a-title__univ { font-size: 20px; font-weight: 600; line-height: 1.3; margin-top: var(--space-4); }
.a-title__sub { font-size: var(--type-small); line-height: 1.4; opacity: 0.85; margin-top: var(--space-1); }
.a-title__rule { display: block; width: 120px; height: 1px; background: rgba(255,255,255,0.2); margin-bottom: var(--space-3); }
.a-title__eyebrow {
  font-size: var(--type-micro);
  text-transform: uppercase;
  letter-spacing: var(--ls-label);
  opacity: 0.6;
  margin-bottom: 6px;
}
.a-title__name { font-size: 18px; font-weight: 500; }
.a-title__name--sm { font-size: var(--type-small); }
.a-title__meta { font-size: var(--type-label); opacity: 0.7; margin-top: 4px; }
.a-title__foot .a-title__meta { opacity: 0.6; }

.a-title__right {
  width: 60%;
  padding: var(--space-10);
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.a-title__badge {
  align-self: flex-start;
  background: var(--accent-muted);
  color: var(--accent-strong);
  font-size: var(--type-micro);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  padding: 8px 16px;
  border-radius: 6px;
  margin-bottom: var(--space-6);
}
.a-title__topic {
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: var(--ls-tight);
  color: var(--text-primary);
  max-width: 95%;
}
.a-title__accent { display: block; width: 64px; height: var(--stroke-2); background: var(--accent); margin-top: var(--space-6); }
.a-title__deco { position: absolute; right: var(--space-10); bottom: var(--space-10); display: flex; flex-direction: column; gap: 10px; align-items: flex-end; }
.a-title__deco span { display: block; height: 1px; background: var(--text-muted); }
.a-title__deco span:nth-child(1) { width: 80px; }
.a-title__deco span:nth-child(2) { width: 60px; }
.a-title__deco span:nth-child(3) { width: 40px; }

/* ============ CONTENT ============ */
.a-content { position: relative; height: 100%; display: flex; flex-direction: column; justify-content: center; }
.a-content__main { position: relative; z-index: 1; max-width: 1360px; }
.a-media { display:grid; grid-template-columns:minmax(0,1.08fr) minmax(520px,.92fr); gap:44px; align-items:stretch; margin-top:var(--space-5); }
.a-media__points { list-style:none; display:grid; gap:14px; align-content:center; }
.a-media__points li { display:flex; gap:14px; align-items:flex-start; padding:14px 0; border-bottom:var(--stroke-1) solid var(--border); }
.a-media__points li>span { color:var(--accent); flex:none; }
.a-media__points p { font-size:18px; line-height:1.45; color:var(--text-primary); }
.a-media__prose { align-self:center; font-size:22px; line-height:1.55; color:var(--text-primary); }
.a-wm-visual { height:520px; align-self:center; }
.a-content__lead {
  border-left: var(--stroke-4) solid var(--accent);
  padding-left: var(--space-3);
  font-size: var(--type-h4);
  font-weight: 500;
  line-height: 1.4;
  color: var(--text-primary);
  margin-top: var(--space-4);
}
.a-bullets { list-style: none; margin-top: var(--space-6); display: flex; flex-direction: column; gap: 20px; }
.a-bullet { display: flex; align-items: flex-start; gap: var(--space-2); }
.a-bullet__ico {
  flex: none;
  width: 40px; height: 40px;
  display: grid; place-items: center;
  background: var(--accent-muted);
  color: var(--accent-strong);
  border-radius: var(--radius-sm);
}
.a-bullet__text { font-size: 22px; line-height: 1.5; color: var(--text-primary); padding-top: 6px; }
.a-bullet__head { font-weight: 600; }
.a-content__cite { margin-top: var(--space-6); }
.a-content__ghost {
  position: absolute;
  right: -12px; top: 50%;
  transform: translateY(-50%);
  font-size: 200px;
  font-weight: 800;
  line-height: 1;
  color: var(--surface-sunken);
  text-transform: uppercase;
  letter-spacing: -0.04em;
  z-index: 0;
  pointer-events: none;
  white-space: nowrap;
}

/* ============ DEFINITION ============ */
.a-def { display: flex; gap: var(--space-8); height: 100%; align-items: center; }
.a-def__term { width: 40%; }
.a-def__word {
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: var(--ls-tight);
  color: var(--text-primary);
  margin-top: var(--space-3);
}
.a-def__body { width: 60%; }
.a-def__text {
  font-size: 22px;
  line-height: 1.55;
  color: var(--text-primary);
  margin-top: var(--space-2);
}
.a-def__note {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--surface-raised);
  border: var(--stroke-1) solid var(--border);
  border-radius: var(--radius-sm);
  padding: 20px 24px;
  margin-top: var(--space-3);
}
.a-def__note-lbl {
  font-size: var(--type-micro);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: var(--ls-label);
  color: var(--text-muted);
}
.a-def__note-txt { font-size: var(--type-small); line-height: 1.5; color: var(--text-secondary); }
.a-def__cite { margin-top: var(--space-4); }

/* ============ CONCLUSION ============ */
.a-concl { height: 100%; display: flex; flex-direction: column; justify-content: center; text-align: center; }
.a-concl__title { text-align: center; }
.a-concl__summary {
  font-size: var(--type-h3);
  font-weight: 500;
  line-height: 1.4;
  color: var(--text-primary);
  max-width: 1200px;
  margin: var(--space-6) auto 0;
  text-align: left;
}
.a-concl__cards { display: flex; gap: 20px; margin-top: var(--space-8); }
.a-concl__card {
  flex: 1;
  background: var(--surface-base);
  border: var(--stroke-1) solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  text-align: left;
}
.a-concl__ico { color: var(--accent); }
.a-concl__ctext { font-size: 18px; line-height: 1.5; color: var(--text-primary); margin-top: var(--space-2); }

/* ============ AGENDA ============ */
.a-agenda__title { margin-top: var(--space-4); }
.a-agenda { display: flex; gap: var(--space-8); margin-top: var(--space-6); flex: 1; min-height: 0; }
.a-agenda__list { list-style: none; flex: 0 0 60%; }
.a-agenda__row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 20px 0;
  border-bottom: var(--stroke-1) solid var(--border);
}
.a-agenda__num { flex: none; width: 48px; font-size: var(--type-h3); font-weight: 600; color: var(--accent); }
.a-agenda__text { font-size: 22px; line-height: 1.4; color: var(--text-primary); }
.a-agenda__side { flex: 0 0 30%; display: flex; flex-direction: column; justify-content: center; gap: var(--space-2); }
.a-agenda__bars { display: flex; flex-direction: column; gap: 12px; }
.a-agenda__bar { width: 80px; height: 16px; border-radius: 6px; background: var(--border); }
.a-agenda__bar.is-active { background: var(--accent); }
.a-agenda__count { font-size: var(--type-label); text-transform: uppercase; letter-spacing: var(--ls-label); color: var(--text-muted); margin-top: var(--space-3); }

/* ============ RELEVANCE ============ */
.a-rel__lead {
  border-left: var(--stroke-4) solid var(--accent);
  padding-left: var(--space-4);
  font-size: var(--type-h4);
  font-style: italic;
  line-height: 1.4;
  color: var(--text-primary);
  margin-top: var(--space-5);
  max-width: 1500px;
}
.a-rel__cards { display: flex; gap: var(--space-3); margin-top: var(--space-7); }
.a-rel__card {
  flex: 1;
  background: var(--surface-base);
  border: var(--stroke-1) solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}
.a-rel__num { font-size: var(--type-h3); font-weight: 700; color: var(--accent); }
.a-rel__ctext { font-size: var(--type-body); line-height: 1.5; color: var(--text-primary); margin-top: var(--space-2); }
.a-rel__card--stat { background: var(--primary-dark); border-color: var(--primary-dark); flex: 0 0 26%; }
.a-rel__card--stat .a-rel__ctext { color: var(--text-on-dark); }
.a-rel__stat-val { display: block; font-size: var(--type-display-2); font-weight: 700; line-height: 1; color: var(--accent); }
.a-rel__stat-unit { font-size: var(--type-h3); margin-left: 4px; }
.a-rel__cite { margin-top: var(--space-6); }

/* ============ AIM_TASKS ============ */
.a-aim__goal { margin-top: var(--space-5); }
.a-aim__aim { font-size: var(--type-h4); font-weight: 500; line-height: 1.4; color: var(--text-primary); margin-top: var(--space-2); max-width: 1500px; }
.a-aim__divider { display: flex; align-items: center; margin: var(--space-5) 0; }
.a-aim__divider::before { content: ''; flex: 1; height: 1px; background: var(--border); }
.a-aim__divider span { width: 32px; height: var(--stroke-2); background: var(--accent); }
.a-aim__divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
.a-aim__grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin-top: var(--space-3); }
.a-aim__cell {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  background: var(--surface-raised);
  border-radius: var(--radius-md);
  padding: var(--space-3);
}
.a-aim__badge {
  flex: none;
  width: 40px; height: 40px;
  display: grid; place-items: center;
  background: var(--accent);
  color: var(--text-on-dark);
  font-size: 18px; font-weight: 700;
  border-radius: var(--radius-full);
}
.a-aim__ctext { font-size: 18px; line-height: 1.4; color: var(--text-primary); padding-top: 6px; }

/* ============ STATS ============ */
.a-stats__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); margin-top: var(--space-7); }
.a-stats__card {
  background: var(--surface-base);
  border: var(--stroke-1) solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-6) var(--space-4);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.a-stats__label { font-size: var(--type-micro); font-weight: 600; text-transform: uppercase; letter-spacing: var(--ls-label); color: var(--text-secondary); }
.a-stats__num { font-size: var(--type-display-1); font-weight: 700; line-height: 1; color: var(--accent); margin-top: var(--space-3); }
.a-stats__unit { font-size: var(--type-h4); font-weight: 500; color: var(--text-secondary); margin-left: 6px; }
.a-stats__rule { width: 32px; height: 1px; background: var(--border); margin: var(--space-4) 0 var(--space-2); }
.a-stats__ctext { font-size: var(--type-small); line-height: 1.4; color: var(--text-primary); }
.a-stats__insight {
  display: inline-block;
  background: var(--accent-muted);
  color: var(--accent-deep);
  font-size: var(--type-label);
  font-weight: 500;
  padding: 12px 20px;
  border-radius: var(--radius-lg);
  margin-top: var(--space-5);
}
.a-stats__cite { margin-top: var(--space-4); }

/* ============ REFERENCES ============ */
.a-ref__std {
  display: inline-block;
  background: var(--surface-sunken);
  border: var(--stroke-1) solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--type-micro);
  font-weight: 500;
  color: var(--text-secondary);
  padding: 6px 12px;
  margin-top: var(--space-2);
}
.a-ref__list {
  list-style: none;
  columns: 2;
  column-gap: var(--space-6);
  margin-top: var(--space-5);
}
.a-ref__item {
  display: flex;
  gap: var(--space-2);
  break-inside: avoid;
  padding: 12px 0 16px;
  border-bottom: var(--stroke-1) solid var(--surface-sunken);
}
.a-ref__num {
  flex: none;
  position: relative;
  width: 36px; height: 36px;
  display: grid; place-items: center;
  background: var(--surface-raised);
  border: var(--stroke-1) solid var(--border);
  border-radius: var(--radius-full);
  font-size: var(--type-label);
  font-weight: 600;
  color: var(--text-primary);
}
.a-ref__num::before {
  content: '';
  position: absolute;
  top: -2px; left: -2px;
  width: 10px; height: 10px;
  border-radius: var(--radius-full);
}
.a-ref__num--law::before     { background: var(--accent); }
.a-ref__num--book::before    { background: var(--info); }
.a-ref__num--article::before { background: var(--warning); }
.a-ref__num--web::before     { background: var(--text-muted); }
.a-ref__text { font-size: var(--type-label); line-height: 1.5; color: var(--text-primary); }
.a-ref__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); margin-top: var(--space-4); }
.a-ref__legend { display: flex; gap: var(--space-3); flex-wrap: wrap; }
.a-ref__leg { display: inline-flex; align-items: center; gap: 8px; font-size: var(--type-micro); color: var(--text-secondary); }
.a-ref__dot { width: 10px; height: 10px; border-radius: var(--radius-full); }
.a-ref__dot--law     { background: var(--accent); }
.a-ref__dot--book    { background: var(--info); }
.a-ref__dot--article { background: var(--warning); }
.a-ref__dot--web     { background: var(--text-muted); }

/* ============ BATAFSIL ============ */
.a-bat__intro { font-size: var(--type-body); line-height: 1.5; color: var(--text-secondary); margin-top: var(--space-3); max-width: 1500px; }
.a-bat__grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin-top: var(--space-6); }
.a-bat__card {
  position: relative;
  background: var(--surface-base);
  border: var(--stroke-1) solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}
.a-bat__badge {
  display: grid; place-items: center;
  width: 36px; height: 36px;
  background: var(--accent-muted);
  color: var(--accent-strong);
  font-size: var(--type-label);
  font-weight: 700;
  border-radius: var(--radius-full);
}
.a-bat__corner {
  position: absolute; top: var(--space-4); right: var(--space-4);
  width: 24px; height: 24px;
  border-top: var(--stroke-2) solid var(--accent);
  border-right: var(--stroke-2) solid var(--accent);
}
.a-bat__ctext { font-size: 18px; line-height: 1.5; color: var(--text-primary); margin-top: var(--space-3); }

/* ============ MISOL ============ */
.a-misol { display: flex; gap: var(--space-6); height: 100%; align-items: stretch; }
.a-misol__left { flex: 0 0 58%; display: flex; flex-direction: column; justify-content: center; }
.a-misol__heading { font-size: var(--type-h3); font-weight: 600; line-height: 1.25; color: var(--text-primary); margin-top: var(--space-2); }
.a-misol__body { font-size: var(--type-body); line-height: 1.6; color: var(--text-primary); margin-top: var(--space-4); max-width: 900px; }
.a-misol__insight {
  flex: 1;
  background: var(--primary-dark);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.a-misol__ilabel {
  display: flex; align-items: center; gap: 10px;
  font-size: var(--type-micro);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: var(--ls-label);
  color: var(--accent);
}
.a-misol__itext { font-size: var(--type-h4); font-weight: 500; line-height: 1.4; color: var(--text-on-dark); margin-top: var(--space-3); }
.a-misol__iline { width: 48px; height: var(--stroke-2); background: var(--accent); margin-top: var(--space-5); }
.a-misol--visual .a-misol__left { flex-basis:52%; }
.a-misol--visual .a-wm-visual { flex:1; height:auto; min-height:520px; }
.a-misol__takeaway-inline { margin-top:var(--space-5); padding-top:var(--space-3); border-top:var(--stroke-2) solid var(--accent); color:var(--accent-strong); font-size:18px; font-weight:600; line-height:1.45; }

/* ============ TURLAR ============ */
.a-turlar__crit {
  display: inline-block;
  background: var(--surface-sunken);
  border: var(--stroke-1) solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--type-label);
  font-weight: 500;
  color: var(--text-secondary);
  padding: 8px 16px;
  margin-top: var(--space-3);
}
.a-turlar__grid { display: grid; gap: var(--space-3); margin-top: var(--space-6); flex: 1; align-content: center; }
.a-turlar__grid--count-4 { margin-top: var(--space-4); gap: var(--space-3); }
.a-turlar__card {
  background: var(--surface-base);
  border: var(--stroke-1) solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
}
.a-turlar__ico {
  width: 64px; height: 64px;
  display: grid; place-items: center;
  background: var(--accent-muted);
  color: var(--accent-strong);
  border-radius: var(--radius-full);
}
.a-turlar__label { font-size: var(--type-h4); font-weight: 600; color: var(--text-primary); margin-top: var(--space-3); }
.a-turlar__text { font-size: 17px; line-height: 1.5; color: var(--text-secondary); margin-top: var(--space-1); }
.a-turlar__grid--count-4 .a-turlar__card { padding: var(--space-3); }
.a-turlar__grid--count-4 .a-turlar__ico { width: 46px; height: 46px; }
.a-turlar__grid--count-4 .a-turlar__label { font-size: 20px; line-height: 1.15; margin-top: var(--space-2); }
.a-turlar__grid--count-4 .a-turlar__text { font-size: 15px; line-height: 1.32; }

/* ============ PROCESS ============ */
.a-proc__flow { display: flex; align-items: stretch; gap: 8px; margin-top: var(--space-7); }
.a-proc__step {
  flex: 1;
  background: var(--surface-base);
  border: var(--stroke-1) solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
}
.a-proc__num { font-size: var(--type-h3); font-weight: 700; color: var(--accent); }
.a-proc__name { font-size: 18px; font-weight: 600; line-height: 1.3; color: var(--text-primary); margin-top: var(--space-3); }
.a-proc__desc { font-size: 16px; line-height: 1.5; color: var(--text-secondary); margin-top: var(--space-1); }
.a-proc__arrow { flex: none; display: flex; align-items: center; color: var(--border-strong); }
.a-proc__bar { position: relative; height: 4px; border-radius: 2px; background: var(--surface-sunken); margin-top: var(--space-6); }
.a-proc__bar span { position: absolute; inset: 0; border-radius: 2px; background: var(--accent); }

/* ============ COMPARISON ============ */
.a-cmp { margin-top: var(--space-5); border: var(--stroke-1) solid var(--border); border-radius: var(--radius-md); overflow: hidden; }
.a-cmp__head { display: grid; grid-template-columns: 1fr 1fr; }
.a-cmp__hcell {
  padding: var(--space-3) var(--space-4);
  font-size: var(--type-h4);
  font-weight: 700;
  color: var(--text-primary);
  border-bottom: var(--stroke-2) solid var(--border-strong);
}
.a-cmp__hcell span { display: block; font-size: var(--type-label); font-weight: 400; color: var(--text-secondary); margin-top: 4px; }
.a-cmp__hcell--a { background: var(--surface-raised); border-right: var(--stroke-1) solid var(--border); border-bottom-color: var(--accent); }
.a-cmp__hcell--b { background: var(--surface-base); }
.a-cmp__row { display: grid; grid-template-columns: 1fr 1fr; border-top: var(--stroke-1) solid var(--border); }
.a-cmp__row:first-child { border-top: 0; }
.a-cmp__cell { padding: var(--space-3) var(--space-4); font-size: var(--type-body); line-height: 1.4; color: var(--text-primary); }
.a-cmp__cell--a { background: var(--surface-raised); border-right: var(--stroke-1) solid var(--border); }
.a-cmp__insight {
  display: inline-block;
  background: var(--accent-muted);
  color: var(--accent-deep);
  font-size: var(--type-label);
  font-weight: 500;
  padding: 12px 20px;
  border-radius: var(--radius-lg);
  margin-top: var(--space-5);
}

/* ============ TIMELINE ============ */
.a-tl { position: relative; height: 560px; margin-top: var(--space-6); display: flex; }
.a-tl__axis { position: absolute; left: 0; right: 0; top: 50%; height: 4px; background: var(--border-strong); border-radius: 2px; }
.a-tl__event { flex: 1; position: relative; }
.a-tl__node {
  position: absolute; left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  width: 24px; height: 24px;
  border-radius: var(--radius-full);
  background: var(--accent);
  border: 4px solid var(--surface-base);
  z-index: 2;
}
.a-tl__date { position: absolute; left: 50%; transform: translateX(-50%); font-size: var(--type-h2); font-weight: 700; color: var(--accent); }
.a-tl__card {
  position: absolute; left: 50%;
  transform: translateX(-50%);
  width: 280px;
  background: var(--surface-base);
  border: var(--stroke-1) solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
}
.a-tl__name { font-size: var(--type-small); font-weight: 600; color: var(--text-primary); }
.a-tl__desc { font-size: 16px; line-height: 1.5; color: var(--text-secondary); margin-top: 8px; }
.a-tl__event--up   .a-tl__date { top: calc(50% - 72px); }
.a-tl__event--up   .a-tl__card { bottom: calc(50% + 96px); }
.a-tl__event--down .a-tl__date { top: calc(50% + 36px); }
.a-tl__event--down .a-tl__card { top: calc(50% + 96px); }
.a-tl__caption { text-align: center; font-size: var(--type-label); color: var(--text-muted); margin-top: var(--space-4); }

/* ============ FINDING ============ */
.a-find__intro { font-size: var(--type-small); color: var(--text-secondary); margin-top: var(--space-2); }
.a-find__list { display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-6); }
.a-find__row {
  display: flex; align-items: center; gap: var(--space-4);
  background: var(--surface-raised);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}
.a-find__num { flex: none; width: 120px; font-size: var(--type-display-2); font-weight: 700; line-height: 1; color: var(--accent); text-align: center; }
.a-find__div { flex: none; width: 2px; align-self: stretch; background: var(--border-strong); }
.a-find__text { font-size: 22px; font-weight: 500; line-height: 1.5; color: var(--text-primary); }
.a-find__cite { margin-top: var(--space-5); }

/* ============ PROBLEMS_SOLUTIONS ============ */
.a-ps { display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-6); }
.a-ps__row { display: flex; align-items: stretch; gap: var(--space-3); }
.a-ps__card { flex: 1; border-radius: var(--radius-md); padding: var(--space-4); border: var(--stroke-1) solid var(--border); }
.a-ps__card--problem { background: var(--danger-soft); border-left: var(--stroke-4) solid var(--danger); }
.a-ps__card--solution { background: var(--success-soft); border-left: var(--stroke-4) solid var(--accent); }
.a-ps__arrow { flex: none; display: flex; align-items: center; color: var(--text-muted); }
.a-ps__label { display: block; font-size: var(--type-micro); font-weight: 700; text-transform: uppercase; letter-spacing: var(--ls-label); }
.a-ps__label--problem { color: var(--danger); }
.a-ps__label--solution { color: var(--accent-strong); }
.a-ps__text { font-size: var(--type-body); line-height: 1.5; color: var(--text-primary); margin-top: var(--space-2); }

/* ============ OBJECT_SUBJECT ============ */
.a-os { display: flex; align-items: stretch; gap: var(--space-4); margin-top: var(--space-6); flex: 1; }
.a-os__card { flex: 1; border-radius: var(--radius-md); padding: var(--space-6); display: flex; flex-direction: column; }
.a-os__card--object { background: var(--surface-base); border: var(--stroke-1) solid var(--border-strong); }
.a-os__card--subject { background: var(--surface-raised); border: var(--stroke-2) solid var(--accent); }
.a-os__text { font-size: 22px; line-height: 1.5; color: var(--text-primary); margin-top: var(--space-3); flex: 1; }
.a-os__tag { font-size: var(--type-micro); color: var(--text-muted); margin-top: var(--space-3); }
.a-os__tag--accent { color: var(--accent-strong); }
.a-os__arrow { flex: none; display: flex; align-items: center; color: var(--text-muted); }

/* ============ CLOSING ============ */
.a-slide.is-closing { background: var(--surface-base); }
.a-closing { display: flex; width: 100%; height: 100%; }
.a-closing__left {
  flex: 1;
  padding: var(--safe);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}
.a-closing__msg {
  font-size: var(--type-display-2);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: var(--ls-tight);
  color: var(--text-primary);
  margin-top: var(--space-4);
  max-width: 900px;
}
.a-closing__line { width: 96px; height: 3px; background: var(--accent); margin-top: var(--space-5); }
`;
