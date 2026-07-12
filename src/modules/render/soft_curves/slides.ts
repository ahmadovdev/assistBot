import {
  AgendaData,
  AimTasksData,
  BatafsilData,
  ClosingData,
  ComparisonData,
  ConclusionData,
  ContentData,
  DefinitionData,
  FindingData,
  MisolData,
  ObjectSubjectData,
  ProblemsSolutionsData,
  ProcessData,
  ReferencesData,
  RelevanceData,
  StatsData,
  TimelineData,
  TitleData,
  TurlarData,
} from '../templates/layouts';
import { columns, renderIcon, rich, safe, titleSize } from './components';
import { renderWikimediaVisual } from '../templates/wikimedia-visual';

type Meta = { pageNo?: string | number; total?: number };

function decor(): string {
  return '<div class="sc-ribbon"><span></span><span></span><span></span></div>';
}

function frame(data: Meta, body: string, className = ''): string {
  const cls = className ? ` ${className}` : '';
  return `<section class="sc-slide${cls}">
    ${decor()}
    <div class="sc-inner">${body}</div>
    ${data.pageNo ? `<div class="sc-page">${safe(data.pageNo)}</div>` : ''}
  </section>`;
}

function header(data: Record<string, any>, fallbackKicker = ''): string {
  const kicker = data.kicker ?? fallbackKicker;
  const title = data.title ?? data.term ?? '';
  return `<header class="sc-header">
    ${kicker ? `<div class="sc-kicker">${safe(kicker)}</div>` : ''}
    <h2 class="sc-title" style="font-size:${titleSize(title)}px">${rich(title)}</h2>
    ${data.subtitle ? `<p class="sc-subtitle">${rich(data.subtitle)}</p>` : ''}
    ${data.lead ? `<p class="sc-subtitle">${rich(data.lead)}</p>` : ''}
  </header>`;
}

function prose(value: unknown): string {
  return `<div class="sc-prose sc-card">${rich(value)}</div>`;
}

function iconDisc(name?: string): string {
  return `<div class="sc-icon">${renderIcon(name)}</div>`;
}

export function renderFallback(data: Record<string, any> & Meta): string {
  return frame(data, `<div class="sc-center"><h1 class="sc-hero">${rich(data.title ?? data.term ?? '…')}</h1></div>`);
}

export function renderTitle(data: TitleData & Meta): string {
  const meta = [
    data.university,
    data.faculty,
    data.department,
    data.direction,
    data.student ? `${data.student}${data.group ? ` · ${data.group}` : ''}` : undefined,
    data.advisor ? `Ilmiy rahbar: ${data.advisor}` : undefined,
    [data.city, data.year].filter(Boolean).join(' · ') || undefined,
  ].filter(Boolean);

  const body = `<div class="sc-cover-copy">
      ${data.workType ? `<div class="sc-kicker">${safe(data.workType)}</div>` : ''}
      ${data.ministry ? `<div class="sc-cover-ministry">${safe(data.ministry)}</div>` : ''}
      <h1 class="sc-cover-title" style="font-size:${titleSize(data.title, 67, 57, 48)}px">${rich(data.title)}</h1>
      ${data.subtitle ? `<p class="sc-subtitle">${rich(data.subtitle)}</p>` : ''}
      ${meta.length ? `<div class="sc-cover-meta">${meta.map((item) => `<span>${safe(item)}</span>`).join('')}</div>` : ''}
    </div>
    <div class="sc-cover-art">
      <div class="sc-blob"></div>
      <div class="sc-molecule">
        <i class="sc-bond b1"></i><i class="sc-bond b2"></i><i class="sc-bond b3"></i>
        <i class="sc-node n1"></i><i class="sc-node sc-node--teal n2"></i>
        <i class="sc-node n3"></i><i class="sc-node sc-node--teal n4"></i>
      </div>
      <div class="sc-glass"></div>
    </div>`;
  return frame(data, body, 'sc-cover');
}

export function renderAgenda(data: AgendaData & Meta): string {
  const body = `${header(data as any)}<div class="sc-agenda">${data.items.map((item, index) => `
    <div class="sc-agenda-row sc-card"><div class="sc-agenda-no">${String(index + 1).padStart(2, '0')}</div><div>${rich(item.text)}</div></div>`).join('')}</div>`;
  return frame(data, body, 'sc-agenda-slide');
}

export function renderRelevance(data: RelevanceData & Meta): string {
  if (data.paragraph !== undefined) {
    return frame(data, `${header({ ...data, lead: undefined } as any, 'Dolzarblik')}
      <div class="sc-prose-layout">${prose(data.paragraph)}${data.source ? `<div class="sc-source">${safe(data.source)}</div>` : ''}</div>`, 'sc-relevance');
  }
  const stat = data.stat ? `<div class="sc-relevance-visual sc-card"><strong>${data.stat.approx ? '~' : ''}${safe(data.stat.value)}${safe(data.stat.unit ?? '')}</strong><span>${rich(data.stat.label)}</span>${data.source ? `<small>${safe(data.source)}</small>` : ''}</div>` : `<div class="sc-relevance-visual sc-card"><div class="sc-orbit-mark">●</div></div>`;
  const body = `${header(data as any, 'Dolzarblik')}<div class="sc-relevance-grid"><div class="sc-reasons">${data.points.map((point, index) => `
    <div class="sc-reason sc-card"><div class="sc-reason-no">0${index + 1}</div><p>${rich(point.text)}</p></div>`).join('')}</div>${stat}</div>`;
  return frame(data, body, 'sc-relevance');
}

