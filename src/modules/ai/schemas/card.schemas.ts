import { z } from 'zod';
import { Tier1Layout } from '../layout.catalog';

/** Reusable image slot: AI writes an English prompt; url is filled in Phase 6. */
const imageSlot = z.object({
  prompt: z.string().min(1),
  url: z.string().nullable().default(null),
});

const coverSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().min(1),
  tags: z.array(z.string()).max(4).default([]),
  image: imageSlot,
});

const leadParagraphSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  image: imageSlot.optional(),
});

const bulletListSchema = z.object({
  title: z.string().min(1),
  body: z.string().optional(),
  bullets: z.array(z.object({ text: z.string().min(1) })).min(2).max(6),
});

const statsGridSchema = z.object({
  title: z.string().min(1),
  body: z.string().optional(),
  stats: z
    .array(
      z.object({
        value: z.string().min(1),
        label: z.string().min(1),
        desc: z.string().optional(),
      }),
    )
    .min(2)
    .max(4),
});

const imageTextSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  points: z.array(z.string()).max(4).default([]),
  image: imageSlot,
  image_side: z.enum(['left', 'right']).default('right'),
});

const threeColumnsSchema = z.object({
  title: z.string().min(1),
  body: z.string().optional(),
  columns: z
    .array(
      z.object({
        heading: z.string().min(1),
        text: z.string().min(1),
        icon: z.string().optional(),
      }),
    )
    .length(3),
});

const splitConclusionSchema = z.object({
  title: z.string().min(1),
  summary: z
    .array(z.object({ heading: z.string().min(1), text: z.string().min(1) }))
    .min(2)
    .max(4),
  next_steps: z
    .array(z.object({ number: z.string().min(1), text: z.string().min(1) }))
    .min(1)
    .max(4),
});

export const cardSchemaByLayout: Record<Tier1Layout, z.ZodTypeAny> = {
  cover: coverSchema,
  lead_paragraph: leadParagraphSchema,
  bullet_list: bulletListSchema,
  stats_grid: statsGridSchema,
  image_text: imageTextSchema,
  three_columns: threeColumnsSchema,
  split_conclusion: splitConclusionSchema,
};

export type CardContent = Record<string, unknown>;
