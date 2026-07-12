import { z } from 'zod';
import { SLIDE_TYPES } from '../layout.catalog';

export const outlineSchema = z.object({
  deck_title: z.string().min(1),
  slides: z
    .array(
      z.object({
        position: z.number().int().positive(),
        type: z.enum(SLIDE_TYPES),
        title: z.string().min(1),
        key_points: z.array(z.string()).default([]),
      }),
    )
    .min(1),
});

export type Outline = z.infer<typeof outlineSchema>;

export function buildOutlineSchema(slideCount: number): z.ZodType<Outline, any, any> {
  return outlineSchema.superRefine((data, ctx) => {
    if (data.slides.length !== slideCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['slides'],
        message: `slides must contain exactly ${slideCount} items`,
      });
    }

    data.slides.forEach((slide, index) => {
      const expected = index + 1;
      if (slide.position !== expected) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['slides', index, 'position'],
          message: `position must be ${expected}`,
        });
      }
    });

    const first = data.slides[0];
    if (first && first.type !== 'TITLE') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['slides', 0, 'type'],
        message: 'first slide must be TITLE',
      });
    }

    const lastIndex = data.slides.length - 1;
    const last = data.slides[lastIndex];
    if (last && last.type !== 'CLOSING') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['slides', lastIndex, 'type'],
        message: 'last slide must be CLOSING',
      });
    }

    if (data.slides.length <= 8) {
      const ritualTypes = new Set([
        'RELEVANCE',
        'AIM_TASKS',
        'OBJECT_SUBJECT',
        'REFERENCES',
      ]);
      const ritualCount = data.slides.filter((slide) => ritualTypes.has(slide.type)).length;
      if (ritualCount > 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['slides'],
          message: 'short decks must not overuse academic ritual slides',
        });
      }
    }
  });
}