export function renderAimTasks(data: AimTasksData & Meta): string {
  const aim = data.paragraph ?? data.aim;
  const body = `${header(data as any, 'Maqsad va vazifalar')}
    <div class="sc-aim sc-card"><span>Asosiy maqsad</span><p>${rich(aim)}</p></div>
    <div class="sc-task-grid" style="--cols:${columns(data.tasks.length, 3)}">${data.tasks.map((task, index) => `<div class="sc-task sc-card"><strong>${String(index + 1).padStart(2, '0')}</strong><p>${rich(task)}</p></div>`).join('')}</div>`;
  return frame(data, body, 'sc-aim-slide');
}

export function renderObjectSubject(data: ObjectSubjectData & Meta): string {
  if (data.paragraph !== undefined) {
    return frame(data, `${header(data as any, "Ob'ekt va predmet")}${prose(data.paragraph)}`, 'sc-object-slide');
  }
  const body = `${header(data as any, "Ob'ekt va predmet")}<div class="sc-object-grid">
    ${[data.object, data.subject].map((item) => `<div class="sc-object sc-card"><span>${safe(item.label)}</span><p>${rich(item.text)}</p><i></i></div>`).join('')}
  </div>`;
  return frame(data, body, 'sc-object-slide');
}

export function renderDefinition(data: DefinitionData & Meta): string {
  const copy = data.paragraph ?? data.definition;
  const body = `<div class="sc-kicker">${safe(data.kicker ?? "Ta'rif")}</div>
    <div class="sc-definition sc-card"><div class="sc-term">${rich(data.term)}</div><div class="sc-definition-copy">${rich(copy)}</div></div>
    ${(data.aspects ?? []).length && data.paragraph === undefined ? `<div class="sc-grid" style="--cols:${columns(data.aspects!.length)}">${data.aspects!.map((item) => `<div class="sc-point sc-card">${iconDisc(item.icon)}<h3>${rich(item.label)}</h3><p>${rich(item.text)}</p></div>`).join('')}</div>` : ''}`;
  return frame(data, body, 'sc-definition-slide');
}

function renderVisualContent(data: ContentData & Meta): string {
  const copy = data.paragraph !== undefined
    ? prose(data.paragraph)
    : `<div class="sc-media-points">${data.points.map((point) => `
        <div class="sc-media-point sc-card">
          ${point.heading ? `<h3>${rich(point.heading)}</h3>` : ''}<p>${rich(point.text)}</p>
        </div>`).join('')}</div>`;
  const body = `${header(data as any, 'Mazmun')}
    <div class="sc-media-layout"><div>${copy}</div>${renderWikimediaVisual(data.visual, 'sc-wm-visual')}</div>`;
  return frame(data, body, 'sc-content-slide sc-has-visual');
}

export function renderContent(data: ContentData & Meta): string {
  if (data.visual) return renderVisualContent(data);
  if (data.paragraph !== undefined) {
    return frame(data, `${header({ ...data, lead: undefined } as any, 'Mazmun')}${prose(data.paragraph)}`, 'sc-content-slide');
  }
  const body = `${header(data as any, 'Mazmun')}<div class="sc-grid sc-content-grid sc-count-${data.points.length}" style="--cols:${columns(data.points.length)}">${data.points.map((point) => `<div class="sc-point sc-card">${iconDisc(point.icon)}${point.heading ? `<h3>${rich(point.heading)}</h3>` : ''}<p>${rich(point.text)}</p></div>`).join('')}</div>`;
  return frame(data, body, 'sc-content-slide');
}

export function renderProcess(data: ProcessData & Meta): string {
  const body = `${header(data as any, 'Jarayon')}<div class="sc-process sc-count-${data.steps.length}" style="--cols:${columns(data.steps.length, 5)}">${data.steps.map((step, index) => `<div class="sc-process-card sc-card"><div class="sc-step">${safe(step.label ?? String(index + 1))}</div><h3>${rich(step.title)}</h3><p>${rich(step.body)}</p></div>`).join('')}</div>`;
  return frame(data, body, 'sc-process-slide');
}

export function renderBatafsil(data: BatafsilData & Meta): string {
  const copy = data.paragraph ?? data.body;
  const points = data.paragraph === undefined ? (data.points ?? []) : [];
  const body = `${header(data as any, 'Batafsil')}<div class="sc-detail${points.length ? '' : ' sc-detail--single'}">${prose(copy)}${points.length ? `<div class="sc-detail-points">${points.map((point) => `<div class="sc-detail-chip sc-card">${rich(point.text)}</div>`).join('')}</div>` : ''}</div>`;
  return frame(data, body, 'sc-detail-slide');
}

