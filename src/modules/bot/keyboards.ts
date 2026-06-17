import { InlineKeyboard } from 'grammy';
import { Theme } from '@prisma/client';

export const QUESTIONS = {
  slideCount: '\u{1F4CA} Nechta slayd kerak?',
  language: '\u{1F310} Qaysi tilda?',
  tone: '\u{1F3A8} Qaysi uslubda?',
  theme: '\u{1F5BC} Dizayn temasini tanlang:',
} as const;

export const LANG_LABELS: Record<string, string> = {
  uz: "O'zbek",
  ru: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439',
  en: 'English',
};

export const TONE_LABELS: Record<string, string> = {
  professional: 'Professional',
  casual: 'Erkin',
  academic: 'Akademik',
};

export function slideCountKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('5', 'slides:5')
    .text('8', 'slides:8')
    .text('10', 'slides:10')
    .text('15', 'slides:15');
}

export function languageKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text(LANG_LABELS.uz, 'lang:uz')
    .text(LANG_LABELS.ru, 'lang:ru')
    .text(LANG_LABELS.en, 'lang:en');
}

export function toneKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text(TONE_LABELS.professional, 'tone:professional')
    .row()
    .text(TONE_LABELS.casual, 'tone:casual')
    .row()
    .text(TONE_LABELS.academic, 'tone:academic');
}

export function themeKeyboard(themes: Theme[]): InlineKeyboard {
  const kb = new InlineKeyboard();
  themes.forEach((t, i) => {
    kb.text(t.name, `theme:${t.key}`);
    if ((i + 1) % 2 === 0) kb.row();
  });
  return kb;
}

export function outlineKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('\u2705 Tasdiqlash', 'outline:confirm')
    .text('\u{1F504} Boshqacha reja', 'outline:regenerate');
}
