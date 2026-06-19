import { ThemeConfig } from './theme';

/* ---- Generative visuals: fill the "image" area without photos. ---- */

function rings(cx: number, cy: number, color: string, radii: number[], op = 0.4): string {
  return radii
    .map((r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-opacity="${op}" stroke-width="1.4"/>`)
    .join('');
}

function dots(cx: number, cy: number, color: string, specs: [number, number][]): string {
  return specs
    .map(([ang, r]) => {
      const x = cx + r * Math.cos((ang * Math.PI) / 180);
      const y = cy + r * Math.sin((ang * Math.PI) / 180);
      return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="7" fill="${color}"/>`;
    })
    .join('');
}

function auroraPanel(t: ThemeConfig): string {
  const svg = `<svg viewBox="0 0 440 480" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
    ${rings(250, 200, t.accent, [60, 115, 175, 240, 310])}
    ${dots(250, 200, t.accent, [[20, 115], [140, 175], [255, 240], [70, 240]])}
  </svg>`;
  return `<div class="viz viz-aurora">${svg}</div>`;
}

function glassPanel(t: ThemeConfig): string {
  const svg = `<svg viewBox="0 0 440 480" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
    ${rings(220, 240, t.accent, [70, 130, 195, 260], 0.5)}
    ${dots(220, 240, t.accent2, [[35, 130], [200, 195], [300, 260]])}
  </svg>`;
  return `<div class="viz viz-glass">${svg}</div>`;
}

function earthyPanel(t: ThemeConfig): string {
  const svg = `<svg viewBox="0 0 440 480" preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
    <circle cx="220" cy="240" r="170" fill="${t.surface2}"/>
    ${rings(220, 240, t.accent, [60, 105, 150], 0.35)}
    <path d="M 220 70 A 170 170 0 0 1 390 240" fill="none" stroke="${t.accent}" stroke-width="9" stroke-linecap="round"/>
    <path d="M 390 240 A 170 170 0 0 1 220 410" fill="none" stroke="${t.accent2}" stroke-width="9" stroke-linecap="round"/>
    <circle cx="220" cy="240" r="40" fill="${t.accent}"/>
  </svg>`;
  return `<div class="viz viz-flat">${svg}</div>`;
}

function editorialMark(t: ThemeConfig): string {
  const svg = `<svg viewBox="0 0 440 480" preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
    <path d="M 80 400 A 320 320 0 0 1 400 80" fill="none" stroke="${t.accent}" stroke-width="14" stroke-linecap="round"/>
    <path d="M 150 400 A 250 250 0 0 1 400 150" fill="none" stroke="${t.text}" stroke-opacity="0.25" stroke-width="6"/>
    <circle cx="400" cy="80" r="18" fill="${t.accent}"/>
  </svg>`;
  return `<div class="viz viz-flat">${svg}</div>`;
}

function bentoMark(t: ThemeConfig): string {
  const svg = `<svg viewBox="0 0 440 480" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
    ${rings(220, 240, '#04201a', [70, 130, 200], 0.45)}
    ${dots(220, 240, '#04201a', [[30, 130], [180, 200], [290, 200]])}
    <circle cx="220" cy="240" r="34" fill="#04201a" fill-opacity="0.25"/>
  </svg>`;
  return `<div class="viz viz-bento">${svg}</div>`;
}

export function imagePanel(theme: ThemeConfig): string {
  switch (theme.style) {
    case 'aurora': return auroraPanel(theme);
    case 'softglass': return glassPanel(theme);
    case 'earthy': return earthyPanel(theme);
    case 'editorial': return editorialMark(theme);
    case 'bento': return bentoMark(theme);
    default: return auroraPanel(theme);
  }
}

/* ---- Themed stats: donut rings, bento cards, or big-number row ---- */

function donut(value: string, label: string, desc: string | undefined, pct: number, t: ThemeConfig): string {
  const r = 58, c = 2 * Math.PI * r, dash = c * pct, gap = c - dash;
  return `<div class="stat-donut">
    <svg viewBox="0 0 160 160" width="160" height="160">
      <circle cx="80" cy="80" r="${r}" fill="none" stroke="${t.muted}" stroke-opacity="0.18" stroke-width="12"/>
      <circle cx="80" cy="80" r="${r}" fill="none" stroke="${t.accent}" stroke-width="12" stroke-linecap="round"
        stroke-dasharray="${dash.toFixed(1)} ${gap.toFixed(1)}" transform="rotate(-90 80 80)"/>
      <text x="80" y="91" text-anchor="middle" fill="${t.text}" font-family="'${t.fontHeading}',serif" font-size="26" font-weight="700">${value}</text>
    </svg>
    <div class="stat-label">${label}</div>
    ${desc ? `<div class="stat-desc">${desc}</div>` : ''}
  </div>`;
}

const PCTS = [0.82, 0.6, 0.7, 0.45];

export function statsViz(
  theme: ThemeConfig,
  stats: { value: string; label: string; desc?: string }[],
  esc: (s: unknown) => string,
): string {
  if (theme.style === 'aurora' || theme.style === 'softglass' || theme.style === 'earthy') {
    return `<div class="stats stats-donut">${stats
      .map((s, i) => donut(esc(s.value), esc(s.label), s.desc ? esc(s.desc) : undefined, PCTS[i % PCTS.length], theme))
      .join('')}</div>`;
  }
  // bento + editorial: bold number cards / row
  return `<div class="stats stats-num">${stats
    .map(
      (s) =>
        `<div class="card stat"><div class="stat-value">${esc(s.value)}</div><div class="stat-label">${esc(s.label)}</div>${s.desc ? `<div class="stat-desc">${esc(s.desc)}</div>` : ''}</div>`,
    )
    .join('')}</div>`;
}
