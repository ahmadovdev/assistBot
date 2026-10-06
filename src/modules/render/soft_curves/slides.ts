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

type Meta = { pageNo?: string | number; total?: number };

function decor(): string {
  return '<div class="sc-ribbon"><span></span><span></span><span></span></div>';
}

function frame(data: Meta, body: string, className = ''): string {
  const cls = className ? ` ${className}` : '';
  const decoration = /sc-cover|sc-closing-slide/.test(className)
    ? decor()
    : '<div class="sc-corner-curve"></div>';
  return `<section class="sc-slide${cls}">
    ${decoration}
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
  return `<div class="sc-prose">${rich(value)}</div>`;
}

function iconDisc(name?: string): string {
  return `<div class="sc-icon">${renderIcon(name)}</div>`;
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
    <div class="sc-agenda-row"><div class="sc-agenda-no">${String(index + 1).padStart(2, '0')}</div><div>${rich(item.text)}</div></div>`).join('')}</div>`;
  return frame(data, body, 'sc-agenda-slide');
}

export function renderRelevance(data: RelevanceData & Meta): string {
  if (data.paragraph !== undefined) {
    return frame(data, `${header({ ...data, lead: undefined } as any, 'Dolzarblik')}
      <div class="sc-relevance-essay"><div class="sc-relevance-signal">MUHIM</div>${prose(data.paragraph)}</div>
      ${data.source ? `<div class="sc-source">${safe(data.source)}</div>` : ''}`, 'sc-relevance');
  }
  const stat = data.stat ? `<div class="sc-relevance-visual"><strong>${data.stat.approx ? '~' : ''}${safe(data.stat.value)}${safe(data.stat.unit ?? '')}</strong><span>${rich(data.stat.label)}</span>${data.source ? `<small>${safe(data.source)}</small>` : ''}</div>` : `<div class="sc-relevance-visual"><div class="sc-orbit-mark">●</div></div>`;
  const body = `${header(data as any, 'Dolzarblik')}<div class="sc-relevance-grid"><div class="sc-reasons">${data.points.map((point, index) => `
    <div class="sc-reason"><div class="sc-reason-no">0${index + 1}</div><p>${rich(point.text)}</p></div>`).join('')}</div>${stat}</div>`;
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
    <div class="sc-definition-stage">
      <div class="sc-term">${rich(data.term)}</div>
      <div class="sc-definition-copy">${rich(copy)}</div>
    </div>
    ${(data.aspects ?? []).length && data.paragraph === undefined ? `<div class="sc-aspect-lines">${data.aspects!.map((item, index) => `<div class="sc-aspect-line"><span>0${index + 1}</span><div><h3>${rich(item.label)}</h3><p>${rich(item.text)}</p></div></div>`).join('')}</div>` : ''}`;
  return frame(data, body, 'sc-definition-slide');
}

export function renderContent(data: ContentData & Meta): string {
  if (data.paragraph !== undefined) {
    const statement = data.layout === 'curve_statement';
    return frame(data, `${header({ ...data, lead: undefined } as any, 'Mazmun')}
      <div class="${statement ? 'sc-statement-sheet' : 'sc-editorial-sheet'}">${prose(data.paragraph)}</div>`, 'sc-content-slide');
  }
  const body = `${header(data as any, 'Mazmun')}<div class="sc-content-lines sc-count-${data.points.length}">${data.points.map((point, index) => `<article class="sc-content-line"><span>${String(index + 1).padStart(2, '0')}</span><div>${point.heading ? `<h3>${rich(point.heading)}</h3>` : ''}<p>${rich(point.text)}</p></div></article>`).join('')}</div>`;
  return frame(data, body, 'sc-content-slide');
}

export function renderProcess(data: ProcessData & Meta): string {
  const body = `${header(data as any, 'Jarayon')}<div class="sc-process-flow sc-count-${data.steps.length}">${data.steps.map((step, index) => `<article class="sc-process-note"><div class="sc-step">${safe(step.label ?? String(index + 1).padStart(2, '0'))}</div><div><h3>${rich(step.title)}</h3><p>${rich(step.body)}</p></div></article>`).join('')}</div>`;
  return frame(data, body, 'sc-process-slide');
}

