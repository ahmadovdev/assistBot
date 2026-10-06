import { cardSchemaByType } from './card.schemas';

describe('structured slide density contracts', () => {
  it('requires either no stats or a complete 3-4 figure evidence set', () => {
    const base = {
      title: 'Asosiy ko‘rsatkichlar',
      subtitle: 'Ushbu ko‘rsatkichlar mavzuning umumiy holatini birgalikda ko‘rsatadi.',
      insight: 'Ko‘rsatkichlar o‘rtasidagi bog‘lanish asosiy yo‘nalishni ochib beradi.',
      source: 'Statistika agentligi, 2025',
    };
    const item = {
      value: '42',
      unit: '%',
      label: 'qamrov darajasi',
      description: 'hisobot davridagi umumiy ulush',
    };

    expect(cardSchemaByType.STATS.safeParse({ ...base, stats: [] }).success).toBe(true);
    expect(cardSchemaByType.STATS.safeParse({ ...base, stats: [item, item] }).success).toBe(false);
    expect(cardSchemaByType.STATS.safeParse({ ...base, stats: [item, item, item] }).success).toBe(true);
  });

  it('rejects label-like problem and solution fragments', () => {
    const parsed = cardSchemaByType.PROBLEMS_SOLUTIONS.safeParse({
      title: 'Muammolar va yechimlar',
      pairs: [
        { problem: 'Suv isrofi', solution: 'Hisoblagich o‘rnatish' },
        { problem: 'Eski infratuzilma', solution: 'Tizimni yangilash' },
      ],
    });

    expect(parsed.success).toBe(false);
  });

  it('gives roomy process slides more text without relaxing dense five-step slides', () => {
    const threeStep = {
      title: 'Jarayon izchil bosqichlarda bajariladi',
      steps: Array.from({ length: 3 }, (_, index) => ({
        title: `Bosqich ${index + 1}`,
        body: 'Ushbu bosqichning mazmuni sabab, bajariladigan amal va olinadigan natija bilan batafsil tushuntiriladi.',
      })),
    };
    const fiveStep = {
      ...threeStep,
      steps: Array.from({ length: 5 }, (_, index) => ({
        title: `Bosqich ${index + 1}`,
        body: 'Ushbu besh bosqichli jarayonda juda uzun izoh zich kompozitsiyaga sig‘masligi sababli qayta yozilishi kerak.',
      })),
    };

    expect(cardSchemaByType.PROCESS.safeParse(threeStep).success).toBe(true);
    expect(cardSchemaByType.PROCESS.safeParse(fiveStep).success).toBe(false);
  });
});
