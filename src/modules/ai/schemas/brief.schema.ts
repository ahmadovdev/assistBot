import { z } from 'zod';

/**
 * The deck brief is the shared backbone generated ONCE after the outline,
 * then injected into every card prompt so slides stay coherent, deep and
 * non-repetitive (and cite the same facts instead of inventing their own).
 */
export const briefSchema = z.object({
  thesis: z.string().min(1),
  narrative: z.string().min(1),
  keyFacts: z.array(z.string().min(1)).min(2).max(6).default([]),
  slideFocus: z
    .array(
      z.object({
        position: z.number().int().positive(),
        focus: z.string().min(1),
      }),
    )
    .default([]),

  // ============================================================
  // V2 fields — additive, all optional. Existing consumers (card
  // generation reads only thesis/narrative/keyFacts/slideFocus today) are
  // unaffected whether or not the model returns these. They exist so a
  // future card-prompt pass can use them without another schema migration.
  // ============================================================

  /** Key terms the deck should define consistently (so DEFINITION-type
   *  slides and inline mentions don't drift in wording across the deck). */
  terms: z
    .array(z.object({ term: z.string().min(1), meaning: z.string().min(1) }))
    .max(8)
    .optional(),
  /** Slide positions whose claim would benefit from a real citation — a
   *  planning signal, NOT permission to invent one. `required: false` means
   *  "nice to have if the topic naturally has one," not "make one up." */
  sourceNeeds: z
    .array(
      z.object({
        position: z.number().int().positive(),
        need: z.string().min(1),
        required: z.boolean(),
      }),
    )
    .max(10)
    .optional(),
  contentDepth: z.enum(['compact', 'standard', 'detailed']).optional(),
  visualStrategy: z.enum(['minimal', 'academic', 'visual-rich', 'premium']).optional(),
  renderIntent: z
    .object({
      defaultContentMode: z.enum(['cards', 'prose']).optional(),
      themeId: z.string().optional(),
      pptxMode: z.enum(['editable', 'hybrid', 'pixelPerfect']).optional(),
    })
    .optional(),
});

export type DeckBrief = z.infer<typeof briefSchema>;

export function buildBriefSchema(positions: number[]): z.ZodType<DeckBrief, any, any> {
  const expected = new Set(positions);
  return briefSchema.superRefine((data, ctx) => {
    const seen = new Set<number>();

    data.slideFocus.forEach((item, index) => {
      if (!expected.has(item.position)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['slideFocus', index, 'position'],
          message: 'slideFocus position must exist in the outline',
        });
      }
      if (seen.has(item.position)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['slideFocus', index, 'position'],
          message: 'slideFocus positions must be unique',
        });
      }
      seen.add(item.position);
    });

    for (const position of positions) {
      if (!seen.has(position)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['slideFocus'],
          message: `slideFocus is missing position ${position}`,
        });
      }
    }
  });
}
