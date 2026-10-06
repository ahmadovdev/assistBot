import { InlineKeyboard } from 'grammy';
import { Theme } from '@prisma/client';

export const QUESTIONS = {
  topic: '\u{1F4DD} Taqdimot mavzusini yozing yoki tayyor namunadan tanlang:',
  titulChoice:
    "\u{1F3EB} Taqdimotning 1-betiga universitet nomi, fakultet va ismingizni qo‘shaymizmi?",
  titulUniversity: '\u{1F3DB}️ Universitet nomini yozing:',
  titulFaculty: '\u{1F4DA} Fakultet nomini yozing:',
  titulStudent: '\u{1F464} Ism va familiyangizni yozing:',
  slideCount: '\u{1F4CA} Nechta slayd kerak?',
  language: '\u{1F310} Qaysi tilda?',
  theme: '\u{1F5BC} Dizayn temasini tanlang:',
  contentMode:
    "\u{1F4DD} Kontent uslubini tanlang:\n\n" +
    "⚠️ Eslatma: statistika, tasnif, taqqoslash va vaqt jadvali kabi " +
    "raqam/ro'yxat asosidagi slaydlar tanlovdan qat'i nazar o'z ko'rinishida qoladi.",
} as const;

export const LANG_LABELS: Record<string, string> = {
  uz: "O'zbek",
  ru: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439',
  en: 'English',
  kaa: "Qoraqalpoqcha",
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

export function titulChoiceKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("✅ Ha, qo‘shaman", 'titul:yes')
    .row()
    .text("❌ Yo‘q, faqat mavzu", 'titul:no');
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
    .text(LANG_LABELS.kaa, 'lang:kaa')
    .row()
    .text(BACK, 'back:slides');
}

export function themeKeyboard(themes: Theme[]): InlineKeyboard {
  const kb = new InlineKeyboard();
  themes.forEach((t) => {
    kb.text(t.name, `theme:${t.key}`).row();
  });
  kb.text(BACK, 'back:lang');
  return kb;
}

/**
 * Carousel controls for browsing theme previews one at a time.
 * The preview photo above these buttons is swapped in place as the user
 * taps prev/next (wrapping around), so selection is coupled to what's shown.
 * `index` is the position of the currently displayed theme within `themes`.
 */
export function themeCarouselKeyboard(themes: Theme[], index: number): InlineKeyboard {
  const total = themes.length;
  const current = themes[index];
  const prev = (index - 1 + total) % total;
  const next = (index + 1) % total;

  const kb = new InlineKeyboard();
  if (total > 1) {
    kb.text('◀️ Oldingi', `tnav:${prev}`)
      .text('Keyingi ▶️', `tnav:${next}`)
      .row();
  }
  kb.text('✅ Shu dizaynni tanlash', `theme:${current.key}`).row();
  kb.text('⬅️ Tilni oʻzgartirish', 'theme_back');
  return kb;
}

export function outlineKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('\u2705 Tasdiqlash', 'outline:confirm')
    .text('\u{1F504} Boshqacha reja', 'outline:regenerate');
}

export function contentModeKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('\u{1F4CB} Qisqa kartalar (standart)', 'contentMode:cards')
    .row()
    .text('\u{1F4DD} Uzluksiz matn (yangi)', 'contentMode:prose');
}
