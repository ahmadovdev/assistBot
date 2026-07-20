import { createDeckState, withSelectedLayout } from './layout-registry';

describe('layout variant registry', () => {
  it('stores the dark premium variants that the renderer actually uses', () => {
    const cases = [
      ['STATS', {
        title: 'Ko‘rsatkichlar',
        stats: [{ value: '42', label: 'natija', description: 'izoh' }],
      }, 'evidence_dashboard'],
      ['MISOL', { title: 'Misol', body: 'Izoh' }, 'case_study'],
      ['PROCESS', { title: 'Jarayon', steps: [{ title: 'A', body: 'B' }] }, 'switchback_path'],
      ['FINDING', { title: 'Natija', evidence: 'Dalil' }, 'research_brief'],
      ['PROBLEMS_SOLUTIONS', {
        title: 'Muammo',
        pairs: [{ problem: 'A', solution: 'B' }, { problem: 'C', solution: 'D' }],
      }, 'matrix'],
    ] as const;

    for (const [type, content, expected] of cases) {
      const selected = withSelectedLayout(type, content, 'dark_premium', createDeckState());
      expect(selected.layout).toBe(expected);
    }
  });

  it('ignores retired geometric visual metadata during CONTENT selection', () => {
    const selected = withSelectedLayout('CONTENT', {
      title: 'Mazmun',
      points: [{ text: 'Birinchi' }, { text: 'Ikkinchi' }],
      visual: { provider: 'Lumio Geometry', query: 'topic', alt: 'visual', url: '' },
    }, 'dark_premium', createDeckState());

    expect(selected.layout).toBe('changelog_lines');
  });

  it('rotates prose CONTENT variants without repeating inside one deck', () => {
    const state = createDeckState();
    const content = {
      title: 'Mazmun',
      paragraph: 'To‘liq va tugallangan mazmuniy izoh.',
    };

    const layouts = Array.from({ length: 4 }, () =>
      withSelectedLayout('CONTENT', content, 'dark_premium', state).layout);

    expect(layouts).toEqual([
      'editorial_prose',
      'chapter_columns',
      'focus_statement',
      'open_manifesto',
    ]);
  });

  it('does not rotate into the default fallback while a matching concept exists', () => {
    const state = createDeckState();
    const stats = {
      title: 'Ko‘rsatkichlar',
      stats: [
        { value: '42', label: 'natija', description: 'Birinchi ko‘rsatkich izohi' },
        { value: '18', label: 'qamrov', description: 'Ikkinchi ko‘rsatkich izohi' },
        { value: '7', label: 'yo‘nalish', description: 'Uchinchi ko‘rsatkich izohi' },
      ],
    };

    const layouts = Array.from({ length: 2 }, () =>
      withSelectedLayout('STATS', stats, 'dark_premium', state).layout);

    expect(layouts).toEqual(['evidence_dashboard', 'evidence_dashboard']);
  });

  it('rotates term-first DEFINITION variants independently from CONTENT', () => {
    const state = createDeckState();
    const definition = {
      term: 'Moliyaviy savodxonlik',
      paragraph: 'Termin mazmunini to‘liq va tushunarli ochib beradigan ta’rif.',
    };

    const layouts = Array.from({ length: 3 }, () =>
      withSelectedLayout('DEFINITION', definition, 'dark_premium', state).layout);

    expect(layouts).toEqual(['term_axis', 'lexicon_split', 'concept_frame']);
  });

  it('rotates Nafis prose layouts without borrowing Soft Curves variants', () => {
    const state = createDeckState();
    const content = {
      title: 'Mazmun',
      paragraph: 'Tugallangan akademik izoh.',
    };

    const contentLayouts = Array.from({ length: 2 }, () =>
      withSelectedLayout('CONTENT', content, 'premium_academic', state).layout);
    const definitionLayout = withSelectedLayout('DEFINITION', {
      term: 'Tushuncha',
      paragraph: 'Termin uchun tugallangan ta’rif.',
    }, 'premium_academic', state).layout;

    expect(contentLayouts).toEqual(['nafis_columns', 'nafis_margin_note']);
    expect(definitionLayout).toBe('nafis_lexicon');
  });

  it('rotates Soft Curves prose layouts without borrowing Nafis variants', () => {
    const state = createDeckState();
    const content = {
      title: 'Mazmun',
      paragraph: 'Tugallangan va o‘qilishi oson izoh.',
    };

    const contentLayouts = Array.from({ length: 2 }, () =>
      withSelectedLayout('CONTENT', content, 'soft_curves_research', state).layout);
    const definitionLayout = withSelectedLayout('DEFINITION', {
      term: 'Tushuncha',
      paragraph: 'Termin uchun tugallangan ta’rif.',
    }, 'soft_curves_research', state).layout;

    expect(contentLayouts).toEqual(['curve_editorial', 'curve_statement']);
    expect(definitionLayout).toBe('curve_lexicon');
  });
});