export function renderMisol(data: MisolData & Meta): string {
  const visual = data.visual
    ? renderWikimediaVisual(data.visual, 'sc-wm-visual')
    : '<div class="sc-leaf-wrap"><div class="sc-leaf"></div><div class="sc-glass sc-glass--small"></div></div>';
  const body = `${header(data as any, 'Misol')}<div class="sc-example"><div>${prose(data.paragraph ?? data.body)}${data.takeaway ? `<div class="sc-takeaway">${rich(data.takeaway)}</div>` : ''}</div>${visual}</div>`;
  return frame(data, body, 'sc-example-slide');
}

export function renderTurlar(data: TurlarData & Meta): string {
  const items = data.items.slice(0, 4);
  const body = `${header(data as any, 'Turlari')}<div class="sc-grid sc-types-grid sc-count-${items.length}" style="--cols:${columns(items.length, 2)}">${items.map((item) => `<div class="sc-point sc-card">${iconDisc(item.icon)}<h3>${rich(item.label)}</h3><p>${rich(item.text)}</p></div>`).join('')}</div>`;
  return frame(data, body, 'sc-types-slide');
}

export function renderComparison(data: ComparisonData & Meta): string {
  const side = (item: ComparisonData['left'], cls: string) => `<div class="sc-compare-card sc-card ${cls}"><span>${safe(item.label)}</span>${item.title ? `<h3>${rich(item.title)}</h3>` : ''}<ul>${item.items.map((value) => `<li>${rich(value)}</li>`).join('')}</ul></div>`;
  const body = `${header(data as any, 'Qiyosiy tahlil')}<div class="sc-compare">${side(data.left, 'left')}<div class="sc-vs">VS</div>${side(data.right, 'right')}</div>`;
  return frame(data, body, 'sc-comparison-slide');
}

export function renderStats(data: StatsData & Meta): string {
  const body = `${header(data as any, 'Statistika')}<div class="sc-stats sc-count-${data.stats.length}" style="--cols:${columns(data.stats.length)}">${data.stats.map((stat) => `<div class="sc-stat sc-card"><div><strong>${stat.approx ? '~' : ''}${safe(stat.value)}</strong>${stat.unit ? `<span>${safe(stat.unit)}</span>` : ''}</div><h3>${rich(stat.label)}</h3>${stat.description ? `<p>${rich(stat.description)}</p>` : ''}</div>`).join('')}</div>${data.insight ? `<div class="sc-insight">${rich(data.insight)}</div>` : ''}${data.source ? `<div class="sc-source">Manba: ${safe(data.source)}</div>` : ''}`;
  return frame(data, body, 'sc-stats-slide');
}

export function renderTimeline(data: TimelineData & Meta): string {
  const body = `${header(data as any, 'Xronologiya')}<div class="sc-timeline sc-count-${data.steps.length}" style="--cols:${columns(data.steps.length)}">${data.steps.map((step) => `<div class="sc-timeline-item sc-card"><i></i><strong>${safe(step.date)}</strong><h3>${rich(step.title)}</h3><p>${rich(step.body)}</p></div>`).join('')}</div>`;
  return frame(data, body, 'sc-timeline-slide');
}

export function renderFinding(data: FindingData & Meta): string {
  const body = `${header(data as any, 'Natija')}<div class="sc-finding"><div class="sc-evidence sc-card">${rich(data.evidence)}${(data.points ?? []).length ? `<div class="sc-finding-chips">${data.points!.map((point) => `<span>${rich(point.text)}</span>`).join('')}</div>` : ''}</div><div class="sc-finding-side">${data.interpretation ? `<div class="sc-finding-box sc-card"><h3>Interpretatsiya</h3><p>${rich(data.interpretation)}</p></div>` : ''}${data.limitation ? `<div class="sc-finding-box sc-card"><h3>Cheklov</h3><p>${rich(data.limitation)}</p></div>` : ''}${data.source ? `<div class="sc-finding-box sc-card"><h3>Manba</h3><p>${safe(data.source)}</p></div>` : ''}</div></div>`;
  return frame(data, body, 'sc-finding-slide');
}

export function renderProblemsSolutions(data: ProblemsSolutionsData & Meta): string {
  const body = `${header(data as any, 'Muammolar va yechimlar')}<div class="sc-pairs sc-count-${data.pairs.length}">${data.pairs.map((pair) => `<div class="sc-pair"><div class="sc-problem sc-card">${rich(pair.problem)}</div><div class="sc-arrow">→</div><div class="sc-solution sc-card">${rich(pair.solution)}</div></div>`).join('')}</div>`;
  return frame(data, body, 'sc-problems-slide');
}