export function renderBatafsil(data: BatafsilData & Meta): string {
  const copy = data.paragraph ?? data.body;
  const points = data.paragraph === undefined ? (data.points ?? []) : [];
  const body = `${header(data as any, 'Batafsil')}<div class="sc-detail${points.length ? '' : ' sc-detail--single'}"><div class="sc-detail-copy">${prose(copy)}</div>${points.length ? `<div class="sc-detail-points">${points.map((point, index) => `<div class="sc-detail-chip"><span>0${index + 1}</span>${rich(point.text)}</div>`).join('')}</div>` : ''}</div>`;
  return frame(data, body, 'sc-detail-slide');
}

export function renderMisol(data: MisolData & Meta): string {
  const visual = '<div class="sc-leaf-wrap"><div class="sc-leaf"></div><div class="sc-glass sc-glass--small"></div></div>';
  const body = `${header(data as any, 'Misol')}<div class="sc-example"><div>${prose(data.paragraph ?? data.body)}${data.takeaway ? `<div class="sc-takeaway">${rich(data.takeaway)}</div>` : ''}</div>${visual}</div>`;
  return frame(data, body, 'sc-example-slide');
}

export function renderTurlar(data: TurlarData & Meta): string {
  const items = data.items;
  const body = `${header(data as any, 'Turlari')}<div class="sc-type-board sc-count-${items.length}">${items.map((item, index) => `<article class="sc-type-line"><div class="sc-type-index">${String(index + 1).padStart(2, '0')}</div><div><h3>${rich(item.label)}</h3><p>${rich(item.text)}</p></div></article>`).join('')}</div>`;
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
  const body = `${header(data as any, 'Xronologiya')}<div class="sc-timeline sc-count-${data.steps.length}" style="--cols:${columns(data.steps.length)}">${data.steps.map((step) => `<div class="sc-timeline-item"><i></i><strong>${safe(step.date)}</strong><h3>${rich(step.title)}</h3><p>${rich(step.body)}</p></div>`).join('')}</div>`;
  return frame(data, body, 'sc-timeline-slide');
}

export function renderFinding(data: FindingData & Meta): string {
  const body = `${header(data as any, 'Natija')}<div class="sc-finding"><div class="sc-evidence"><div class="sc-evidence-label">DALIL</div>${rich(data.evidence)}${(data.points ?? []).length ? `<div class="sc-finding-chips">${data.points!.map((point) => `<span>${rich(point.text)}</span>`).join('')}</div>` : ''}</div><div class="sc-finding-side">${data.interpretation ? `<div class="sc-finding-box"><h3>Interpretatsiya</h3><p>${rich(data.interpretation)}</p></div>` : ''}${data.limitation ? `<div class="sc-finding-box"><h3>Cheklov</h3><p>${rich(data.limitation)}</p></div>` : ''}${data.source ? `<div class="sc-finding-box"><h3>Manba</h3><p>${safe(data.source)}</p></div>` : ''}</div></div>`;
  return frame(data, body, 'sc-finding-slide');
}

export function renderProblemsSolutions(data: ProblemsSolutionsData & Meta): string {
  const body = `${header(data as any, 'Muammolar va yechimlar')}<div class="sc-pairs sc-count-${data.pairs.length}">${data.pairs.map((pair) => `<div class="sc-pair"><div class="sc-problem sc-card">${rich(pair.problem)}</div><div class="sc-arrow">→</div><div class="sc-solution sc-card">${rich(pair.solution)}</div></div>`).join('')}</div>`;
  return frame(data, body, 'sc-problems-slide');
}

export function renderConclusion(data: ConclusionData & Meta): string {
  if (data.paragraph !== undefined) {
    return frame(data, `${header(data as any, 'Xulosa')}<div class="sc-conclusion-prose"><span>∴</span>${prose(data.paragraph)}</div>${data.closing ? `<div class="sc-closing-band">${rich(data.closing)}</div>` : ''}`, 'sc-conclusion-slide');
  }
  const body = `${header(data as any, 'Xulosa')}<div class="sc-conclusion-grid">${data.points.map((point, index) => `<div class="sc-conclusion-point"><strong>0${index + 1}</strong><p>${rich(point)}</p></div>`).join('')}</div>${data.closing ? `<div class="sc-closing-band">${rich(data.closing)}</div>` : ''}`;
  return frame(data, body, 'sc-conclusion-slide');
}

