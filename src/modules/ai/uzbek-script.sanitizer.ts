/**
 * Fixes stray Cyrillic characters the model occasionally leaks into otherwise-Latin
 * Uzbek output (e.g. a case suffix typed in Cyrillic: "to'siqlarга" instead of "to'siqlarga").
 * Character-level substitution, not full Cyrillic-text transliteration — it assumes the
 * surrounding text is already Latin Uzbek and only a few glyphs slipped through.
 */
const CYR_TO_LAT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i',
  й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
  у: 'u', ф: 'f', х: 'x', ц: 's', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '\'', ы: 'i', э: 'e',
  ю: 'yu', я: 'ya', ь: '', ғ: 'g\'', қ: 'q', ҳ: 'h', ў: 'o\'',
};

const CYR_PATTERN = new RegExp(
  `[${Object.keys(CYR_TO_LAT).join('')}${Object.keys(CYR_TO_LAT).join('').toUpperCase()}]`,
  'g',
);

function transliterateChar(ch: string): string {
  const lower = ch.toLowerCase();
  const mapped = CYR_TO_LAT[lower];
  if (mapped === undefined) return ch;
  if (ch === lower) return mapped;
  return mapped.charAt(0).toUpperCase() + mapped.slice(1);
}

function sanitizeString(s: string): string {
  return CYR_PATTERN.test(s) ? s.replace(CYR_PATTERN, transliterateChar) : s;
}

/** Recursively replaces stray Cyrillic characters with Latin Uzbek equivalents in any JSON-like value. */
export function sanitizeUzbekScript<T>(value: T): T {
  if (typeof value === 'string') {
    return sanitizeString(value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeUzbekScript(v)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = sanitizeUzbekScript(v);
    }
    return out as unknown as T;
  }
  return value;
}
