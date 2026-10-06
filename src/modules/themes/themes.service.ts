import { Injectable } from '@nestjs/common';
import { Theme } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

/**
 * Themes offered to users for NEW presentations. The other rows (older
 * designs being retired — modern_academic, academic_formal, editorial_minimal,
 * bold_editorial, soft_pastel, bento_modern) are deliberately kept in the DB
 * (not deleted) — real historical presentations still reference them via
 * `Presentation.themeId`, and deleting the row would break re-export for
 * those. `findByKey()` stays unrestricted so old presentations keep
 * resolving their theme correctly; only the picker list is filtered.
 */
const ACTIVE_THEME_KEYS = new Set(['dark_premium', 'premium_academic', 'soft_curves_research']);

@Injectable()
export class ThemesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Theme[]> {
    const all = await this.prisma.theme.findMany({ orderBy: { createdAt: 'asc' } });
    return all.filter((t) => ACTIVE_THEME_KEYS.has(t.key));
  }

  findByKey(key: string): Promise<Theme | null> {
    return this.prisma.theme.findUnique({ where: { key } });
  }
}
