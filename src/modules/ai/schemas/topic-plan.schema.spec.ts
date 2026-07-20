import { buildTopicPlanSchema, TopicPlan } from './topic-plan.schema';
import { applyPlannedTypes } from '../../generation/outline.service';
import { Outline } from './outline.schema';

const plan: TopicPlan = {
  topicKind: 'technical',
  explanationMode: 'show_process',
  density: 'standard',
  sequence: [
    { position: 1, type: 'TITLE', purpose: 'Mavzuni tanishtirish' },
    { position: 2, type: 'AGENDA', purpose: 'Taqdimot yo‘nalishini ko‘rsatish' },
    { position: 3, type: 'PROCESS', purpose: 'Jarayon bosqichlarini tushuntirish' },
    { position: 4, type: 'CLOSING', purpose: 'Taqdimotni yakunlash' },
  ],
};

describe('planning ownership', () => {
  it('rejects adjacent duplicate types in the planner contract', () => {
    const invalid = {
      ...plan,
      sequence: plan.sequence.map((item) => ({ ...item })),
    };
    invalid.sequence[2].type = 'AGENDA';

    const result = buildTopicPlanSchema(4).safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('makes planner types authoritative while preserving outline copy', () => {
    const outline: Outline = {
      deck_title: 'Algoritm jarayoni',
      slides: [
        { position: 1, type: 'TITLE', title: 'Algoritm jarayoni', key_points: [] },
        { position: 2, type: 'CONTENT', title: 'Reja', key_points: ['Tushuncha', 'Jarayon'] },
        { position: 3, type: 'CONTENT', title: 'Asosiy bosqichlar', key_points: ['Kirish', 'Qayta ishlash'] },
        { position: 4, type: 'CLOSING', title: 'Rahmat', key_points: [] },
      ],
    };

    const result = applyPlannedTypes(outline, plan);
    expect(result.slides.map((slide) => slide.type)).toEqual([
      'TITLE',
      'AGENDA',
      'PROCESS',
      'CLOSING',
    ]);
    expect(result.slides[2].title).toBe('Asosiy bosqichlar');
  });
});
