import { existsSync } from 'fs';
import { join } from 'path';
import { InputFile } from 'grammy';
import type { InputMediaPhoto } from 'grammy/types';
import { Theme } from '@prisma/client';

const ASSETS_DIR = join(process.cwd(), 'assets', 'themes');

/** Build a Telegram album of theme preview images (skips any missing file). */
export function buildThemePreviewMedia(themes: Theme[]): InputMediaPhoto[] {
  const media: InputMediaPhoto[] = [];
  themes.forEach((t, i) => {
    const file = join(ASSETS_DIR, `${t.key}.png`);
    if (!existsSync(file)) return;
    media.push({
      type: 'photo',
      media: new InputFile(file),
      caption: `${i + 1}. ${t.name}`,
    });
  });
  return media;
}