export function renderConclusion(data: ConclusionData & Meta): string {
  if (data.paragraph !== undefined) {
    return frame(data, `${header(data as any, 'Xulosa')}${prose(data.paragraph)}${data.closing ? `<div class="sc-closing-band">${rich(data.closing)}</div>` : ''}`, 'sc-conclusion-slide');
  }
  const body = `${header(data as any, 'Xulosa')}<div class="sc-conclusion-grid">${data.points.map((point, index) => `<div class="sc-conclusion-point sc-card"><strong>0${index + 1}</strong><p>${rich(point)}</p></div>`).join('')}</div>${data.closing ? `<div class="sc-closing-band">${rich(data.closing)}</div>` : ''}`;
  return frame(data, body, 'sc-conclusion-slide');
}

export function renderReferences(data: ReferencesData & Meta): string {
  const typeLabel: Record<string, string> = { law: 'Qonun', book: 'Kitob', article: 'Maqola', web: 'Web' };
  const body = `${header(data as any, 'Manbalar')}<div class="sc-references${data.items.length > 5 ? ' sc-references--two' : ''}">${data.items.map((item) => `<div class="sc-reference sc-card"><span>${safe(typeLabel[item.type ?? ''] ?? 'Manba')}</span><p>${rich(item.text)}</p></div>`).join('')}</div>`;
  return frame(data, body, 'sc-references-slide');
}

export function renderClosing(data: ClosingData & Meta): string {
  return frame(data, `<div class="sc-closing-content"><h1>${rich(data.title)}</h1></div><div class="sc-closing-ring"></div><div class="sc-glass sc-glass--closing"></div>`, 'sc-closing-slide');
}

export const SOFT_CURVES_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700&family=Playfair+Display:wght@500;600&display=swap');

