import { InlineKeyboard } from 'grammy';
import { Theme } from '@prisma/client';

export const QUESTIONS = {
  topic: '\u{1F4DD} Taqdimot mavzusini yozing yoki tayyor namunadan tanlang:',
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

const BACK = '\u2B05\uFE0F Orqaga';

/** Example topics shown on /start so new users know what to type. */
export const EXAMPLE_TOPICS = [
  'Fintech startap uchun investorlarga pitch',
  'Sun\u02BCiy intellekt 2026: holat va kelajak',
  "O'zbekistonda startap ekotizimi",
  'Sog\u02BClom ovqatlanish asoslari',
];

export function examplesKeyboard(): InlineKeyboard {
  const kb = new InlineKeyboard();
  EXAMPLE_TOPICS.forEach((t, i) => {
    kb.text(`\u{1F4A1} ${t.length > 30 ? t.slice(0, 29) + '\u2026' : t}`, `ex:${i}`).row();
  });
  return kb;
}

export function slideCountKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('5', 'slides:5')
    .text('8', 'slides:8')
    .text('10', 'slides:10')
    .text('15', 'slides:15')
    .row()
    .text(BACK, 'back:topic');
}

export function languageKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text(LANG_LABELS.uz, 'lang:uz')
    .row()
    .text(LANG_LABELS.ru, 'lang:ru')
    .row()
    .text(LANG_LABELS.en, 'lang:en')
    .row()
    .text(BACK, 'back:slides');
}

export function toneKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text(TONE_LABELS.professional, 'tone:professional')
    .row()
    .text(TONE_LABELS.casual, 'tone:casual')
    .row()
    .text(TONE_LABELS.academic, 'tone:academic')
    .row()
    .text(BACK, 'back:lang');
}

export function themeKeyboard(themes: Theme[]): InlineKeyboard {
  const kb = new InlineKeyboard();
  themes.forEach((t) => {
    kb.text(t.name, `theme:${t.key}`).row();
  });
  kb.text(BACK, 'back:tone');
  return kb;
}

export function outlineKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('\u2705 Tasdiqlash', 'outline:confirm')
    .text('\u{1F504} Boshqacha reja', 'outline:regenerate');
}
