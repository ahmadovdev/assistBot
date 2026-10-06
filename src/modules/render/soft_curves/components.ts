import { icon } from '../templates/icons';

export const safe = (value: unknown): string => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

/** Generated copy may contain one supported emphasis tag. */
export function rich(value: unknown): string {
  return safe(value)
    .replace(/&lt;strong&gt;/g, '<strong>')
    .replace(/&lt;\/strong&gt;/g, '</strong>');
}

export function renderIcon(name: string | undefined): string {
  return icon(name, 21);
}

export function titleSize(value: unknown, max = 54, medium = 46, compact = 39): number {
  const length = String(value ?? '').length;
  if (length > 92) return compact;
  if (length > 62) return medium;
  return max;
}

export function columns(count: number, max = 4): number {
  return Math.max(1, Math.min(count, max));
}

