import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// key === themeId used by the render module (templates/theme.ts THEMES).
// NOTE: this array's rows are also what's DELETED (via the deleteMany below)
// if a key stops appearing here — do NOT remove an entry without first
// checking `Presentation.themeId` usage; real historical presentations
// reference these rows by FK, and deleting one they use will either fail
// (FK constraint) or break their re-export. To retire a theme from the
// picker WITHOUT touching the DB, edit `ACTIVE_THEME_KEYS` in
// src/modules/themes/themes.service.ts instead — that's how
// modern_academic/academic_formal/editorial_minimal/bold_editorial/
// soft_pastel/bento_modern were hidden (kept here, just not offered to
// new users).
const themes: Array<{ key: string; name: string; config: Prisma.InputJsonValue }> = [
  { key: 'modern_academic',   name: '\u{1F393} Akademik',          config: { id: 'modern_academic' } },
  { key: 'academic_formal',   name: '\u{1F3DB}\u{FE0F} Rasmiy',    config: { id: 'academic_formal' } },
  { key: 'premium_academic',  name: '\u{1F4DC} Nafis',             config: { id: 'premium_academic' } },
  { key: 'soft_curves_research', name: '\u{1FAE7} Soft Curves',     config: { id: 'soft_curves_research' } },
  { key: 'editorial_minimal', name: '\u{1F4D0} Editorial Minimal', config: { id: 'editorial_minimal' } },
  { key: 'dark_premium',      name: '\u{1F311} Dark Premium',      config: { id: 'dark_premium' } },
  { key: 'bold_editorial',    name: '\u{1F7E1} Bold Editorial',    config: { id: 'bold_editorial' } },
  { key: 'soft_pastel',       name: '\u{1F338} Soft Pastel',       config: { id: 'soft_pastel' } },
  { key: 'bento_modern',      name: '\u{1F9E9} Bento Modern',      config: { id: 'bento_modern' } },
];

async function main(): Promise<void> {
  for (const t of themes) {
    await prisma.theme.upsert({ where: { key: t.key }, create: t, update: { name: t.name, config: t.config } });
  }
  await prisma.theme.deleteMany({ where: { key: { notIn: themes.map((t) => t.key) } } });
  console.log(`Seeded ${themes.length} themes`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