export function renderReferences(data: ReferencesData & Meta): string {
  const typeLabel: Record<string, string> = { law: 'Qonun', book: 'Kitob', article: 'Maqola', web: 'Web' };
  const body = `${header(data as any, 'Manbalar')}<div class="sc-references${data.items.length > 5 ? ' sc-references--two' : ''}">${data.items.map((item) => `<div class="sc-reference"><span>${safe(typeLabel[item.type ?? ''] ?? 'Manba')}</span><p>${rich(item.text)}</p></div>`).join('')}</div>`;
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
.sc-slide::before { width:410px; height:235px; right:-105px; top:-84px; border-radius:42% 58% 62% 38% / 45% 35% 65% 55%; background:#e8def8; transform:rotate(-12deg); }
.sc-slide::after { width:330px; height:210px; left:-145px; bottom:-125px; border-radius:62% 38% 48% 52%; background:#d9f0ee; transform:rotate(15deg); }
.sc-inner { position:absolute; inset:0; z-index:2; padding:58px 70px 54px; }
.sc-page { position:absolute; z-index:3; right:70px; bottom:27px; color:#918ba0; font-size:12px; font-weight:700; }
.sc-ribbon { position:absolute; z-index:1; width:290px; height:96px; right:25px; top:18px; opacity:.72; transform:rotate(-5deg); }
.sc-ribbon span { position:absolute; inset:0; border-radius:55% 45% 60% 40%; border:11px solid rgba(153,106,233,.25); box-shadow:inset 0 0 18px rgba(255,255,255,.9),0 14px 22px rgba(84,52,141,.08); transform:skewX(-20deg); }
.sc-ribbon span:nth-child(2) { inset:17px 28px; border-color:rgba(74,198,185,.28); transform:skewX(20deg); }
.sc-ribbon span:nth-child(3) { inset:32px 60px; border-color:rgba(255,255,255,.72); }
.sc-corner-curve { position:absolute; z-index:1; right:38px; top:25px; width:210px; height:68px; border-top:3px solid rgba(111,76,195,.22); border-radius:50%; transform:rotate(-6deg); }
.sc-corner-curve::after { content:""; position:absolute; inset:14px 20px auto 34px; height:45px; border-top:3px solid rgba(79,200,188,.28); border-radius:50%; }
.sc-header { position:relative; z-index:2; max-width:1040px; }
.sc-kicker { color:var(--lilac); font-size:12px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; }
.sc-title { max-width:1040px; margin:10px 0 0; font-family:"Manrope",Arial,sans-serif; font-weight:600; line-height:1.06; letter-spacing:0; }
.sc-subtitle { max-width:900px; margin:13px 0 0; color:var(--muted); font-size:20px; line-height:1.42; }
.sc-card { border:1px solid rgba(95,65,147,.14); border-radius:8px; background:rgba(255,255,255,.82); box-shadow:0 8px 22px rgba(75,59,110,.07); }
.sc-grid { display:grid; grid-template-columns:repeat(var(--cols),minmax(0,1fr)); gap:15px; margin-top:26px; }
.sc-point { min-height:165px; padding:19px; }
.sc-point h3 { margin:12px 0 8px; font-size:19px; line-height:1.25; }
.sc-point p { margin:0; color:var(--muted); font-size:17px; line-height:1.45; }
.sc-grid.sc-count-2 .sc-point { min-height:292px; padding:29px; display:flex; flex-direction:column; justify-content:center; }
.sc-grid.sc-count-3 .sc-point { min-height:244px; padding:25px; }
.sc-grid.sc-count-2 .sc-icon,.sc-grid.sc-count-3 .sc-icon { width:48px; height:48px; }
.sc-grid.sc-count-2 .sc-point h3 { margin-top:20px; font-size:22px; }
.sc-grid.sc-count-3 .sc-point h3 { margin-top:17px; font-size:19px; }
.sc-grid.sc-count-2 .sc-point p { font-size:18px; line-height:1.5; }
.sc-grid.sc-count-3 .sc-point p { font-size:17px; line-height:1.48; }
.sc-types-grid.sc-count-4 { gap:13px; margin-top:20px; }
.sc-types-grid.sc-count-4 .sc-point { min-height:0; padding:17px 18px; overflow:hidden; }
.sc-types-grid.sc-count-4 .sc-icon { width:38px; height:38px; }
.sc-types-grid.sc-count-4 .sc-point h3 { margin:9px 0 5px; font-size:17px; line-height:1.16; }
.sc-types-grid.sc-count-4 .sc-point p { font-size:17px; line-height:1.35; }
.sc-icon { width:42px; height:42px; display:grid; place-items:center; border-radius:8px; color:var(--lilac); background:#eef8f6; border:1px solid rgba(102,74,157,.12); }
.sc-center { height:100%; display:grid; place-items:center; text-align:center; }
.sc-hero { max-width:1000px; font:600 64px/1.05 "Manrope",sans-serif; }
.sc-prose { color:#443e56; font-size:23px; line-height:1.56; }
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
.sc-blob { position:absolute; inset:6% 3% 3% 8%; border-radius:43% 57% 58% 42% / 39% 43% 57% 61%; background:#ded2f2; border:1px solid rgba(111,76,195,.12); transform:rotate(-7deg); }
.sc-molecule { position:absolute; inset:13% 7% 9% 12%; }
.sc-node { position:absolute; display:block; border-radius:50%; background:#8f71d2; border:7px solid rgba(255,255,255,.55); }
.sc-node--teal { background:#3db3a8; }
.sc-node.n1 { width:78px; height:78px; left:62px; top:62px; }.sc-node.n2{width:49px;height:49px;left:235px;top:125px}.sc-node.n3{width:38px;height:38px;left:218px;top:8px}.sc-node.n4{width:60px;height:60px;left:3px;top:171px}
.sc-bond { position:absolute; height:5px; border-radius:9px; transform-origin:0 50%; background:#8cbec0; }.sc-bond.b1{width:165px;left:96px;top:95px;transform:rotate(22deg)}.sc-bond.b2{width:125px;left:108px;top:94px;transform:rotate(-42deg)}.sc-bond.b3{width:120px;left:48px;top:166px;transform:rotate(-22deg)}
.sc-glass { position:absolute; width:92px; height:92px; right:-6px; top:8px; border-radius:50%; background:rgba(255,255,255,.48); border:3px solid rgba(255,255,255,.72); box-shadow:0 12px 24px rgba(77,52,126,.10); }

/* Agenda / relevance */
.sc-agenda { max-width:980px; margin-top:30px; display:grid; gap:0; border-top:1px solid var(--line); }
.sc-agenda-row { min-height:78px; padding:13px 4px; display:grid; grid-template-columns:62px 1fr; align-items:center; gap:18px; border-bottom:1px solid var(--line); font-size:20px; line-height:1.3; font-weight:650; }
.sc-agenda-no,.sc-reason-no { display:grid; place-items:center; color:var(--lilac); font-weight:800; background:#eee8f8; }
.sc-agenda-no { width:48px; height:48px; border-radius:50%; font-size:13px; }
.sc-relevance-grid { display:grid; grid-template-columns:1fr .42fr; gap:20px; margin-top:25px; }
.sc-reasons { display:grid; gap:0; border-top:1px solid var(--line); }
.sc-reason { min-height:82px; padding:15px 6px; display:grid; grid-template-columns:44px 1fr; gap:16px; align-items:center; border-bottom:1px solid var(--line); }
.sc-reason-no { width:38px; height:38px; border-radius:50%; font-size:11px; }
.sc-reason p { margin:0; color:#494356; font-size:18px; line-height:1.42; }
.sc-relevance-visual { min-height:255px; padding:28px; display:grid; place-content:center; text-align:center; position:relative; overflow:hidden; border:1px solid rgba(111,76,195,.16); border-radius:50% 50% 46% 54%; background:#e5dcf4; }
.sc-relevance-visual::before { content:""; position:absolute; width:170px; height:170px; left:50%; top:50%; transform:translate(-50%,-50%); border-radius:50%; border:2px solid rgba(79,200,188,.35); }
.sc-relevance-visual strong,.sc-relevance-visual span,.sc-relevance-visual small,.sc-orbit-mark { position:relative; z-index:1; }
.sc-relevance-visual strong { font:700 44px/1 "Manrope"; }.sc-relevance-visual span{margin-top:9px;font-size:17px;font-weight:700}.sc-relevance-visual small{margin-top:10px;color:#4f5965;font-size:17px;line-height:1.35}.sc-orbit-mark{font-size:54px;color:white}
.sc-relevance-essay { margin-top:26px; min-height:300px; display:grid; grid-template-columns:150px minmax(0,1fr); border-top:1px solid var(--line); border-bottom:1px solid var(--line); }
.sc-relevance-signal { display:grid; place-items:center; writing-mode:vertical-rl; transform:rotate(180deg); background:#6f4cc3; color:#fff; font-size:13px; letter-spacing:.18em; font-weight:800; }
.sc-relevance-essay .sc-prose { align-self:center; padding:28px 36px; font-family:"Playfair Display",serif; font-size:27px; line-height:1.48; }

/* Aim / object / definition */
.sc-aim { margin-top:22px; padding:18px 22px; border-left:6px solid var(--lilac-mid); }
.sc-aim span { color:var(--lilac); font-size:10px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; }.sc-aim p{margin:8px 0 0;font-size:18px;line-height:1.42}
.sc-task-grid { margin-top:14px; display:grid; grid-template-columns:repeat(var(--cols),1fr); gap:12px; }
.sc-task { min-height:104px; padding:16px; }.sc-task strong{color:var(--lilac);font:600 23px/1 "Playfair Display"}.sc-task p{margin:8px 0 0;color:#4b4557;font-size:15px;line-height:1.38}
.sc-object-grid { margin-top:28px; display:grid; grid-template-columns:1fr 1fr; gap:20px; }
.sc-object { min-height:270px; padding:30px; position:relative; overflow:hidden; }.sc-object:first-child{background:#f3eefb}.sc-object:last-child{background:#eaf7f5}
.sc-object span { color:var(--lilac); font-size:11px; font-weight:800; letter-spacing:.13em; text-transform:uppercase; }.sc-object p{max-width:84%;margin:20px 0 0;font-size:19px;line-height:1.5}.sc-object i{position:absolute;right:24px;bottom:17px;width:82px;height:82px;border-radius:50%;background:#d7ece9;transform:rotate(24deg)}
.sc-definition-stage { margin-top:24px; min-height:230px; display:grid; grid-template-columns:360px minmax(0,1fr); gap:34px; align-items:center; border-top:1px solid var(--line); border-bottom:1px solid var(--line); }
.sc-term { align-self:stretch; padding:28px; display:flex; align-items:center; background:#6f4cc3; color:#fff; font:600 48px/1.05 "Playfair Display",serif; overflow-wrap:anywhere; }
.sc-definition-copy{padding:26px 34px 26px 0;font-size:23px;line-height:1.52;color:#464052}
.sc-aspect-lines { margin-top:18px; display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
.sc-aspect-line { display:grid; grid-template-columns:38px 1fr; gap:12px; padding-top:14px; border-top:3px solid #4fc8bc; }
.sc-aspect-line>span { color:var(--lilac); font:600 19px/1 "Playfair Display"; }
.sc-aspect-line h3 { margin:0 0 6px; font-size:18px; }
.sc-aspect-line p { margin:0; color:var(--muted); font-size:17px; line-height:1.38; }

/* Content / process / detail / example */
.sc-editorial-sheet,.sc-statement-sheet { margin-top:26px; min-height:300px; border-top:1px solid var(--line); border-bottom:1px solid var(--line); }
.sc-editorial-sheet { padding:30px 8px; }
.sc-editorial-sheet .sc-prose { column-count:2; column-gap:42px; column-rule:1px solid var(--line); font-size:21px; line-height:1.55; }
.sc-statement-sheet { display:flex; align-items:center; padding:30px 46px; border-left:9px solid var(--teal); background:#f2eef9; }
.sc-statement-sheet .sc-prose { font-family:"Playfair Display",serif; font-size:28px; line-height:1.48; }
.sc-content-lines { margin-top:24px; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:18px 28px; }
.sc-content-line { min-height:132px; display:grid; grid-template-columns:52px minmax(0,1fr); gap:16px; padding:20px 4px; border-top:3px solid var(--lilac-mid); }
.sc-content-line:nth-child(even) { border-top-color:var(--teal); }
.sc-content-line>span { color:var(--lilac); font:600 25px/1 "Playfair Display"; }
.sc-content-line h3 { margin:0 0 7px; font-size:21px; line-height:1.2; }
.sc-content-line p { margin:0; color:var(--muted); font-size:18px; line-height:1.45; }
.sc-content-lines.sc-count-2 { grid-template-columns:repeat(2,minmax(0,1fr)); }
.sc-content-lines.sc-count-2 .sc-content-line { min-height:260px; padding-top:28px; align-items:center; }
.sc-content-lines.sc-count-3 { grid-template-columns:repeat(3,minmax(0,1fr)); gap:24px; }
.sc-content-lines.sc-count-3 .sc-content-line { min-height:245px; grid-template-columns:44px minmax(0,1fr); padding-top:28px; align-items:center; }
.sc-content-lines.sc-count-3 .sc-content-line>span { font-size:32px; }
.sc-content-lines.sc-count-4 { grid-template-columns:repeat(2,minmax(0,1fr)); }
.sc-media-layout{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(360px,.92fr);gap:24px;align-items:stretch;margin-top:24px}.sc-media-points{display:grid;gap:10px}.sc-media-point{padding:15px 18px}.sc-media-point h3{margin:0 0 6px;font-size:18px}.sc-media-point p{margin:0;color:var(--muted);font-size:15px;line-height:1.42}.sc-wm-visual{height:330px;align-self:center}.sc-has-visual .sc-prose{font-size:19px;line-height:1.5;padding:22px}
.sc-process-flow { margin-top:24px; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px 26px; position:relative; }
.sc-process-flow::before { content:""; position:absolute; left:24px; top:18px; bottom:18px; width:2px; background:#cfc0ec; }
.sc-process-note { position:relative; min-height:94px; display:grid; grid-template-columns:58px minmax(0,1fr); gap:16px; align-items:center; padding:12px 14px 12px 0; border-bottom:1px solid var(--line); }
.sc-process-note:nth-child(even) { transform:translateY(22px); }
.sc-step{width:48px;height:48px;display:grid;place-items:center;border-radius:50%;color:white;font-size:12px;font-weight:800;background:var(--lilac-mid);z-index:1}.sc-process-note:nth-child(even) .sc-step{background:var(--teal-dark)}.sc-process-note h3{margin:0 0 6px;font-size:20px}.sc-process-note p{margin:0;color:var(--muted);font-size:17px;line-height:1.4}
.sc-detail { display:grid; grid-template-columns:1.25fr .75fr; gap:28px; }.sc-detail--single{grid-template-columns:1fr}.sc-detail-copy{border-left:8px solid var(--lilac-mid);padding:26px 30px;background:#f2eef9}.sc-detail-points{display:grid;gap:0;align-content:start;border-top:1px solid var(--line)}.sc-detail-chip{padding:16px 4px;font-size:17px;line-height:1.4;font-weight:650;border-bottom:1px solid var(--line)}.sc-detail-chip span{display:block;margin-bottom:6px;color:var(--teal-dark);font-size:12px}
.sc-example { display:grid; grid-template-columns:1fr .72fr; gap:38px; align-items:center; margin-top:25px; }.sc-example .sc-prose{padding:26px 30px;border-left:8px solid var(--teal);background:#eef8f6}.sc-takeaway{margin-top:16px;padding:16px 19px;border-left:4px solid var(--lilac);border-radius:0 8px 8px 0;background:#f0eafb;font-size:18px;line-height:1.4;font-weight:650}.sc-leaf-wrap{min-height:300px;position:relative;display:grid;place-items:center}.sc-leaf{width:280px;height:170px;border-radius:95% 5% 95% 5%;transform:rotate(-28deg);background:#4ab99d;border:10px solid #d7f0e8}.sc-glass--small{right:26px;top:10px;width:70px;height:70px}
.sc-type-board { margin-top:24px; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px 28px; }
.sc-type-line { min-height:136px; display:grid; grid-template-columns:64px minmax(0,1fr); gap:16px; align-items:start; padding:20px 4px; border-top:3px solid var(--lilac-mid); }
.sc-type-line:nth-child(2n) { border-top-color:var(--teal); }
.sc-type-index { color:var(--lilac); font:600 28px/1 "Playfair Display"; }
.sc-type-line h3 { margin:0 0 8px; font-size:21px; line-height:1.2; }
.sc-type-line p { margin:0; color:var(--muted); font-size:18px; line-height:1.43; }

/* Compare / stats / timeline */
.sc-compare { display:grid; grid-template-columns:1fr 62px 1fr; gap:16px; margin-top:26px; align-items:stretch; }.sc-compare-card{min-height:350px;padding:30px}.sc-compare-card.left{background:#f3eefb}.sc-compare-card.right{background:#eaf7f5}.sc-compare-card>span{color:var(--lilac);font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.sc-compare-card h3{margin:13px 0 20px;font-size:24px}.sc-compare-card ul{list-style:none;padding:0;margin:0;display:grid;gap:16px}.sc-compare-card li{position:relative;padding-left:23px;color:#4d475f;font-size:18px;line-height:1.43}.sc-compare-card li::before{content:"";position:absolute;left:0;top:7px;width:10px;height:10px;border-radius:50%;background:var(--teal-dark)}.sc-vs{align-self:center;width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:white;border:1px solid var(--line);font-size:11px;font-weight:800;color:var(--lilac)}
.sc-stats { display:grid; grid-template-columns:repeat(var(--cols),1fr); gap:14px; margin-top:28px; }.sc-stat{min-height:180px;padding:22px}.sc-stat:nth-child(odd){border-top:5px solid var(--lilac-mid)}.sc-stat:nth-child(even){border-top:5px solid var(--teal)}.sc-stat>div{display:flex;align-items:flex-end;gap:7px}.sc-stat strong{font:700 46px/1 "Manrope";letter-spacing:0}.sc-stat>div span{padding-bottom:5px;color:var(--lilac);font-size:14px;font-weight:800}.sc-stat h3{margin:14px 0 8px;font-size:18px}.sc-stat p{margin:0;color:var(--muted);font-size:17px;line-height:1.4}.sc-stats.sc-count-2 .sc-stat{min-height:252px;padding:28px}.sc-stats.sc-count-3 .sc-stat{min-height:226px;padding:25px}.sc-stats.sc-count-2 .sc-stat strong,.sc-stats.sc-count-3 .sc-stat strong{font-size:54px}.sc-stats.sc-count-2 .sc-stat h3{font-size:20px;margin-top:20px}.sc-stats.sc-count-3 .sc-stat h3{font-size:18px;margin-top:18px}.sc-stats.sc-count-2 .sc-stat p{font-size:18px;line-height:1.46}.sc-stats.sc-count-3 .sc-stat p{font-size:17px;line-height:1.43}.sc-insight{margin-top:15px;padding:14px 18px;border-radius:8px;background:#f0eafb;font-size:18px;line-height:1.38;font-weight:600}
.sc-timeline { display:grid; grid-template-columns:repeat(var(--cols),1fr); gap:20px; margin-top:32px; position:relative; }.sc-timeline::before{content:"";position:absolute;z-index:2;top:28px;left:4%;right:4%;height:3px;border-radius:9px;background:#c7b5e8}.sc-timeline-item{position:relative;min-height:270px;padding:72px 8px 22px;border-bottom:1px solid var(--line)}.sc-timeline-item i{position:absolute;z-index:3;top:17px;left:8px;width:23px;height:23px;border-radius:50%;background:white;border:6px solid var(--lilac-mid);box-shadow:0 0 0 5px rgba(161,122,232,.12)}.sc-timeline-item:nth-child(even) i{border-color:var(--teal)}.sc-timeline-item strong{color:var(--lilac);font:600 27px/1 "Playfair Display"}.sc-timeline-item h3{margin:12px 0 9px;font-size:19px}.sc-timeline-item p{margin:0;color:var(--muted);font-size:17px;line-height:1.43}.sc-timeline.sc-count-2 .sc-timeline-item{min-height:302px;padding:78px 24px 25px}.sc-timeline.sc-count-3 .sc-timeline-item{min-height:285px;padding:75px 18px 23px}.sc-timeline.sc-count-2 .sc-timeline-item strong{font-size:32px}.sc-timeline.sc-count-2 .sc-timeline-item h3{font-size:22px}.sc-timeline.sc-count-2 .sc-timeline-item p{font-size:18px;line-height:1.5}.sc-timeline.sc-count-3 .sc-timeline-item p{font-size:17px}

/* Finding / problems */
.sc-finding { display:grid; grid-template-columns:1.08fr .92fr; gap:34px; margin-top:24px; }
.sc-evidence { min-height:330px; padding:28px 32px; color:#3f394d; font:600 21px/1.52 "Playfair Display",serif; border-left:9px solid var(--teal); background:#edf8f6; }
.sc-evidence-label { margin-bottom:17px; color:var(--teal-dark); font:800 12px/1 "Manrope",sans-serif; letter-spacing:.12em; }
.sc-finding-chips { display:grid; gap:0; margin-top:20px; }
.sc-finding-chips span { padding:12px 0; border-bottom:1px solid #c7e3de; color:#276f69; font:700 17px/1.35 "Manrope",sans-serif; }
.sc-finding-side { display:grid; gap:0; align-content:start; border-top:3px solid var(--lilac-mid); }
.sc-finding-box { padding:18px 4px; border-bottom:1px solid var(--line); }
.sc-finding-box h3 { margin:0 0 8px; color:var(--lilac); font-size:12px; letter-spacing:.12em; text-transform:uppercase; }
.sc-finding-box p { margin:0; font-size:17px; line-height:1.45; color:#4c4659; }
.sc-pairs { margin-top:24px; display:grid; gap:12px; }
.sc-pair { display:grid; grid-template-columns:1fr 66px 1fr; gap:12px; align-items:stretch; }
.sc-problem,.sc-solution { min-height:112px; padding:20px 23px; display:flex; align-items:center; border-radius:8px; font-size:17px; line-height:1.45; }
.sc-pairs.sc-count-2 .sc-problem,.sc-pairs.sc-count-2 .sc-solution { min-height:158px; padding:27px; font-size:18px; line-height:1.5; }
.sc-problem { background:#fbefee; border-left:5px solid #d47d78; }
.sc-solution { background:#e9f6f3; border-left:5px solid var(--teal-dark); }
.sc-arrow { display:grid; place-items:center; color:var(--lilac); font-size:24px; }

/* Conclusion / references / closing */
.sc-conclusion-prose { margin-top:28px; min-height:310px; display:grid; grid-template-columns:90px minmax(0,1fr); gap:26px; align-items:start; padding:34px 38px; border-top:4px solid var(--lilac-mid); background:#f3eefb; }
.sc-conclusion-prose>span { color:var(--teal-dark); font:600 72px/1 "Playfair Display",serif; }
.sc-conclusion-prose .sc-prose { font-family:"Playfair Display",serif; font-size:26px; line-height:1.52; }
.sc-conclusion-grid { margin-top:25px; display:grid; grid-template-columns:1fr 1fr; gap:10px 28px; }
.sc-conclusion-point { min-height:112px; padding:18px 4px; display:flex; gap:16px; align-items:flex-start; border-top:3px solid var(--lilac-mid); }
.sc-conclusion-point:nth-child(even) { border-top-color:var(--teal); }
.sc-conclusion-point strong { min-width:42px; height:42px; display:grid; place-items:center; border-radius:50%; color:white; background:var(--lilac-mid); font-size:12px; }
.sc-conclusion-point:nth-child(even) strong { background:var(--teal-dark); }
.sc-conclusion-point p { margin:2px 0 0; color:#484254; font-size:18px; line-height:1.44; }
.sc-closing-band { margin-top:15px; padding:15px 20px; border-radius:8px; background:#6f4cc3; color:white; font-size:18px; line-height:1.4; font-weight:650; }
.sc-references { margin-top:24px; display:grid; gap:0; border-top:3px solid var(--lilac-mid); }
.sc-references--two { grid-template-columns:1fr 1fr; column-gap:28px; }
.sc-reference { min-height:70px; padding:15px 4px; display:grid; grid-template-columns:74px 1fr; gap:16px; align-items:start; border-bottom:1px solid var(--line); }
.sc-reference span { padding:6px 7px; border-radius:6px; background:var(--lilac-soft); color:var(--lilac); font-size:10px; font-weight:800; text-transform:uppercase; text-align:center; }
.sc-reference p { margin:0; font-size:17px; line-height:1.4; color:#4c465b; }
.sc-closing-slide .sc-inner{display:grid;place-items:center;text-align:center}.sc-closing-content h1{max-width:980px;margin:0;font:600 82px/1.03 "Manrope",sans-serif}.sc-closing-ring{position:absolute;z-index:1;width:260px;height:115px;border:27px solid rgba(150,106,230,.28);border-radius:50%;right:-35px;bottom:18px;transform:rotate(-23deg);box-shadow:inset 0 0 18px rgba(255,255,255,.8),0 20px 32px rgba(83,53,137,.12)}.sc-glass--closing{z-index:1;left:70px;top:65px;width:96px;height:96px}

strong { font-weight:700; }
`;
