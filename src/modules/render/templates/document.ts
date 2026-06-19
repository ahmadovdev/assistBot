import { ThemeConfig, themeCssVars, googleFontsUrl } from './theme';
import { renderSlideInner } from './layouts';

export interface RenderSlide {
  layout: string;
  content: unknown;
}

const CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
.slide { width: 1280px; height: 720px; background: var(--bg); color: var(--text);
  font-family: var(--font-body); padding: 64px 72px; position: relative; overflow: hidden;
  page-break-after: always; display: flex; flex-direction: column; }
.slide:last-child { page-break-after: auto; }
.eyebrow { color: var(--accent); font-weight: 700; letter-spacing: 4px; font-size: 13px;
  text-transform: uppercase; margin-bottom: 16px; }
.title { font-family: var(--font-heading); color: var(--accent); font-size: 46px; font-weight: 700; line-height: 1.12; }
.cover-title { font-size: 58px; }
.subtitle { color: var(--muted); font-size: 18px; margin-top: 14px; line-height: 1.4; }
.body { color: var(--text); font-size: 19px; line-height: 1.55; }

.cover { display: flex; gap: 48px; flex: 1; align-items: stretch; }
.cover-left { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.cover-right { width: 42%; }
.pills { display: flex; gap: 12px; margin-top: 30px; flex-wrap: wrap; }
.pill { border: 1px solid var(--accent); color: var(--text); border-radius: 999px;
  padding: 7px 18px; font-size: 13px; letter-spacing: 1px; }

.img { height: 100%; border-radius: 20px; overflow: hidden; }
.img img { width: 100%; height: 100%; object-fit: cover; }
.viz { width: 100%; height: 100%; border-radius: 22px; overflow: hidden; position: relative; }
.viz-aurora { background:
  radial-gradient(circle at 28% 22%, color-mix(in srgb, var(--accent) 55%, transparent), transparent 55%),
  radial-gradient(circle at 80% 82%, color-mix(in srgb, var(--accent2) 50%, transparent), transparent 60%),
  var(--surface); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08); }
.viz-glass { background: rgba(255,255,255,0.45); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.6); }
.viz-flat { background: transparent; }
.viz-bento { background: var(--accent); }

.lead-row { display: flex; gap: 48px; flex: 1; margin-top: 28px; align-items: stretch; }
.lead-body { flex: 1; display: flex; align-items: flex-start; }
.lead-img { width: 40%; }

.card { background: var(--surface); border-radius: 16px; padding: 28px; box-shadow: 0 8px 24px rgba(0,0,0,.18); }

.bullets { display: flex; flex-direction: column; gap: 22px; margin-top: 34px; }
.bullet { display: flex; align-items: center; gap: 20px; }
.bullet-num { width: 46px; height: 46px; border-radius: 50%; background: var(--accent); color: #fff;
  font-weight: 700; font-size: 18px; display: flex; align-items: center; justify-content: center; flex: none; }
.bullet-text { font-size: 20px; color: var(--text); font-weight: 600; }

.stats { display: flex; gap: 24px; flex: 1; margin-top: 32px; }
.stats-num .stat { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.stat-value { font-family: var(--font-heading); color: var(--accent); font-size: 54px; font-weight: 700; }
.stat-label { font-size: 18px; font-weight: 700; margin-top: 12px; color: var(--text); }
.stat-desc { font-size: 13px; color: var(--muted); margin-top: 8px; }
.stats-donut { align-items: flex-start; justify-content: space-between; }
.stat-donut { flex: 1; display: flex; flex-direction: column; align-items: center; text-align: center; }

.imgtext { display: flex; gap: 48px; flex: 1; margin-top: 28px; align-items: stretch; }
.imgtext-media { width: 44%; }
.imgtext-body { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 22px; }
.points { list-style: none; display: flex; flex-direction: column; gap: 14px; }
.points li { position: relative; padding-left: 26px; font-size: 17px; font-weight: 600; }
.points li::before { content: ''; position: absolute; left: 0; top: 8px; width: 12px; height: 12px;
  border-radius: 50%; background: var(--accent); }

.cols { display: flex; gap: 28px; flex: 1; margin-top: 30px; }
.col { flex: 1; display: flex; flex-direction: column; }
.col-icon { width: 64px; height: 64px; border-radius: 50%;
  background: color-mix(in srgb, var(--accent) 20%, transparent);
  display: flex; align-items: center; justify-content: center; font-size: 30px; }
.col-head { font-family: var(--font-heading); font-size: 22px; font-weight: 700; margin-top: 20px; color: var(--text); }
.col-text { color: var(--muted); font-size: 15px; line-height: 1.5; margin-top: 12px; }

.split { display: flex; gap: 40px; flex: 1; margin-top: 28px; }
.split-left { width: 48%; display: flex; flex-direction: column; gap: 22px; }
.summ-head { font-family: var(--font-heading); color: var(--accent); font-size: 20px; font-weight: 700; }
.summ-text { color: var(--muted); font-size: 15px; line-height: 1.45; margin-top: 10px; }
.split-right { flex: 1; display: flex; flex-direction: column; }
.steps-title { font-size: 18px; font-weight: 700; margin-bottom: 8px; color: var(--text); }
.step { display: flex; gap: 18px; align-items: flex-start; padding: 16px 0; }
.step-num { font-family: var(--font-heading); color: var(--accent); font-size: 28px; font-weight: 700; flex: none; width: 48px; }
.step-text { font-size: 16px; line-height: 1.4; padding-top: 6px; color: var(--text); }

/* ---- per-style overrides ---- */
[data-style="aurora"] .slide { background:
  radial-gradient(circle at 86% 10%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 42%), var(--bg); }

[data-style="editorial"] .title { color: var(--text); text-transform: uppercase; font-weight: 800; letter-spacing: -1px; }
[data-style="editorial"] .cover-title { font-size: 64px; }
[data-style="editorial"] .pill { border-color: var(--text); }

[data-style="bento"] .title { color: var(--text); }
[data-style="bento"] .card { border-radius: 22px; box-shadow: none; }
[data-style="bento"] .viz-bento { box-shadow: none; }

[data-style="softglass"] .slide { background: linear-gradient(135deg, #ece9ff 0%, #ffe6f1 50%, #e3f6ff 100%); }
[data-style="softglass"] .title { color: var(--text); }
[data-style="softglass"] .card { background: rgba(255,255,255,0.55); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.7); }
[data-style="softglass"] .bullet-text, [data-style="softglass"] .body { color: var(--text); }

[data-style="earthy"] .title { color: var(--text); }
[data-style="earthy"] .card { box-shadow: 0 6px 18px rgba(60,40,20,.10); }
`;

export function buildDocument(theme: ThemeConfig, slides: RenderSlide[]): string {
  const body = slides
    .map((s) => `<section class="slide">${renderSlideInner(s.layout, s.content, theme)}</section>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="uz"><head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${googleFontsUrl(theme)}" rel="stylesheet">
<style>:root{${themeCssVars(theme)}}</style>
<style>${CSS}</style>
</head>
<body data-style="${theme.style}">${body}</body></html>`;
}
