import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const themes: Array<{ key: string; name: string; config: Prisma.InputJsonValue }> = [
  {
    key: 'midnight',
    name: '\u{1F303} Midnight',
    config: {
      bg: '#1a1d29',
      surface: '#232735',
      accent: '#ec4899',
      text: '#e5e7eb',
      muted: '#9ca3af',
      fontHeading: 'Playfair Display',
      fontBody: 'Inter',
    },
  },
  {
    key: 'corporate',
    name: '\u{1F535} Corporate',
    config: {
      bg: '#0f172a',
      surface: '#1e293b',
      accent: '#3b82f6',
      text: '#f1f5f9',
      muted: '#94a3b8',
      fontHeading: 'Poppins',
      fontBody: 'Inter',
    },
  },
  {
    key: 'minimal',
    name: '\u26AA Minimal',
    config: {
      bg: '#ffffff',
      surface: '#f8fafc',
      accent: '#111827',
      text: '#111827',
      muted: '#6b7280',
      fontHeading: 'Inter',
      fontBody: 'Inter',
    },
  },
];

async function main(): Promise<void> {
  for (const t of themes) {
    await prisma.theme.upsert({
      where: { key: t.key },
      create: t,
      update: { name: t.name, config: t.config },
    });
  }
  console.log(`Seeded ${themes.length} themes`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
