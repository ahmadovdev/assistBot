import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const themes: Array<{ key: string; name: string; config: Prisma.InputJsonValue }> = [
  { key: 'aurora', name: '\u{1F303} Midnight Aurora', config: {
      key: 'aurora', style: 'aurora', bg: '#161a26', surface: '#20243a', surface2: '#2a3047',
      accent: '#ec4899', accent2: '#8b5cf6', text: '#e8eaf0', muted: '#9aa1b2',
      fontHeading: 'Playfair Display', fontBody: 'Inter' } },
  { key: 'editorial', name: '\u{1F4F0} Bold Editorial', config: {
      key: 'editorial', style: 'editorial', bg: '#f7f3ec', surface: '#efe9df', surface2: '#e6dfd2',
      accent: '#ff3b1f', accent2: '#15120d', text: '#15120d', muted: '#7c756a',
      fontHeading: 'Archivo', fontBody: 'Inter' } },
  { key: 'bento', name: '\u{1F9E9} Bento', config: {
      key: 'bento', style: 'bento', bg: '#0e1014', surface: '#181b22', surface2: '#1f2330',
      accent: '#34d399', accent2: '#22d3ee', text: '#f2f4f5', muted: '#8b93a1',
      fontHeading: 'Space Grotesk', fontBody: 'Inter' } },
  { key: 'softglass', name: '\u{1F388} Soft Glass', config: {
      key: 'softglass', style: 'softglass', bg: '#ece9ff', surface: '#ffffff', surface2: '#f3f0ff',
      accent: '#7c6cf0', accent2: '#ff8fab', text: '#2b2740', muted: '#6f6a86',
      fontHeading: 'Fraunces', fontBody: 'Inter' } },
  { key: 'earthy', name: '\u{1F342} Earthy Warm', config: {
      key: 'earthy', style: 'earthy', bg: '#f3ece1', surface: '#e8ddcb', surface2: '#ded2bd',
      accent: '#c4622d', accent2: '#3c6e57', text: '#2e2a22', muted: '#7a7264',
      fontHeading: 'Spectral', fontBody: 'Inter' } },
];

async function main(): Promise<void> {
  for (const t of themes) {
    await prisma.theme.upsert({ where: { key: t.key }, create: t, update: { name: t.name, config: t.config } });
  }
  // remove old themes no longer offered
  await prisma.theme.deleteMany({ where: { key: { notIn: themes.map((t) => t.key) } } });
  console.log(`Seeded ${themes.length} themes`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
