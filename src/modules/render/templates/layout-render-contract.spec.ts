import { buildDeck } from './deck';
import { buildAcademicDeck } from '../academic/deck';
import { buildPremiumAcademicDeck } from '../premium_academic/deck';
import { buildSoftCurvesDeck } from '../soft_curves/deck';

function html(type: string, content: Record<string, unknown>): string {
  const document = buildDeck('dark_premium', [{ type, content }]);
  return document.slice(document.indexOf('<body>'));
}

describe('selected layout render contract', () => {
  it('renders the exact assigned dark premium variants', () => {
    expect(html('STATS', {
      layout: 'evidence_dashboard',
      title: 'Ko‘rsatkichlar',
      stats: [
        { value: '42', unit: '%', label: 'asosiy natija', description: 'Birinchi ko‘rsatkich' },
        { value: '18', unit: 'ta', label: 'qo‘shimcha dalil', description: 'Ikkinchi ko‘rsatkich' },
      ],
      insight: 'Raqamlar umumiy yo‘nalishni tushuntiradi.',
      source: 'Rasmiy hisobot',
    })).toContain('stats-evidence__hero');

    expect(html('MISOL', {
      layout: 'case_study',
      title: 'Misol',
      body: 'Amaliy holat izohi.',
    })).toContain('case-study');

    expect(html('CONTENT', {
      layout: 'changelog_lines',
      title: 'Mazmun',
      points: [{ text: 'Birinchi fikr' }, { text: 'Ikkinchi fikr' }],
    })).toContain('content-ledger');

    expect(html('PROCESS', {
      layout: 'switchback_path',
      title: 'Jarayon',
      steps: [{ title: 'Boshlash', body: 'Birinchi qadam.' }, { title: 'Yakun', body: 'Ikkinchi qadam.' }],
    })).toContain('process-path');

    expect(html('FINDING', {
      layout: 'research_brief',
      title: 'Natija',
      evidence: 'Tahlil natijasi.',
    })).toContain('finding-brief');

    expect(html('PROBLEMS_SOLUTIONS', {
      layout: 'matrix',
      title: 'Muammo va yechim',
      pairs: [{ problem: 'Muammo', solution: 'Yechim' }, { problem: 'Muammo 2', solution: 'Yechim 2' }],
    })).toContain('ps-matrix');
  });

  it('does not let a visual silently override an assigned content variant', () => {
    const content = {
      layout: 'changelog_lines',
      title: 'Mazmun',
      lead: 'Qisqa kirish.',
      points: [{ text: 'Birinchi fikr' }, { text: 'Ikkinchi fikr' }],
      visual: { provider: 'Lumio Geometry', query: 'topic', alt: 'visual', url: '' },
    };

    const rendered = html('CONTENT', content);
    expect(rendered).toContain('content-ledger');
    expect(rendered).not.toContain('ds-frame');
    expect(rendered).not.toContain('wm-split');
  });

  it('does not render a retired visual_split from older saved decks', () => {
    const rendered = html('CONTENT', {
      layout: 'visual_split',
      title: 'Mazmun',
      points: [{ text: 'Birinchi fikr' }, { text: 'Ikkinchi fikr' }],
      visual: { provider: 'Lumio Geometry', query: 'topic', alt: 'visual', url: '' },
    });

    expect(rendered).toContain('Birinchi fikr');
    expect(rendered).not.toContain('wm-split');
    expect(rendered).not.toContain('wm-visual--geometry');
  });

  it('ignores geometric visual payloads in every template engine', () => {
    const slide = {
      type: 'CONTENT',
      content: {
        title: 'Mazmun',
        lead: 'Qisqa kirish.',
        points: [{ text: 'Birinchi fikr' }, { text: 'Ikkinchi fikr' }],
        visual: { provider: 'Lumio Geometry', query: 'topic', alt: 'visual', url: '' },
      },
    };
    const documents = [
      buildDeck('dark_premium', [slide]),
      buildAcademicDeck('modern_academic', [slide]),
      buildPremiumAcademicDeck('premium_academic', [slide]),
      buildSoftCurvesDeck('soft_curves', [slide]),
    ];

    for (const rendered of documents) {
      expect(rendered).toContain('Birinchi fikr');
      expect(rendered).not.toContain('wm-visual--geometry');
      expect(rendered).not.toContain('Geometric decoration');
    }
  });

  it('honors an explicit default instead of forcing the dark variant', () => {
    const rendered = html('PROCESS', {
      layout: 'default',
      title: 'Jarayon',
      steps: [{ title: 'Boshlash', body: 'Birinchi qadam.' }, { title: 'Yakun', body: 'Ikkinchi qadam.' }],
    });

    expect(rendered).toContain('class="step"');
    expect(rendered).not.toContain('process-path');
  });

  it('keeps every dark prose slide visually distinct from definition', () => {
    const paragraph = 'Mavzuni mazmunan to‘liq ochib beradigan, tugallangan va o‘qilishi oson izoh.';
    const rendered = {
      content: html('CONTENT', { title: 'Mazmun', points: [], paragraph }),
      relevance: html('RELEVANCE', { title: 'Dolzarblik', points: [], paragraph }),
      detail: html('BATAFSIL', { title: 'Tahlil', body: '', paragraph }),
      example: html('MISOL', { title: 'Misol', body: '', paragraph }),
      conclusion: html('CONCLUSION', { title: 'Xulosa', points: [], paragraph }),
      definition: html('DEFINITION', { term: 'Tushuncha', definition: '', paragraph }),
    };

    expect(rendered.content).toContain('editorial-prose');
    expect(rendered.relevance).toContain('relevance-signal');
    expect(rendered.detail).toContain('analysis-prose');
    expect(rendered.example).toContain('case-study');
    expect(rendered.conclusion).toContain('conclusion-synthesis');
    expect(rendered.definition).toContain('ds-term');

    for (const type of ['content', 'relevance', 'detail', 'example', 'conclusion'] as const) {
      expect(rendered[type]).not.toContain('ds-frame');
      expect(rendered[type]).not.toContain('Termin dosyesi');
    }
  });

  it('renders every CONTENT and DEFINITION prose variant with its own structure', () => {
    const paragraph = [
      'Birinchi tugallangan gap mavzuning asosiy mazmunini ochadi.',
      'Ikkinchi tugallangan gap fikrni dalil va izoh bilan davom ettiradi.',
      'Uchinchi gap esa umumiy xulosani ma’noli tarzda yakunlaydi.',
    ].join(' ');

    const contentVariants = {
      editorial_prose: 'editorial-prose',
      chapter_columns: 'chapter-columns',
      focus_statement: 'focus-statement',
      open_manifesto: 'open-manifesto',
    };
    for (const [layout, className] of Object.entries(contentVariants)) {
      const rendered = html('CONTENT', { layout, title: 'Mazmun', points: [], paragraph });
      expect(rendered).toContain(className);
      expect(rendered).not.toContain('term-axis');
      expect(rendered).not.toContain('lexicon-split');
    }

    const definitionVariants = {
      term_axis: 'term-axis',
      lexicon_split: 'lexicon-split',
      concept_frame: 'concept-frame',
      glass_hero: 'ds-term',
    };
    for (const [layout, className] of Object.entries(definitionVariants)) {
      const rendered = html('DEFINITION', {
        layout,
        term: 'Moliyaviy savodxonlik',
        definition: '',
        paragraph,
      });
      expect(rendered).toContain(className);
      expect(rendered).not.toContain('editorial-prose');
      expect(rendered).not.toContain('chapter-columns');
    }
  });

  it('renders the selected Nafis CONTENT and DEFINITION structures', () => {
    const paragraph = 'Birinchi gap mazmunni ochadi. Ikkinchi gap fikrni dalil bilan davom ettiradi.';
    const render = (type: string, content: Record<string, unknown>) =>
      buildPremiumAcademicDeck('premium_academic', [{ type, content }]);

    expect(render('CONTENT', {
      layout: 'nafis_columns',
      title: 'Mazmun',
      points: [],
      paragraph,
    })).toContain('pa-editorial-article');
    expect(render('CONTENT', {
      layout: 'nafis_margin_note',
      title: 'Mazmun',
      points: [],
      paragraph,
    })).toContain('pa-margin-essay');
    expect(render('CONTENT', {
      layout: 'nafis_evidence_lines',
      title: 'Mazmun',
      points: [{ text: 'Birinchi fikr' }, { text: 'Ikkinchi fikr' }],
    })).toContain('pa-content-ledger');
    expect(render('DEFINITION', {
      layout: 'nafis_lexicon',
      term: 'Tushuncha',
      definition: '',
      paragraph,
    })).toContain('pa-lexicon-stage');
  });

  it('renders the selected Soft Curves CONTENT and DEFINITION structures', () => {
    const paragraph = 'Birinchi gap mazmunni ochadi. Ikkinchi gap fikrni dalil bilan davom ettiradi.';
    const render = (type: string, content: Record<string, unknown>) =>
      buildSoftCurvesDeck('soft_curves_research', [{ type, content }]);

    expect(render('CONTENT', {
      layout: 'curve_editorial',
      title: 'Mazmun',
      points: [],
      paragraph,
    })).toContain('sc-editorial-sheet');
    expect(render('CONTENT', {
      layout: 'curve_statement',
      title: 'Mazmun',
      points: [],
      paragraph,
    })).toContain('sc-statement-sheet');
    expect(render('CONTENT', {
      layout: 'curve_lanes',
      title: 'Mazmun',
      points: [{ text: 'Birinchi fikr' }, { text: 'Ikkinchi fikr' }],
    })).toContain('sc-content-lines');
    expect(render('DEFINITION', {
      layout: 'curve_lexicon',
      term: 'Tushuncha',
      definition: '',
      paragraph,
    })).toContain('sc-definition-stage');
  });
});
