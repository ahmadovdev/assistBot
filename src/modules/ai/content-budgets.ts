/**
 * PROCESS uses different geometry for different step counts. Keep this budget
 * shared by generation and validation so a roomy 2-3 step slide is not forced
 * into the same text limit as a dense 5-step slide.
 */
export const PROCESS_BODY_MAX_BY_COUNT = {
  2: 150,
  3: 140,
  4: 112,
  5: 86,
} as const;

export function processBodyMax(stepCount: number): number {
  const count = Math.min(5, Math.max(2, Math.round(stepCount)));
  return PROCESS_BODY_MAX_BY_COUNT[count as keyof typeof PROCESS_BODY_MAX_BY_COUNT];
}
