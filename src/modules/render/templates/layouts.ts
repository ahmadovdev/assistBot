import { esc } from './escape';
import { ThemeConfig } from './theme';
import { imagePanel, statsViz } from './visuals';

type Dict = Record<string, any>;

function panel(theme: ThemeConfig, image: Dict | undefined | null): string {
  if (image && image.url) {
    return `<div class="img"><img src="${esc(image.url)}" alt=""/></div>`;
  }
  return imagePanel(theme);
}

function cover(c: Dict, t: ThemeConfig): string {
  const tags = Array.isArray(c.tags) ? c.tags : [];
  const pills = tags.map((x: string) => `<span class="pill">${esc(x)}</span>`).join('');
  return `<div class="cover">
    <div class="cover-left">
      <div class="eyebrow">${tags[0] ? esc(tags[0]) : 'PREZENTATSIYA'}</div>
      <h1 class="title cover-title">${esc(c.title)}</h1>
      <p class="subtitle">${esc(c.subtitle)}</p>
      ${pills ? `<div class="pills">${pills}</div>` : ''}
    </div>
    <div class="cover-right">${panel(t, c.image)}</div>
  </div>`;
}

function leadParagraph(c: Dict, t: ThemeConfig): string {
  return `<h1 class="title">${esc(c.title)}</h1>
    <div class="lead-row">
      <div class="lead-body"><p class="body">${esc(c.body)}</p></div>
      <div class="lead-img">${panel(t, c.image)}</div>
    </div>`;
}

function bulletList(c: Dict, _t: ThemeConfig): string {
  const bullets = (c.bullets ?? [])
    .map(
      (b: Dict, i: number) =>
        `<div class="bullet"><div class="bullet-num">${i + 1}</div><div class="bullet-text">${esc(b.text)}</div></div>`,
    )
    .join('');
  return `<h1 class="title">${esc(c.title)}</h1>
    ${c.body ? `<p class="subtitle">${esc(c.body)}</p>` : ''}
    <div class="bullets">${bullets}</div>`;
}

function statsGrid(c: Dict, t: ThemeConfig): string {
  return `<h1 class="title">${esc(c.title)}</h1>
    ${c.body ? `<p class="subtitle">${esc(c.body)}</p>` : ''}
    ${statsViz(t, c.stats ?? [], esc)}`;
}

function imageText(c: Dict, t: ThemeConfig): string {
  const points = Array.isArray(c.points) ? c.points : [];
  const media = `<div class="imgtext-media">${panel(t, c.image)}</div>`;
  const body = `<div class="imgtext-body">
      <p class="body">${esc(c.body)}</p>
      ${points.length ? `<ul class="points">${points.map((p: string) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
    </div>`;
  const left = c.image_side === 'left';
  return `<h1 class="title">${esc(c.title)}</h1>
    <div class="imgtext">${left ? media + body : body + media}</div>`;
}

function threeColumns(c: Dict, _t: ThemeConfig): string {
  const cols = (c.columns ?? [])
    .map(
      (col: Dict) =>
        `<div class="card col"><div class="col-icon">${esc(col.icon ?? '\u2022')}</div><div class="col-head">${esc(col.heading)}</div><div class="col-text">${esc(col.text)}</div></div>`,
    )
    .join('');
  return `<h1 class="title">${esc(c.title)}</h1>
    ${c.body ? `<p class="subtitle">${esc(c.body)}</p>` : ''}
    <div class="cols">${cols}</div>`;
}

function splitConclusion(c: Dict, _t: ThemeConfig): string {
  const summary = (c.summary ?? [])
    .map(
      (s: Dict) =>
        `<div class="card summ"><div class="summ-head">${esc(s.heading)}</div><div class="summ-text">${esc(s.text)}</div></div>`,
    )
    .join('');
  const steps = (c.next_steps ?? [])
    .map(
      (s: Dict) =>
        `<div class="step"><div class="step-num">${esc(s.number)}</div><div class="step-text">${esc(s.text)}</div></div>`,
    )
    .join('');
  return `<h1 class="title">${esc(c.title)}</h1>
    <div class="split">
      <div class="split-left">${summary}</div>
      <div class="split-right"><div class="steps-title">Keyingi qadamlar</div>${steps}</div>
    </div>`;
}

const RENDERERS: Record<string, (c: Dict, t: ThemeConfig) => string> = {
  cover, lead_paragraph: leadParagraph, bullet_list: bulletList,
  stats_grid: statsGrid, image_text: imageText, three_columns: threeColumns,
  split_conclusion: splitConclusion,
};

export function renderSlideInner(layout: string, content: unknown, theme: ThemeConfig): string {
  const fn = RENDERERS[layout] ?? leadParagraph;
  return fn((content ?? {}) as Dict, theme);
}
