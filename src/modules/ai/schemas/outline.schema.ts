import { z } from 'zod';
import { TIER1_LAYOUTS } from '../layout.catalog';

export const outlineSchema = z.object({
  deck_title: z.string().min(1),
  slides: z
    .array(
      z.object({
        position: z.number().int().positive(),
        layout: z.enum(TIER1_LAYOUTS),
        title: z.string().min(1),
        key_points: z.array(z.string()).default([]),
      }),
    )
    .min(1),
});

export type Outline = z.infer<typeof outlineSchema>;