@page { size: 1280px 720px; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #dcd9e5; }
body { font-family: "DM Sans", Arial, sans-serif; color: #1d1930; }
.sc-deck { width: 1280px; }
.sc-slide {
  --ink:#1d1930; --muted:#6f6983; --paper:#fbfaff; --lilac:#6f4cc3;
  --lilac-mid:#9f7aea; --lilac-soft:#ede3ff; --teal:#4fc8bc; --teal-dark:#168c84;
  --line:rgba(51,39,89,.12); --shadow:0 16px 38px rgba(75,59,110,.12);
  width:1280px; height:720px; position:relative; overflow:hidden; page-break-after:always;
  background:var(--paper); isolation:isolate;
}
.sc-slide::before,.sc-slide::after { content:""; position:absolute; z-index:0; pointer-events:none; }
.sc-slide::before { width:410px; height:235px; right:-105px; top:-84px; border-radius:42% 58% 62% 38% / 45% 35% 65% 55%; background:linear-gradient(135deg,rgba(191,159,255,.72),rgba(228,219,255,.25) 52%,rgba(80,204,192,.45)); transform:rotate(-12deg); }
.sc-slide::after { width:330px; height:210px; left:-145px; bottom:-125px; border-radius:62% 38% 48% 52%; background:linear-gradient(135deg,rgba(79,200,188,.30),rgba(180,145,255,.24)); transform:rotate(15deg); }
.sc-inner { position:absolute; inset:0; z-index:2; padding:58px 70px 54px; }
.sc-page { position:absolute; z-index:3; right:70px; bottom:27px; color:#918ba0; font-size:12px; font-weight:700; }
.sc-ribbon { position:absolute; z-index:1; width:290px; height:96px; right:25px; top:18px; opacity:.72; transform:rotate(-5deg); }
.sc-ribbon span { position:absolute; inset:0; border-radius:55% 45% 60% 40%; border:11px solid rgba(153,106,233,.25); box-shadow:inset 0 0 18px rgba(255,255,255,.9),0 14px 22px rgba(84,52,141,.08); transform:skewX(-20deg); }
.sc-ribbon span:nth-child(2) { inset:17px 28px; border-color:rgba(74,198,185,.28); transform:skewX(20deg); }
.sc-ribbon span:nth-child(3) { inset:32px 60px; border-color:rgba(255,255,255,.72); }
.sc-header { position:relative; z-index:2; max-width:1040px; }
.sc-kicker { color:var(--lilac); font-size:12px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; }
.sc-title { max-width:1040px; margin:10px 0 0; font-family:"Manrope",Arial,sans-serif; font-weight:600; line-height:1.06; letter-spacing:0; }
.sc-subtitle { max-width:900px; margin:13px 0 0; color:var(--muted); font-size:20px; line-height:1.42; }
.sc-card { border:1px solid rgba(95,65,147,.11); border-radius:20px; background:rgba(255,255,255,.80); box-shadow:var(--shadow); }
.sc-grid { display:grid; grid-template-columns:repeat(var(--cols),minmax(0,1fr)); gap:15px; margin-top:26px; }
.sc-point { min-height:165px; padding:19px; }
.sc-point h3 { margin:12px 0 8px; font-size:19px; line-height:1.25; }
.sc-point p { margin:0; color:var(--muted); font-size:16px; line-height:1.45; }
.sc-grid.sc-count-2 .sc-point { min-height:292px; padding:29px; display:flex; flex-direction:column; justify-content:center; }
.sc-grid.sc-count-3 .sc-point { min-height:244px; padding:25px; }
.sc-grid.sc-count-2 .sc-icon,.sc-grid.sc-count-3 .sc-icon { width:48px; height:48px; }
.sc-grid.sc-count-2 .sc-point h3 { margin-top:20px; font-size:22px; }
.sc-grid.sc-count-3 .sc-point h3 { margin-top:17px; font-size:19px; }
.sc-grid.sc-count-2 .sc-point p { font-size:16px; line-height:1.55; }
.sc-grid.sc-count-3 .sc-point p { font-size:16px; line-height:1.5; }
.sc-types-grid.sc-count-4 { gap:13px; margin-top:20px; }
.sc-types-grid.sc-count-4 .sc-point { min-height:0; padding:17px 18px; overflow:hidden; }
.sc-types-grid.sc-count-4 .sc-icon { width:38px; height:38px; }
.sc-types-grid.sc-count-4 .sc-point h3 { margin:9px 0 5px; font-size:17px; line-height:1.16; }
.sc-types-grid.sc-count-4 .sc-point p { font-size:14.6px; line-height:1.32; }
.sc-icon { width:42px; height:42px; display:grid; place-items:center; border-radius:14px; color:var(--lilac); background:linear-gradient(145deg,#f4edff,#e4faf6); border:1px solid rgba(102,74,157,.1); }
.sc-center { height:100%; display:grid; place-items:center; text-align:center; }
.sc-hero { max-width:1000px; font:600 64px/1.05 "Manrope",sans-serif; }
.sc-prose { padding:30px 34px; color:#443e56; font-size:22px; line-height:1.58; }
.sc-prose-layout,.sc-detail { margin-top:28px; }
.sc-source { margin-top:10px; color:var(--muted); font-size:11px; }

/* Cover */
.sc-cover .sc-inner { display:grid; grid-template-columns:1.12fr .88fr; align-items:center; gap:42px; }
.sc-cover-copy { max-width:760px; }
.sc-cover-ministry { margin-top:10px; color:var(--muted); font-size:13px; line-height:1.35; }
.sc-cover-title { margin:16px 0 0; font-family:"Manrope",sans-serif; line-height:1.03; letter-spacing:0; }
.sc-cover-meta { margin-top:22px; display:flex; flex-wrap:wrap; gap:8px 18px; color:var(--muted); font-size:12px; }
.sc-cover-meta span { padding-right:18px; border-right:1px solid var(--line); }
.sc-cover-meta span:last-child { border-right:0; }
.sc-cover-art { height:76%; position:relative; }
.sc-blob { position:absolute; inset:6% 3% 3% 8%; border-radius:43% 57% 58% 42% / 39% 43% 57% 61%; background:linear-gradient(145deg,rgba(224,207,255,.95),rgba(246,242,255,.84) 48%,rgba(183,235,227,.85)); box-shadow:0 28px 50px rgba(91,62,147,.18),inset 0 0 0 1px rgba(255,255,255,.7); transform:rotate(-7deg); }
.sc-molecule { position:absolute; inset:13% 7% 9% 12%; }
.sc-node { position:absolute; display:block; border-radius:50%; background:radial-gradient(circle at 30% 25%,white,#a889e9 45%,#6f4cc3 100%); box-shadow:0 13px 22px rgba(88,55,145,.2); }
.sc-node--teal { background:radial-gradient(circle at 30% 25%,white,#72d7cd 45%,#1f8f88 100%); }
.sc-node.n1 { width:78px; height:78px; left:62px; top:62px; }.sc-node.n2{width:49px;height:49px;left:235px;top:125px}.sc-node.n3{width:38px;height:38px;left:218px;top:8px}.sc-node.n4{width:60px;height:60px;left:3px;top:171px}
.sc-bond { position:absolute; height:5px; border-radius:9px; transform-origin:0 50%; background:linear-gradient(90deg,rgba(106,75,174,.6),rgba(54,174,164,.45)); }.sc-bond.b1{width:165px;left:96px;top:95px;transform:rotate(22deg)}.sc-bond.b2{width:125px;left:108px;top:94px;transform:rotate(-42deg)}.sc-bond.b3{width:120px;left:48px;top:166px;transform:rotate(-22deg)}
.sc-glass { position:absolute; width:92px; height:92px; right:-6px; top:8px; border-radius:50%; background:radial-gradient(circle at 32% 25%,rgba(255,255,255,.95),rgba(255,255,255,.20) 35%,rgba(152,115,232,.16) 58%,rgba(54,188,176,.26)); border:1px solid rgba(255,255,255,.9); box-shadow:inset 0 1px 8px rgba(255,255,255,.9),inset -12px -15px 30px rgba(101,71,174,.10),0 18px 32px rgba(77,52,126,.16); }

/* Agenda / relevance */
.sc-agenda { max-width:940px; margin-top:28px; display:grid; gap:12px; }
.sc-agenda-row { min-height:67px; padding:10px 18px 10px 11px; display:grid; grid-template-columns:48px 1fr; align-items:center; gap:14px; font-size:16px; font-weight:650; }
.sc-agenda-no,.sc-reason-no { display:grid; place-items:center; color:var(--lilac); font-weight:800; background:linear-gradient(145deg,#eee3ff,#e2f8f4); }
.sc-agenda-no { width:42px; height:42px; border-radius:14px; font-size:12px; }
.sc-relevance-grid { display:grid; grid-template-columns:1fr .42fr; gap:20px; margin-top:25px; }
.sc-reasons { display:grid; gap:12px; }
.sc-reason { min-height:77px; padding:14px 17px; display:grid; grid-template-columns:38px 1fr; gap:13px; align-items:center; }
.sc-reason-no { width:36px; height:36px; border-radius:12px; font-size:11px; }
.sc-reason p { margin:0; color:#494356; font-size:16px; line-height:1.42; }
.sc-relevance-visual { min-height:255px; padding:28px; display:grid; place-content:center; text-align:center; position:relative; overflow:hidden; }
.sc-relevance-visual::before { content:""; position:absolute; width:230px; height:230px; left:50%; top:50%; transform:translate(-50%,-50%); border-radius:50%; background:radial-gradient(circle at 30% 25%,white,rgba(180,144,244,.55),rgba(74,194,181,.62)); }
.sc-relevance-visual strong,.sc-relevance-visual span,.sc-relevance-visual small,.sc-orbit-mark { position:relative; z-index:1; }
.sc-relevance-visual strong { font:700 39px/1 "Manrope"; }.sc-relevance-visual span{margin-top:8px;font-size:13px;font-weight:700}.sc-relevance-visual small{margin-top:10px;color:#4f5965;font-size:10px}.sc-orbit-mark{font-size:54px;color:white}

/* Aim / object / definition */
.sc-aim { margin-top:22px; padding:18px 22px; border-left:6px solid var(--lilac-mid); }
.sc-aim span { color:var(--lilac); font-size:10px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; }.sc-aim p{margin:8px 0 0;font-size:18px;line-height:1.42}
.sc-task-grid { margin-top:14px; display:grid; grid-template-columns:repeat(var(--cols),1fr); gap:12px; }
.sc-task { min-height:104px; padding:16px; }.sc-task strong{color:var(--lilac);font:600 23px/1 "Playfair Display"}.sc-task p{margin:8px 0 0;color:#4b4557;font-size:15px;line-height:1.38}
.sc-object-grid { margin-top:28px; display:grid; grid-template-columns:1fr 1fr; gap:20px; }
.sc-object { min-height:270px; padding:30px; position:relative; overflow:hidden; }.sc-object:first-child{background:linear-gradient(145deg,rgba(245,238,255,.95),rgba(255,255,255,.84))}.sc-object:last-child{background:linear-gradient(145deg,rgba(226,249,245,.95),rgba(255,255,255,.84))}
.sc-object span { color:var(--lilac); font-size:11px; font-weight:800; letter-spacing:.13em; text-transform:uppercase; }.sc-object p{max-width:84%;margin:20px 0 0;font-size:18px;line-height:1.5}.sc-object i{position:absolute;right:24px;bottom:17px;width:82px;height:82px;border-radius:28px 48px;background:linear-gradient(145deg,rgba(157,116,232,.36),rgba(72,195,183,.30));transform:rotate(24deg)}
.sc-definition { margin-top:22px; padding:28px; display:grid; grid-template-columns:.65fr 1.35fr; gap:28px; align-items:center; }
.sc-term { padding-right:26px; border-right:1px solid var(--line); color:var(--lilac); font:600 48px/1.05 "Playfair Display",serif; overflow-wrap:anywhere; }.sc-definition-copy{font-size:18px;line-height:1.55;color:#464052}

/* Content / process / detail / example */
.sc-content-grid { margin-top:25px; }
.sc-media-layout{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(360px,.92fr);gap:24px;align-items:stretch;margin-top:24px}.sc-media-points{display:grid;gap:10px}.sc-media-point{padding:15px 18px}.sc-media-point h3{margin:0 0 6px;font-size:18px}.sc-media-point p{margin:0;color:var(--muted);font-size:15px;line-height:1.42}.sc-wm-visual{height:330px;align-self:center}.sc-has-visual .sc-prose{font-size:19px;line-height:1.5;padding:22px}
.sc-process { display:grid; grid-template-columns:repeat(var(--cols),1fr); gap:13px; margin-top:28px; position:relative; }
.sc-process::before { content:""; position:absolute; left:6%; right:6%; top:26px; height:2px; background:linear-gradient(90deg,#d8c4ff,var(--teal)); z-index:-1; }
.sc-process-card { min-height:225px; padding:17px; }.sc-step{width:51px;height:51px;display:grid;place-items:center;border-radius:16px;color:white;font-size:10px;font-weight:800;background:linear-gradient(145deg,var(--lilac-mid),var(--teal));box-shadow:0 11px 22px rgba(96,69,156,.18)}.sc-process-card h3{margin:17px 0 8px;font-size:18px}.sc-process-card p{margin:0;color:var(--muted);font-size:15px;line-height:1.45}
.sc-process.sc-count-2 .sc-process-card{min-height:292px;padding:27px}.sc-process.sc-count-3 .sc-process-card{min-height:260px;padding:23px}.sc-process.sc-count-2 .sc-process-card h3{font-size:22px;margin-top:24px}.sc-process.sc-count-3 .sc-process-card h3{font-size:19px;margin-top:20px}.sc-process.sc-count-2 .sc-process-card p{font-size:16px;line-height:1.55}.sc-process.sc-count-3 .sc-process-card p{font-size:15px;line-height:1.5}
.sc-detail { display:grid; grid-template-columns:1.3fr .7fr; gap:19px; }.sc-detail--single{grid-template-columns:1fr}.sc-detail-points{display:grid;gap:12px;align-content:start}.sc-detail-chip{padding:18px;font-size:16px;font-weight:650}
.sc-example { display:grid; grid-template-columns:1fr .78fr; gap:32px; align-items:center; margin-top:25px; }.sc-takeaway{margin-top:16px;padding:16px 19px;border-left:4px solid var(--teal);border-radius:0 14px 14px 0;background:rgba(220,247,242,.68);font-size:16px;font-weight:650}.sc-leaf-wrap{min-height:300px;position:relative;display:grid;place-items:center}.sc-leaf{width:280px;height:170px;border-radius:95% 5% 95% 5%;transform:rotate(-28deg);background:linear-gradient(145deg,#bdf1df,#4ab99d 52%,#17806f);box-shadow:0 28px 42px rgba(36,128,108,.24),inset 0 0 0 1px rgba(255,255,255,.55)}.sc-glass--small{right:26px;top:10px;width:70px;height:70px}

/* Compare / stats / timeline */
.sc-compare { display:grid; grid-template-columns:1fr 62px 1fr; gap:16px; margin-top:26px; align-items:stretch; }.sc-compare-card{min-height:350px;padding:30px}.sc-compare-card.left{background:linear-gradient(145deg,rgba(244,237,255,.92),rgba(255,255,255,.86))}.sc-compare-card.right{background:linear-gradient(145deg,rgba(229,249,246,.95),rgba(255,255,255,.86))}.sc-compare-card>span{color:var(--lilac);font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.sc-compare-card h3{margin:13px 0 20px;font-size:24px}.sc-compare-card ul{list-style:none;padding:0;margin:0;display:grid;gap:16px}.sc-compare-card li{position:relative;padding-left:23px;color:#4d475f;font-size:17px;line-height:1.45}.sc-compare-card li::before{content:"";position:absolute;left:0;top:7px;width:10px;height:10px;border-radius:3px;background:linear-gradient(145deg,var(--lilac-mid),var(--teal))}.sc-vs{align-self:center;width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:white;box-shadow:var(--shadow);font-size:11px;font-weight:800;color:var(--lilac)}
.sc-stats { display:grid; grid-template-columns:repeat(var(--cols),1fr); gap:14px; margin-top:28px; }.sc-stat{min-height:180px;padding:20px}.sc-stat>div{display:flex;align-items:flex-end;gap:7px}.sc-stat strong{font:700 46px/1 "Manrope";letter-spacing:0}.sc-stat>div span{padding-bottom:5px;color:var(--lilac);font-size:13px;font-weight:800}.sc-stat h3{margin:14px 0 8px;font-size:16px}.sc-stat p{margin:0;color:var(--muted);font-size:15px;line-height:1.4}.sc-stats.sc-count-2 .sc-stat{min-height:252px;padding:28px}.sc-stats.sc-count-3 .sc-stat{min-height:226px;padding:25px}.sc-stats.sc-count-2 .sc-stat strong,.sc-stats.sc-count-3 .sc-stat strong{font-size:54px}.sc-stats.sc-count-2 .sc-stat h3{font-size:18px;margin-top:20px}.sc-stats.sc-count-3 .sc-stat h3{font-size:16px;margin-top:18px}.sc-stats.sc-count-2 .sc-stat p{font-size:15px;line-height:1.5}.sc-stats.sc-count-3 .sc-stat p{font-size:15px;line-height:1.45}.sc-insight{margin-top:15px;padding:14px 18px;border-radius:15px;background:linear-gradient(90deg,rgba(111,76,195,.10),rgba(79,200,188,.11));font-size:16px;font-weight:600}
.sc-timeline { display:grid; grid-template-columns:repeat(var(--cols),1fr); gap:16px; margin-top:32px; position:relative; }.sc-timeline::before{content:"";position:absolute;z-index:2;top:28px;left:4%;right:4%;height:3px;border-radius:9px;background:linear-gradient(90deg,rgba(151,111,232,.4),rgba(67,190,179,.45))}.sc-timeline-item{position:relative;min-height:270px;padding:72px 18px 22px}.sc-timeline-item i{position:absolute;z-index:3;top:17px;left:20px;width:23px;height:23px;border-radius:50%;background:white;border:6px solid var(--lilac-mid);box-shadow:0 0 0 5px rgba(161,122,232,.12)}.sc-timeline-item:nth-child(even) i{border-color:var(--teal)}.sc-timeline-item strong{color:var(--lilac);font:600 27px/1 "Playfair Display"}.sc-timeline-item h3{margin:12px 0 9px;font-size:18px}.sc-timeline-item p{margin:0;color:var(--muted);font-size:16px;line-height:1.45}.sc-timeline.sc-count-2 .sc-timeline-item{min-height:302px;padding:78px 28px 25px}.sc-timeline.sc-count-3 .sc-timeline-item{min-height:285px;padding:75px 23px 23px}.sc-timeline.sc-count-2 .sc-timeline-item strong{font-size:32px}.sc-timeline.sc-count-2 .sc-timeline-item h3{font-size:22px}.sc-timeline.sc-count-2 .sc-timeline-item p{font-size:16px;line-height:1.55}.sc-timeline.sc-count-3 .sc-timeline-item p{font-size:16px}

/* Finding / problems */
.sc-finding { display:grid; grid-template-columns:1.1fr .9fr; gap:20px; margin-top:24px; }.sc-evidence{padding:26px;color:#484253;font-size:19px;line-height:1.5}.sc-finding-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:15px}.sc-finding-chips span{padding:8px 11px;border-radius:10px;background:rgba(232,249,246,.9);color:#276f69;font-size:11px;font-weight:700}.sc-finding-side{display:grid;gap:11px;align-content:start}.sc-finding-box{padding:18px}.sc-finding-box h3{margin:0 0 7px;color:var(--lilac);font-size:10px;letter-spacing:.12em;text-transform:uppercase}.sc-finding-box p{margin:0;font-size:15px;line-height:1.42;color:#4c4659}
.sc-pairs { margin-top:24px; display:grid; gap:12px; }.sc-pair{display:grid;grid-template-columns:1fr 66px 1fr;gap:12px;align-items:stretch}.sc-problem,.sc-solution{min-height:112px;padding:20px 23px;display:flex;align-items:center;font-size:17px;line-height:1.45}.sc-pairs.sc-count-2 .sc-problem,.sc-pairs.sc-count-2 .sc-solution{min-height:158px;padding:27px;font-size:18px;line-height:1.5}.sc-problem{background:linear-gradient(145deg,rgba(255,237,235,.92),rgba(255,255,255,.88))}.sc-solution{background:linear-gradient(145deg,rgba(228,249,245,.95),rgba(255,255,255,.88))}.sc-arrow{display:grid;place-items:center;color:var(--lilac);font-size:24px}

/* Conclusion / references / closing */
.sc-conclusion-grid { margin-top:25px; display:grid; grid-template-columns:1fr 1fr; gap:14px; }.sc-conclusion-point{min-height:112px;padding:18px;display:flex;gap:14px;align-items:flex-start}.sc-conclusion-point strong{min-width:39px;height:39px;display:grid;place-items:center;border-radius:12px;color:white;background:linear-gradient(145deg,var(--lilac-mid),var(--teal));font-size:11px}.sc-conclusion-point p{margin:2px 0 0;color:#484254;font-size:16px;line-height:1.42}.sc-closing-band{margin-top:15px;padding:15px 20px;border-radius:17px;background:linear-gradient(90deg,rgba(111,76,195,.94),rgba(50,171,160,.88));color:white;font-size:16px;font-weight:600}
.sc-references { margin-top:24px; display:grid; gap:10px; }.sc-references--two{grid-template-columns:1fr 1fr;gap:10px 14px}.sc-reference{min-height:54px;padding:12px 16px;display:grid;grid-template-columns:62px 1fr;gap:14px;align-items:start}.sc-reference span{padding:5px 7px;border-radius:8px;background:var(--lilac-soft);color:var(--lilac);font-size:9px;font-weight:800;text-transform:uppercase;text-align:center}.sc-reference p{margin:0;font-size:14px;line-height:1.35;color:#4c465b}
.sc-closing-slide .sc-inner{display:grid;place-items:center;text-align:center}.sc-closing-content h1{max-width:980px;margin:0;font:600 82px/1.03 "Manrope",sans-serif}.sc-closing-ring{position:absolute;z-index:1;width:260px;height:115px;border:27px solid rgba(150,106,230,.28);border-radius:50%;right:-35px;bottom:18px;transform:rotate(-23deg);box-shadow:inset 0 0 18px rgba(255,255,255,.8),0 20px 32px rgba(83,53,137,.12)}.sc-glass--closing{z-index:1;left:70px;top:65px;width:96px;height:96px}

strong { font-weight:700; }
`;
