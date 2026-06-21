import { z } from 'zod';
import { SlideType } from '../layout.catalog';

const kv = z.object({ value: z.string().min(1), label: z.string().min(1) });

const title = z.object({
  kicker: z.string().optional(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  meta: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })).max(4).default([]),
});

const stats = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  stats: z.array(kv).min(2).max(5),
});

const problem = z.object({
  kicker: z.string().optional(),
  statement: z.string().min(1),
  context: z.array(z.object({ value: z.string().min(1), description: z.string().min(1) })).max(3).default([]),
});

const insight = z.object({
  kicker: z.string().optional(),
  statement: z.string().min(1),
  body: z.string().optional(),
});

const sideCol = z.object({
  label: z.string().min(1),
  title: z.string().optional(),
  items: z.array(z.string().min(1)).min(2).max(5),
});
const comparison = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  before: sideCol,
  after: sideCol,
});

const process = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  steps: z.array(z.object({ label: z.string().optional(), title: z.string().min(1), body: z.string().min(1) })).min(2).max(5),
});

const timeline = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  steps: z.array(z.object({ date: z.string().min(1), title: z.string().min(1), body: z.string().min(1) })).min(2).max(5),
});

const solution = z.object({
  kicker: z.string().optional(),
  title: z.string().min(1),
  body: z.string().optional(),
  features: z.array(z.object({ title: z.string().min(1), body: z.string().min(1) })).max(3).default([]),
});

const opportunity = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  big: kv,
  supports: z.array(kv).max(4).default([]),
});

const caseStudy = z.object({
  kicker: z.string().optional(),
  title: z.string().min(1),
  body: z.string().min(1),
  customer: z.string().optional(),
  metrics: z.array(kv).min(2).max(4),
});

const quote = z.object({
  kicker: z.string().optional(),
  quote: z.string().min(1),
  author: z.object({ initials: z.string().min(1).max(3), name: z.string().min(1), role: z.string().min(1) }),
});

const roadmap = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  phases: z.array(z.object({
    date: z.string().min(1), title: z.string().min(1), body: z.string().min(1),
    items: z.array(z.string().min(1)).max(4).default([]),
  })).min(2).max(4),
});

const cta = z.object({
  kicker: z.string().optional(),
  title: z.string().min(1),
  body: z.string().optional(),
  actions: z.array(z.object({ label: z.string().min(1), primary: z.boolean().optional() })).min(1).max(3),
  footnote: z.string().optional(),
});

export const cardSchemaByType: Record<SlideType, z.ZodTypeAny> = {
  TITLE: title, STATS: stats, PROBLEM: problem, INSIGHT: insight, COMPARISON: comparison,
  PROCESS: process, TIMELINE: timeline, SOLUTION: solution, OPPORTUNITY: opportunity,
  CASE_STUDY: caseStudy, QUOTE: quote, ROADMAP: roadmap, CTA: cta,
};

export type CardContent = Record<string, unknown>;
