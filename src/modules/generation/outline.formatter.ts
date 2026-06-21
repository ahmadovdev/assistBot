import { InlineKeyboard } from 'grammy';
import { Outline } from '../ai/schemas/outline.schema';
import { SLIDE_EMOJI } from '../ai/layout.catalog';

export function formatOutline(outline: Outline): string {
  const lines = [...outline.slides]
    .sort((a, b) => a.position - b.position)
    .map((s) => `${s.position}. ${SLIDE_EMOJI[s.type] ?? ''} ${s.title}`);
  return `\u{1F4CB} Taqdimot rejasi:\n\n${lines.join('\n')}\n\nReja ma'qulmi?`;
}

export function outlineConfirmKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('\u2705 Tasdiqlash', 'outline:confirm')
    .text('\u{1F504} Boshqacha reja', 'outline:regenerate');
}
