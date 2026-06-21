import { InlineKeyboard } from 'grammy';
import { Outline } from '../ai/schemas/outline.schema';
import { SLIDE_EMOJI } from '../ai/layout.catalog';

function trunc(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '\u2026' : s;
}

function sorted(outline: Outline) {
  return [...outline.slides].sort((a, b) => a.position - b.position);
}

export function formatOutline(outline: Outline): string {
  const lines = sorted(outline).map(
    (s) => `${s.position}. ${SLIDE_EMOJI[s.type] ?? ''} ${s.title}`,
  );
  return `\u{1F4CB} Taqdimot rejasi:\n\n${lines.join('\n')}\n\nReja ma'qulmi?`;
}

export function outlineConfirmKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('\u2705 Tasdiqlash', 'outline:confirm')
    .row()
    .text('\u270F\uFE0F Tahrirlash', 'oe:open')
    .text('\u{1F504} Boshqacha reja', 'outline:regenerate');
}

/* ---------- edit mode ---------- */

export function formatOutlineEdit(outline: Outline, note?: string): string {
  const lines = sorted(outline).map(
    (s) => `${s.position}. ${SLIDE_EMOJI[s.type] ?? ''} ${s.title}`,
  );
  const tail = note ? `\n\n${note}` : '';
  return `\u270F\uFE0F Tahrirlash rejimi\n\n${lines.join('\n')}\n\nO\u2018zgartirish uchun slaydni tanlang yoki amalni bajaring:${tail}`;
}

export function outlineEditKeyboard(outline: Outline): InlineKeyboard {
  const kb = new InlineKeyboard();
  sorted(outline).forEach((s, i) => {
    kb.text(`${s.position}. ${trunc(s.title, 28)}`, `oe:slide:${i}`).row();
  });
  kb.text('\u2795 Slayd qo\u2018shish', 'oe:add').row();
  kb.text('\u2705 Tayyor', 'oe:done');
  return kb;
}

export function slideActionKeyboard(i: number, total: number): InlineKeyboard {
  const kb = new InlineKeyboard()
    .text('\u270F\uFE0F Sarlavha', `oe:title:${i}`)
    .text('\u{1F5D1}\uFE0F O\u2018chirish', `oe:del:${i}`)
    .row();
  if (i > 0) kb.text('\u2B06\uFE0F Yuqoriga', `oe:up:${i}`);
  if (i < total - 1) kb.text('\u2B07\uFE0F Pastga', `oe:down:${i}`);
  kb.row().text('\u2B05\uFE0F Orqaga', 'oe:list');
  return kb;
}

const ADD_TYPES = [
  'STATS', 'INSIGHT', 'PROBLEM', 'COMPARISON', 'PROCESS',
  'TIMELINE', 'SOLUTION', 'CASE_STUDY', 'QUOTE', 'ROADMAP', 'OPPORTUNITY', 'CTA',
];

export function slideTypeKeyboard(): InlineKeyboard {
  const kb = new InlineKeyboard();
  ADD_TYPES.forEach((t, i) => {
    kb.text(`${SLIDE_EMOJI[t] ?? ''} ${t}`, `oe:type:${t}`);
    if ((i + 1) % 3 === 0) kb.row();
  });
  kb.row().text('\u2B05\uFE0F Bekor', 'oe:list');
  return kb;
}
