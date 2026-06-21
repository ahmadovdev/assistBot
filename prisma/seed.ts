import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// key === themeId used by the render module (templates/theme.ts THEMES).
const themes: Array<{ key: string; name: string; config: Prisma.InputJsonValue }> = [
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
