import { existsSync } from 'fs';
import { join } from 'path';
import { InputFile } from 'grammy';
import type { InputMediaPhoto } from 'grammy/types';
import { Theme } from '@prisma/client';

const ASSETS_DIR = join(process.cwd(), 'assets', 'themes');

/**
 * Short, human-friendly taglines per theme key — shown in the carousel caption
 * under the theme name so users understand *when* to pick each design.
 * Keyed by Theme.key; falls back to an empty string for unknown keys.
 */
export const THEME_TAGLINES: Record<string, string> = {
  modern_academic: 'Rasmiy va jiddiy — kurs ishi, diplom va seminar uchun',
  academic_formal: 'Rasmiy muhr uslubi — diplom himoyasi va ilmiy taqdimot uchun',
  premium_academic: 'Qogʻoz-oq fon, nafis serif sarlavhalar — ilmiy maqola uslubida',
  soft_curves_research: 'Yumshoq egri shakllar, lilac va teal — zamonaviy akademik mavzular uchun',
  editorial_minimal: 'Sof va minimalist — kam bezak, koʻp havo',
  dark_premium: 'Toʻq fon, zamonaviy — texnologik mavzular uchun',
  bold_editorial: 'Yorqin va dadil sarlavhalar — eʼtibor tortadi',
  soft_pastel: 'Yumshoq pastel ranglar — ijodiy taqdimotlar uchun',
  bento_modern: 'Bento panellar — maʼlumotga boy, tartibli tuzilma',
};

/** In-memory cache of Telegram file_ids so carousel navigation avoids re-uploading. */
const fileIdCache = new Map<string, string>();

/** Absolute path to a theme's preview image (may not exist on disk). */
function previewPath(theme: Theme): string {
  return join(ASSETS_DIR, `${theme.key}.png`);
}

/** True when a theme has a preview image available to display in the carousel. */
export function hasThemePreview(theme: Theme): boolean {
  return existsSync(previewPath(theme));
}

/** Keep only themes that can actually be shown as a photo, preserving order. */
export function displayableThemes(themes: Theme[]): Theme[] {
  return themes.filter(hasThemePreview);
}

/**
 * Preview source for a theme: a cached Telegram file_id when we've uploaded it
 * before (instant, no re-upload), otherwise a fresh local file upload.
 */
export function themePreviewSource(theme: Theme): string | InputFile {
  return fileIdCache.get(theme.key) ?? new InputFile(previewPath(theme));
}

/** Remember the file_id Telegram assigned after we sent/edited a preview photo. */
export function rememberThemeFileId(key: string, fileId: string | undefined): void {
  if (fileId) fileIdCache.set(key, fileId);
}

/** Caption for a single carousel frame: position indicator + name + tagline (HTML). */
export function themeCaption(theme: Theme, index: number, total: number): string {
  const tagline = THEME_TAGLINES[theme.key] ?? '';
  const pos = `\u{1F3A8} Dizayn  ·  ${index + 1} / ${total}`;
  const body = tagline ? `<b>${theme.name}</b>\n${tagline}` : `<b>${theme.name}</b>`;
  return `${pos}\n\n${body}`;
}

/** Build a Telegram album of theme preview images (legacy fallback; skips missing). */
export function buildThemePreviewMedia(themes: Theme[]): InputMediaPhoto[] {
  const media: InputMediaPhoto[] = [];
  themes.forEach((t, i) => {
    if (!hasThemePreview(t)) return;
    media.push({
      type: 'photo',
      media: new InputFile(previewPath(t)),
      caption: `${i + 1}. ${t.name}`,
    });
  });
  return media;
}
