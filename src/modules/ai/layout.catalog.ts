/** Tier-1 layout catalog. The LLM may only pick from these in the outline. */
export const TIER1_LAYOUTS = [
  'cover',
  'lead_paragraph',
  'bullet_list',
  'stats_grid',
  'image_text',
  'three_columns',
  'split_conclusion',
] as const;

export type Tier1Layout = (typeof TIER1_LAYOUTS)[number];

export const LAYOUT_EMOJI: Record<string, string> = {
  cover: '\u{1F3AC}',
  lead_paragraph: '\u{1F4DD}',
  bullet_list: '\u{1F4CB}',
  stats_grid: '\u{1F4CA}',
  image_text: '\u{1F5BC}',
  three_columns: '\u{1F5C2}',
  split_conclusion: '\u2705',
};
