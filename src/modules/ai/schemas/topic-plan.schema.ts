import { z } from 'zod';
import { SLIDE_TYPES } from '../layout.catalog';

const TOPIC_KINDS = [
  'conceptual',
  'legal',
  'historical',
  'technical',
  'economic',
  'comparative',
  'process',
  'research',
  'literary',
  'mixed',
] as const;

const EXPLANATION_MODES = [
  'teach_concept',
  'classify',
  'compare',
  'show_process',
  'show_history',
  'analyze_problem',
  'present_research',
] as const;

const slideType = z.enum(SLIDE_TYPES);

export const topicPlanSchema = z.object({
  topicKind: z.enum(TOPIC_KINDS),
  explanationMode: z.enum(EXPLANATION_MODES),
  density: z.enum(['compact', 'standard', 'detailed']),
  sequence: z.array(z.object({
    position: z.number().int().positive(),
    type: slideType,
    purpose: z.string().min(1).max(140),
  }).strict()),
}).strict();

export type TopicPlan = z.infer<typeof topicPlanSchema>;

export function buildTopicPlanSchema(slideCount: number): z.ZodType<TopicPlan, any, any> {
  return topicPlanSchema.superRefine((data, ctx) => {
    if (data.sequence.length !== slideCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sequence'],
        message: `sequence must contain exactly ${slideCount} items`,
      });
    }

    data.sequence.forEach((item, index) => {
      const expected = index + 1;
      if (item.position !== expected) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['sequence', index, 'position'],
          message: `position must be ${expected}`,
        });
      }
      if (index > 0 && item.type === data.sequence[index - 1]?.type) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['sequence', index, 'type'],
          message: 'adjacent planned slide types must be different',
        });
      }
    });

    const first = data.sequence[0];
    if (first && first.type !== 'TITLE') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sequence', 0, 'type'],
        message: 'first planned slide must be TITLE',
      });
    }

    const lastIndex = data.sequence.length - 1;
    const last = data.sequence[lastIndex];
    if (last && last.type !== 'CLOSING') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sequence', lastIndex, 'type'],
        message: 'last planned slide must be CLOSING',
      });
    }
  });
}
